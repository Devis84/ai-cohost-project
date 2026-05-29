 import { randomUUID } from "crypto"

import { supabaseServer } from "@/lib/supabase/supabase-server"

export type MessageRole =
  | "user"
  | "assistant"
  | "system"
  | "guest"
  | "host"

type ConversationInput = {
  conversationId?: string
  propertyId: string
  guestName?: string
  guestContact?: string
  channel?: string
}

type SaveMessageInput = {
  conversationId: string
  propertyId: string
  role: MessageRole
  content: string
  channel?: string
  priority?: string
  requiresHost?: boolean
  issueDetected?: string | null
}

type UpdateConversationInput = {
  conversationId: string
  propertyId: string
  lastMessage: string
  lastSender: string
  channel?: string
  priority?: string
  requiresHost?: boolean
  issueDetected?: string | null
  status?: string
  unreadCount?: number
  guestName?: string
  guestContact?: string
}

export function normalizeConversationId(
  conversationId?: string
) {
  return conversationId?.trim() || randomUUID()
}

export async function findConversation(
  conversationId: string
) {
  const { data, error } = await supabaseServer
    .from("conversations")
    .select("*")
    .eq("conversation_id", conversationId)
    .maybeSingle()

  if (error) {
    console.error("FIND CONVERSATION ERROR:", error)
    return null
  }

  return data
}

export async function findOrCreateConversation({
  conversationId,
  propertyId,
  guestName,
  guestContact,
  channel = "web",
}: ConversationInput) {
  const finalConversationId =
    normalizeConversationId(conversationId)

  const existing =
    await findConversation(finalConversationId)

  if (existing) {
    return {
      conversation: existing,
      conversationId: finalConversationId,
      created: false,
    }
  }

  const now = new Date().toISOString()

  const payload = {
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
    updated_at: now,
  }

  const { data, error } = await supabaseServer
    .from("conversations")
    .insert(payload)
    .select("*")
    .single()

  if (error) {
    console.error("CREATE CONVERSATION ERROR:", error)

    return {
      conversation: null,
      conversationId: finalConversationId,
      created: false,
    }
  }

  return {
    conversation: data,
    conversationId: finalConversationId,
    created: true,
  }
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
    .limit(limit)

  if (error) {
    console.error("GET CONVERSATION HISTORY ERROR:", error)
    return []
  }

  return data || []
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
    role === "guest" ? "user" : role

  const { data, error } = await supabaseServer
    .from("messages")
    .insert({
      conversation_id: conversationId,
      property_id: propertyId,
      role: normalizedRole,
      content,
      channel,
      priority,
      requires_host: requiresHost,
      issue_detected: issueDetected,
    })
    .select("*")
    .single()

  if (error) {
    console.error("SAVE MESSAGE ERROR:", error)
    return null
  }

  return data
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
    await findConversation(conversationId)

  const currentUnread =
    existing?.unread_count || 0

  const finalUnreadCount =
    typeof unreadCount === "number"
      ? unreadCount
      : lastSender === "guest" || lastSender === "user"
        ? currentUnread + 1
        : currentUnread

  const now = new Date().toISOString()

  const payload = {
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
    updated_at: now,
  }

  if (existing?.id) {
    const { data, error } = await supabaseServer
      .from("conversations")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single()

    if (error) {
      console.error("UPDATE CONVERSATION ERROR:", error)
      return null
    }

    return data
  }

  const { data, error } = await supabaseServer
    .from("conversations")
    .insert({
      ...payload,
      created_at: now,
    })
    .select("*")
    .single()

  if (error) {
    console.error("INSERT CONVERSATION ERROR:", error)
    return null
  }

  return data
}

export async function markConversationRead(
  conversationId: string
) {
  const { data, error } = await supabaseServer
    .from("conversations")
    .update({
      unread_count: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("conversation_id", conversationId)
    .select("*")
    .maybeSingle()

  if (error) {
    console.error("MARK CONVERSATION READ ERROR:", error)
    return null
  }

  return data
}