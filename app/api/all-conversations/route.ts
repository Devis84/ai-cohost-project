 import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase/supabase-server";

type PropertyRecord = {
  id: string;
  property_name?: string | null;
  name?: string | null;
  city?: string | null;
};

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
  status?: string | null;
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

function getMessageText(record?: ConversationRecord | MessageRecord | null) {
  if (!record) {
    return null;
  }

  return record.last_message ||
    record.message ||
    record.content ||
    null;
}

function getRecordDate(record?: ConversationRecord | MessageRecord | null) {
  if (!record) {
    return null;
  }

  return record.last_message_at ||
    record.created_at ||
    null;
}

function getRecordSender(record?: ConversationRecord | MessageRecord | null) {
  if (!record) {
    return null;
  }

  return record.last_sender ||
    record.role ||
    null;
}

export async function GET() {
  try {
    const {
      data: propertiesData,
      error: propertiesError,
    } = await supabaseServer
      .from("properties")
      .select("*")
      .order("property_name", {
        ascending: true,
      });

    if (propertiesError) {
      throw propertiesError;
    }

    const {
      data: conversationsData,
      error: conversationsError,
    } = await supabaseServer
      .from("conversations")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (conversationsError) {
      throw conversationsError;
    }

    let messagesData: MessageRecord[] = [];

    try {
      const { data, error } = await supabaseServer
        .from("messages")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (!error && data) {
        messagesData = data as MessageRecord[];
      }

      if (error) {
        console.error(
          "GET /api/all-conversations messages warning:",
          error
        );
      }
    } catch (error) {
      console.error(
        "GET /api/all-conversations messages fallback failed:",
        error
      );
    }

    const properties =
      (propertiesData || []) as PropertyRecord[];

    const conversations =
      (conversationsData || []) as ConversationRecord[];

    const conversationsByProperty =
      new Map<string, ConversationRecord[]>();

    for (const conversation of conversations) {
      const propertyId = conversation.property_id;

      if (!propertyId) {
        continue;
      }

      if (!conversationsByProperty.has(propertyId)) {
        conversationsByProperty.set(propertyId, []);
      }

      conversationsByProperty
        .get(propertyId)
        ?.push(conversation);
    }

    const messagesByProperty =
      new Map<string, MessageRecord[]>();

    for (const message of messagesData) {
      const propertyId = message.property_id;

      if (!propertyId) {
        continue;
      }

      if (!messagesByProperty.has(propertyId)) {
        messagesByProperty.set(propertyId, []);
      }

      messagesByProperty
        .get(propertyId)
        ?.push(message);
    }

    const inbox = properties.map((property) => {
      const propertyConversations =
        conversationsByProperty.get(property.id) || [];

      const propertyMessages =
        messagesByProperty.get(property.id) || [];

      const latestConversation =
        propertyConversations[0] || null;

      const latestMessage =
        propertyMessages[0] || null;

      const conversationId =
        latestConversation?.conversation_id ||
        latestMessage?.conversation_id ||
        latestConversation?.id ||
        null;

      const source =
        latestConversation || latestMessage;

      const lastMessage =
        getMessageText(latestConversation) ||
        getMessageText(latestMessage);

      const createdAt =
        getRecordDate(latestConversation) ||
        getRecordDate(latestMessage);

      const role =
        getRecordSender(latestConversation) ||
        getRecordSender(latestMessage);

      const priority =
        latestConversation?.priority ||
        latestMessage?.priority ||
        "normal";

      const requiresHost =
        latestConversation?.requires_host ||
        latestMessage?.requires_host ||
        false;

      const issueDetected =
        latestConversation?.issue_detected ||
        latestMessage?.issue_detected ||
        null;

      return {
        propertyId: property.id,

        propertyName:
          property.property_name ||
          property.name ||
          "Untitled property",

        city: property.city || "",

        conversationId,
        conversation_id: conversationId,

        lastMessage,
        role,
        created_at: createdAt,

        priority,
        requires_host: requiresHost,
        issue_detected: issueDetected,

        unread_count:
          latestConversation?.unread_count ||
          (requiresHost ? 1 : 0),

        conversation_count:
          propertyConversations.length ||
          (conversationId ? 1 : 0),

        message_count:
          propertyMessages.length,

        status:
          latestConversation?.status ||
          null,

        sourceId:
          source?.id || null,
      };
    });

    return NextResponse.json({
      success: true,
      inbox,
    });
  } catch (error) {
    console.error("ALL CONVERSATIONS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        inbox: [],
        error:
          error instanceof Error
            ? error.message
            : "Unable to load inbox",
      },
      {
        status: 500,
      }
    );
  }
}