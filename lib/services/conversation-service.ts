 import { randomUUID } from "crypto";

import { supabaseServer } from "@/lib/supabase/supabase-server";

export type MessageRole =
  | "user"
  | "assistant"
  | "system"
  | "guest"
  | "host";

type ConversationInput = {
  conversationId?: string;
  propertyId: string;
  guestName?: string;
  guestContact?: string;
  channel?: string;
};

type SaveMessageInput = {
  conversationId: string;
  propertyId: string;
  role: MessageRole;
  content: string;
  channel?: string;
  priority?: string;
  requiresHost?: boolean;
  issueDetected?: string | null;
};

type UpdateConversationInput = {
  conversationId: string;
  propertyId: string;
  lastMessage: string;
  lastSender: string;
  channel?: string;
  priority?: string;
  requiresHost?: boolean;
  issueDetected?: string | null;
  status?: string;
  unreadCount?: number;
  guestName?: string;
  guestContact?: string;
};

type ConversationRecord = {
  id?: string;
  conversation_id?: string | null;
  property_id?: string | null;
  guest_name?: string | null;
  guest_contact?: string | null;
  channel?: string | null;
  unread_count?: number | null;
};

export function normalizeConversationId(
  conversationId?: string
) {
  return conversationId?.trim() || randomUUID();
}

export async function findConversation(
  conversationId: string
) {
  const { data, error } = await supabaseServer
    .from("conversations")
    .select("*")
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (error) {
    console.error("FIND CONVERSATION ERROR:", error);
    return null;
  }

  return data as ConversationRecord | null;
}

async function tryInsertConversation(payloads: Record<string, unknown>[]) {
  for (const payload of payloads) {
    const { data, error } = await supabaseServer
      .from("conversations")
      .insert(payload)
      .select("*")
      .maybeSingle();

    if (!error) {
      return data;
    }

    console.error("CREATE CONVERSATION ATTEMPT FAILED:", error);
  }

  return null;
}

async function tryUpdateConversation({
  conversationId,
  existingId,
  payloads,
}: {
  conversationId: string;
  existingId?: string;
  payloads: Record<string, unknown>[];
}) {
  for (const payload of payloads) {
    const query = supabaseServer
      .from("conversations")
      .update(payload)
      .select("*");

    const { data, error } = existingId
      ? await query.eq("id", existingId).maybeSingle()
      : await query
          .eq("conversation_id", conversationId)
          .maybeSingle();

    if (!error) {
      return data;
    }

    console.error("UPDATE CONVERSATION ATTEMPT FAILED:", error);
  }

  return null;
}

async function tryInsertMessage(payloads: Record<string, unknown>[]) {
  for (const payload of payloads) {
    const { data, error } = await supabaseServer
      .from("messages")
      .insert(payload)
      .select("*")
      .maybeSingle();

    if (!error) {
      return data;
    }

    console.error("SAVE MESSAGE ATTEMPT FAILED:", error);
  }

  return null;
}

export async function findOrCreateConversation({
  conversationId,
  propertyId,
  guestName,
  guestContact,
  channel = "web",
}: ConversationInput) {
  const finalConversationId =
    normalizeConversationId(conversationId);

  const existing =
    await findConversation(finalConversationId);

  if (existing) {
    return {
      conversation: existing,
      conversationId: finalConversationId,
      created: false,
    };
  }

  const now = new Date().toISOString();

  const fullPayload = {
    conversation_id: finalConversationId,
    property_id: propertyId,
    guest_name: guestName || null,
    guest_contact: guestContact || null,
    channel,
    status: "open",
    priority: "normal",
    requires_host: false,
    issue_detected: null,
    unread_count: 0,
    last_sender: null,
    last_message: null,
    last_message_at: now,
    created_at: now,
  };

  const mediumPayload = {
    conversation_id: finalConversationId,
    property_id: propertyId,
    guest_name: guestName || null,
    guest_contact: guestContact || null,
    channel,
    status: "open",
    unread_count: 0,
    created_at: now,
  };

  const minimalPayload = {
    conversation_id: finalConversationId,
    property_id: propertyId,
    created_at: now,
  };

  const data = await tryInsertConversation([
    fullPayload,
    mediumPayload,
    minimalPayload,
  ]);

  if (!data) {
    console.error("CREATE CONVERSATION FAILED COMPLETELY");

    return {
      conversation: null,
      conversationId: finalConversationId,
      created: false,
    };
  }

  return {
    conversation: data,
    conversationId: finalConversationId,
    created: true,
  };
}

