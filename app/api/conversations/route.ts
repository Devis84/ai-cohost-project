
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

 import { NextResponse } from "next/server";

import {
  getConversationHistory,
  markConversationRead,
} from "@/lib/services/conversation-service";
import { supabaseServer } from "@/lib/supabase/supabase-server";

type ConversationRecord = {
  id?: string;
  conversation_id?: string | null;
  property_id?: string | null;
  message?: string | null;
  content?: string | null;
  last_message?: string | null;
  role?: string | null;
  last_sender?: string | null;
  created_at?: string | null;
  last_message_at?: string | null;
  priority?: string | null;
  requires_host?: boolean | null;
  issue_detected?: string | null;
  unread_count?: number | null;
};

type MessageRecord = {
  id?: string;
  conversation_id?: string | null;
  property_id?: string | null;
  role?: string | null;
  message?: string | null;
  content?: string | null;
  created_at?: string | null;
  priority?: string | null;
  requires_host?: boolean | null;
  issue_detected?: string | null;
};

function normalizeMessage(record: MessageRecord) {
  return {
    id:
      record.id ||
      `${record.conversation_id || "conversation"}-${record.created_at || Date.now()}`,

    conversation_id:
      record.conversation_id || null,

    property_id:
      record.property_id || null,

    role:
      record.role || "assistant",

    message:
      record.message ||
      record.content ||
      "",

    content:
      record.content ||
      record.message ||
      "",

    created_at:
      record.created_at ||
      new Date().toISOString(),

    priority:
      record.priority || null,

    requires_host:
      record.requires_host || false,

    issue_detected:
      record.issue_detected || null,
  };
}

function normalizeConversationAsMessage(record: ConversationRecord) {
  return {
    id:
      record.id ||
      `${record.conversation_id || "conversation"}-${record.created_at || Date.now()}`,

    conversation_id:
      record.conversation_id || null,

    property_id:
      record.property_id || null,

    role:
      record.last_sender ||
      record.role ||
      "assistant",

    message:
      record.last_message ||
      record.message ||
      record.content ||
      "",

    content:
      record.last_message ||
      record.message ||
      record.content ||
      "",

    created_at:
      record.last_message_at ||
      record.created_at ||
      new Date().toISOString(),

    priority:
      record.priority || null,

    requires_host:
      record.requires_host || false,

    issue_detected:
      record.issue_detected || null,
  };
}

async function loadMessagesByConversationId(conversationId: string) {
  try {
    const history =
      await getConversationHistory(conversationId, 100);

    const normalized =
      (history || []) as MessageRecord[];

    if (normalized.length > 0) {
      return normalized.map(normalizeMessage);
    }
  } catch (error) {
    console.error(
      "GET CONVERSATION HISTORY SERVICE FAILED:",
      error
    );
  }

  try {
    const { data, error } = await supabaseServer
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "GET MESSAGES BY CONVERSATION ERROR:",
        error
      );

      return [];
    }

    return ((data || []) as MessageRecord[]).map(
      normalizeMessage
    );
  } catch (error) {
    console.error(
      "GET MESSAGES BY CONVERSATION FAILED:",
      error
    );

    return [];
  }
}

async function loadMessagesByPropertyId(propertyId: string) {
  try {
    const { data, error } = await supabaseServer
      .from("messages")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "GET MESSAGES BY PROPERTY ERROR:",
        error
      );

      return [];
    }

    return ((data || []) as MessageRecord[]).map(
      normalizeMessage
    );
  } catch (error) {
    console.error(
      "GET MESSAGES BY PROPERTY FAILED:",
      error
    );

    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const propertyId =
      searchParams.get("property_id");

    const conversationId =
      searchParams.get("conversation_id");

    if (conversationId) {
      const { data: conversation } =
        await supabaseServer
          .from("conversations")
          .select("*")
          .eq("conversation_id", conversationId)
          .maybeSingle();

      const messages =
        await loadMessagesByConversationId(conversationId);

      return NextResponse.json({
        success: true,
        conversation,
        messages,
        conversations: messages,
      });
    }

    if (propertyId) {
      const { data: conversationsData } =
        await supabaseServer
          .from("conversations")
          .select("*")
          .eq("property_id", propertyId)
          .order("created_at", {
            ascending: false,
          });

      const conversations =
        (conversationsData || []) as ConversationRecord[];

      const messages =
        await loadMessagesByPropertyId(propertyId);

      if (messages.length > 0) {
        return NextResponse.json({
          success: true,
          conversations,
          messages,
        });
      }

      return NextResponse.json({
        success: true,
        conversations:
          conversations.map(normalizeConversationAsMessage),
        messages:
          conversations.map(normalizeConversationAsMessage),
      });
    }

    const { data, error } = await supabaseServer
      .from("conversations")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      conversations: data || [],
    });
  } catch (error) {
    console.error("GET /api/conversations ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        conversations: [],
        messages: [],
        error:
          error instanceof Error
            ? error.message
            : "Unable to load conversations",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const conversationId =
      body.conversationId ||
      body.conversation_id;

    if (!conversationId) {
      return NextResponse.json(
        {
          success: false,
          error: "conversationId is required",
        },
        { status: 400 }
      );
    }

    const action = body.action || "mark_read";

    if (action === "mark_read") {
      try {
        const conversation =
          await markConversationRead(conversationId);

        return NextResponse.json({
          success: true,
          conversation,
        });
      } catch (error) {
        console.error(
          "MARK CONVERSATION READ SERVICE FAILED:",
          error
        );
      }
    }

    const { data, error } = await supabaseServer
      .from("conversations")
      .update({
        unread_count: 0,
      })
      .eq("conversation_id", conversationId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      conversation: data,
    });
  } catch (error) {
    console.error("PATCH /api/conversations ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update conversation",
      },
      { status: 500 }
    );
  }
}
