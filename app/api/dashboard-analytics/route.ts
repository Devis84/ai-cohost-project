export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/supabase-server";
import {
  filterPropertiesForAccess,
  getPartnerAccessContext,
  inactiveAccessResponse,
} from "@/lib/partner-access";

export async function GET(request: Request) {
  try {
    // Get access context (authentication, partner permissions)
    const accessContext = await getPartnerAccessContext(request);

    if (!accessContext.isActive) {
      return inactiveAccessResponse(accessContext);
    }

    // Get all properties (will be filtered by access control below)
    const { data: propertiesData, error: propertiesError } =
      await supabaseServer
        .from("properties")
        .select("id, slug, property_name");

    if (propertiesError) {
      throw new Error(
        `Failed to fetch properties: ${propertiesError.message}`
      );
    }

    // Filter properties based on user access rights
    const allProperties =
      await filterPropertiesForAccess(
        propertiesData || [],
        accessContext
      ) || [];

    const propertyIds = allProperties.map((p) => p.id);

    // If no properties, return empty metrics
    if (propertyIds.length === 0) {
      return NextResponse.json({
        success: true,
        metrics: {
          totalProperties: 0,
          totalConversations: 0,
          totalMessages: 0,
          guestMessages: 0,
          aiMessages: 0,
          mostActiveProperty: null,
          recentActivity: [],
          propertyStats: [],
        },
      });
    }

    // Fetch all conversations for these properties
    const { data: conversations, error: conversationsError } =
      await supabaseServer
        .from("conversations")
        .select("id, conversation_id, property_id, last_message_at, guest_name, status")
        .in("property_id", propertyIds)
        .order("last_message_at", { ascending: false });

    if (conversationsError && conversationsError.code !== "PGRST116") {
      throw new Error(
        `Failed to fetch conversations: ${conversationsError.message}`
      );
    }

    // Fetch all messages for these conversations
    const conversationIds = (conversations || []).map(
      (c) => c.conversation_id || c.id
    );

    let allMessages: {
      id?: string;
      conversation_id?: string | null;
      property_id?: string | null;
      role?: string | null;
      created_at?: string | null;
    }[] = [];

    if (conversationIds.length > 0) {
      const { data: messagesData, error: messagesError } =
        await supabaseServer
          .from("messages")
          .select(
            "id, conversation_id, property_id, role, created_at"
          )
          .in("conversation_id", conversationIds);

      if (
        messagesError &&
        messagesError.code !== "PGRST116"
      ) {
        throw new Error(
          `Failed to fetch messages: ${messagesError.message}`
        );
      }

      allMessages = messagesData || [];
    }

    // Calculate metrics
    const totalConversations =
      conversations?.length || 0;

    const totalMessages = allMessages.length;

    const guestMessages = allMessages.filter(
      (m) =>
        m.role === "user" ||
        m.role === "guest"
    ).length;

    const aiMessages = allMessages.filter(
      (m) =>
        m.role === "assistant" ||
        m.role === "ai"
    ).length;

    // Calculate per-property stats
    const propertyStats: {
      property_id: string | null;
      property_name: string | null;
      conversations: number;
      messages: number;
    }[] = [];

    propertyIds.forEach((propertyId) => {
      const propertyConversations = (
        conversations || []
      ).filter((c) => c.property_id === propertyId);

      const propertyMessages = allMessages.filter(
        (m) => m.property_id === propertyId
      );

      const property = allProperties.find(
        (p) => p.id === propertyId
      );

      propertyStats.push({
        property_id: propertyId,
        property_name: property?.property_name || null,
        conversations: propertyConversations.length,
        messages: propertyMessages.length,
      });
    });

    const mostActiveProperty = propertyStats.sort(
      (a, b) => (b.messages || 0) - (a.messages || 0)
    )[0] || null;

    // Recent activity (last 10 conversations)
    const recentActivity = (conversations || [])
      .slice(0, 10)
      .map((c) => {
        const property = allProperties.find(
          (p) => p.id === c.property_id
        );

        return {
          conversation_id:
            c.conversation_id || c.id,
          property_name: property?.property_name || null,
          guest_name: c.guest_name || null,
          last_message_at: c.last_message_at || null,
          status: c.status || "active",
        };
      });

    return NextResponse.json({
      success: true,
      metrics: {
        totalProperties: allProperties.length,
        totalConversations,
        totalMessages,
        guestMessages,
        aiMessages,
        mostActiveProperty,
        recentActivity,
        propertyStats,
      },
    });
  } catch (error) {
    console.error("ANALYTICS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load analytics",
      },
      { status: 500 }
    );
  }
}