export async function getConversationHistory(
  conversationId: string,
  limit = 20
) {
  const { data, error } = await supabaseServer
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", {
      ascending: true,
    })
    .limit(limit);

  if (error) {
    console.error("GET CONVERSATION HISTORY ERROR:", error);
    return [];
  }

  return data || [];
}

export async function saveConversationMessage({
  conversationId,
  propertyId,
  role,
  content,
  channel = "web",
  priority = "normal",
  requiresHost = false,
  issueDetected = null,
}: SaveMessageInput) {
  const normalizedRole =
    role === "guest" ? "user" : role;

  const now = new Date().toISOString();

  const fullContentPayload = {
    conversation_id: conversationId,
    property_id: propertyId,
    role: normalizedRole,
    content,
    channel,
    priority,
    requires_host: requiresHost,
    issue_detected: issueDetected,
    created_at: now,
  };

  const fullMessagePayload = {
    conversation_id: conversationId,
    property_id: propertyId,
    role: normalizedRole,
    message: content,
    channel,
    priority,
    requires_host: requiresHost,
    issue_detected: issueDetected,
    created_at: now,
  };

  const mediumContentPayload = {
    conversation_id: conversationId,
    property_id: propertyId,
    role: normalizedRole,
    content,
    created_at: now,
  };

  const mediumMessagePayload = {
    conversation_id: conversationId,
    property_id: propertyId,
    role: normalizedRole,
    message: content,
    created_at: now,
  };

  const minimalContentPayload = {
    conversation_id: conversationId,
    role: normalizedRole,
    content,
    created_at: now,
  };

  const minimalMessagePayload = {
    conversation_id: conversationId,
    role: normalizedRole,
    message: content,
    created_at: now,
  };

  const data = await tryInsertMessage([
    fullContentPayload,
    fullMessagePayload,
    mediumContentPayload,
    mediumMessagePayload,
    minimalContentPayload,
    minimalMessagePayload,
  ]);

  if (!data) {
    console.error("SAVE MESSAGE FAILED COMPLETELY");
    return null;
  }

  return data;
}

export async function updateConversationPreview({
  conversationId,
  propertyId,
  lastMessage,
  lastSender,
  channel = "web",
  priority = "normal",
  requiresHost = false,
  issueDetected = null,
  status = "open",
  unreadCount,
  guestName,
  guestContact,
}: UpdateConversationInput) {
  const existing =
    await findConversation(conversationId);

  const currentUnread =
    existing?.unread_count || 0;

  const finalUnreadCount =
    typeof unreadCount === "number"
      ? unreadCount
      : lastSender === "guest" || lastSender === "user"
        ? currentUnread + 1
        : currentUnread;

  const now = new Date().toISOString();

  const fullPayload = {
    conversation_id: conversationId,
    property_id: propertyId,
    guest_name:
      guestName || existing?.guest_name || null,
    guest_contact:
      guestContact || existing?.guest_contact || null,
    channel:
      channel || existing?.channel || "web",
    role: lastSender,
    message: lastMessage,
    last_message: lastMessage,
    last_sender: lastSender,
    last_message_at: now,
    priority,
    requires_host: requiresHost,
    issue_detected: issueDetected,
    status,
    unread_count: finalUnreadCount,
  };

  const mediumPayload = {
    conversation_id: conversationId,
    property_id: propertyId,
    role: lastSender,
    message: lastMessage,
    last_message: lastMessage,
    last_sender: lastSender,
    last_message_at: now,
    status,
    unread_count: finalUnreadCount,
  };

  const minimalPayload = {
    conversation_id: conversationId,
    property_id: propertyId,
    message: lastMessage,
    last_message: lastMessage,
    unread_count: finalUnreadCount,
  };

  if (existing?.id || existing?.conversation_id) {
    const updated = await tryUpdateConversation({
      conversationId,
      existingId: existing?.id,
      payloads: [
        fullPayload,
        mediumPayload,
        minimalPayload,
      ],
    });

    if (updated) {
      return updated;
    }
  }

  const inserted = await tryInsertConversation([
    {
      ...fullPayload,
      created_at: now,
    },
    {
      ...mediumPayload,
      created_at: now,
    },
    {
      ...minimalPayload,
      created_at: now,
    },
  ]);

  if (!inserted) {
    console.error("UPSERT CONVERSATION PREVIEW FAILED COMPLETELY");
    return null;
  }

  return inserted;
}

export async function markConversationRead(
  conversationId: string
) {
  const { data, error } = await supabaseServer
    .from("conversations")
    .update({
      unread_count: 0,
    })
    .eq("conversation_id", conversationId)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("MARK CONVERSATION READ ERROR:", error);
    return null;
  }

  return data;
}