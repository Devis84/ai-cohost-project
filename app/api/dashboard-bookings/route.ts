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

    // If no properties, return empty bookings
    if (propertyIds.length === 0) {
      return NextResponse.json({
        success: true,
        bookings: {
          upcomingBookings: [],
          activeStays: [],
          completedStays: [],
          cancelledBookings: [],
        },
      });
    }

    // Fetch guest access tokens (which represent bookings/stays)
    const { data: guestTokens, error: tokensError } =
      await supabaseServer
        .from("guest_access_tokens")
        .select("*")
        .in("property_id", propertyIds)
        .order("checkin_date", { ascending: false });

    if (tokensError && tokensError.code !== "PGRST116") {
      throw new Error(
        `Failed to fetch bookings: ${tokensError.message}`
      );
    }

    // Fetch conversations for linking
    const { data: conversations, error: conversationsError } =
      await supabaseServer
        .from("conversations")
        .select("id, conversation_id, property_id, guest_name, last_message_at, status")
        .in("property_id", propertyIds);

    if (
      conversationsError &&
      conversationsError.code !== "PGRST116"
    ) {
      console.warn(
        "Failed to fetch conversations:",
        conversationsError.message
      );
    }

    // Fetch cleaning tasks for status linking
    const { data: cleaningTasks, error: cleaningError } =
      await supabaseServer
        .from("cleaning_tasks")
        .select("id, property_id, checkout_date, next_checkin_date, status")
        .in("property_id", propertyIds);

    if (cleaningError && cleaningError.code !== "PGRST116") {
      console.warn(
        "Failed to fetch cleaning tasks:",
        cleaningError.message
      );
    }

    // Process and categorize bookings
    const now = new Date();
    const upcomingBookings: any[] = [];
    const activeStays: any[] = [];
    const completedStays: any[] = [];
    const cancelledBookings: any[] = [];

    (guestTokens || []).forEach((token: any) => {
      const property = allProperties.find(
        (p) => p.id === token.property_id
      );

      if (!property) return;

      // Parse dates
      const checkinDate = token.checkin_date
        ? new Date(token.checkin_date)
        : null;
      const checkoutDate = token.checkout_date
        ? new Date(token.checkout_date)
        : null;

      // Find related conversation
      const conversation = (conversations || []).find(
        (c) =>
          c.property_id === token.property_id &&
          c.guest_name === token.guest_name
      );

      // Find related cleaning task
      const relatedCleaning = (cleaningTasks || []).find(
        (ct) =>
          ct.property_id === token.property_id &&
          ct.checkout_date === token.checkout_date
      );

      const booking = {
        id: token.id || token.stay_id || token.booking_id,
        stayId: token.stay_id || null,
        bookingId: token.booking_id || null,
        propertyId: token.property_id,
        propertyName: property.property_name || null,
        guestName: token.guest_name || "Guest",
        guestEmail: token.guest_email || null,
        guestPhone: token.guest_phone || null,
        guestContact: token.guest_contact || null,
        checkinDate: token.checkin_date,
        checkoutDate: token.checkout_date,
        status: token.status || "active",
        aiAccessStatus: token.status === "active"
          ? "available"
          : token.status === "expired"
            ? "expired"
            : "inactive",
        conversationCount: conversation ? 1 : 0,
        conversationId: conversation
          ? conversation.conversation_id || conversation.id
          : null,
        cleaningStatus: relatedCleaning?.status || "pending",
        source: token.source || null,
        externalEventId: token.external_event_id || null,
        metadata: token.metadata || {},
      };

      // Categorize by status and dates
      if (token.status === "cancelled") {
        cancelledBookings.push(booking);
      } else if (
        checkoutDate &&
        checkoutDate < now
      ) {
        completedStays.push(booking);
      } else if (
        checkinDate &&
        checkinDate <= now &&
        checkoutDate &&
        checkoutDate > now
      ) {
        activeStays.push(booking);
      } else if (
        checkinDate &&
        checkinDate > now
      ) {
        upcomingBookings.push(booking);
      }
    });

    // Sort by date
    upcomingBookings.sort(
      (a, b) =>
        new Date(a.checkinDate).getTime() -
        new Date(b.checkinDate).getTime()
    );

    activeStays.sort(
      (a, b) =>
        new Date(a.checkinDate).getTime() -
        new Date(b.checkinDate).getTime()
    );

    completedStays.sort(
      (a, b) =>
        new Date(b.checkoutDate).getTime() -
        new Date(a.checkoutDate).getTime()
    );

    return NextResponse.json({
      success: true,
      bookings: {
        upcomingBookings,
        activeStays,
        completedStays,
        cancelledBookings,
      },
    });
  } catch (error) {
    console.error("BOOKINGS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load bookings",
        bookings: {
          upcomingBookings: [],
          activeStays: [],
          completedStays: [],
          cancelledBookings: [],
        },
      },
      { status: 500 }
    );
  }
}
