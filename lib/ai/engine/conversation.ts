 import {
  findOrCreateConversation,
  getConversationHistory,
  saveConversationMessage,
  updateConversationPreview,
} from "@/lib/services/conversation-service";

export type ChatHistoryMessage = {
  role?: string;
  content?: string;
  message?: string;
};

export type ConversationContext = {
  conversationId: string;
  history: ChatHistoryMessage[];
};

type ConversationIdentity = {
  conversationId: string;
  propertyId: string;
  channel: string;
  guestName?: string;
  guestContact?: string;
};

export async function resolveConversationContext({
  requestedConversationId,
  propertyId,
  propertySlug,
  guestName,
  guestContact,
  channel,
}: {
  requestedConversationId?: string;
  propertyId: string;
  propertySlug?: string | null;
  guestName?: string;
  guestContact?: string;
  channel: string;
}): Promise<ConversationContext> {
  const fallbackConversationId =
    requestedConversationId || `guest_${propertySlug || propertyId}`;

  let conversationId = fallbackConversationId;

  try {
    const conversation = await findOrCreateConversation({
      conversationId: requestedConversationId,
      propertyId,
      guestName,
      guestContact,
      channel,
    });

    conversationId = conversation.conversationId;
  } catch (error) {
    console.error("FIND OR CREATE CONVERSATION FAILED:", error);
  }

  let history: ChatHistoryMessage[] = [];

  try {
    history = (await getConversationHistory(
      conversationId,
      20
    )) as ChatHistoryMessage[];
  } catch (error) {
    console.error("GET CONVERSATION HISTORY FAILED:", error);
  }

  return {
    conversationId,
    history,
  };
}

export async function saveGuestMessage({
  conversationId,
  propertyId,
  message,
  channel,
  priority,
  requiresHost,
  issueDetected,
  guestName,
  guestContact,
}: ConversationIdentity & {
  message: string;
  priority: string;
  requiresHost: boolean;
  issueDetected: string | null;
}) {
  try {
    await saveConversationMessage({
      conversationId,
      propertyId,
      role: "user",
      content: message,
      channel,
      priority,
      requiresHost,
      issueDetected,
    });
  } catch (error) {
    console.error("SAVE USER MESSAGE FAILED:", error);
  }

  try {
    await updateConversationPreview({
      conversationId,
      propertyId,
      lastMessage: message,
      lastSender: "guest",
      channel,
      priority,
      requiresHost,
      issueDetected,
      status: requiresHost ? "attention_required" : "open",
      guestName,
      guestContact,
    });
  } catch (error) {
    console.error("UPDATE CONVERSATION PREVIEW FAILED:", error);
  }
}

export async function saveAssistantMessage({
  conversationId,
  propertyId,
  reply,
  channel,
  priority,
  requiresHost,
  issueDetected,
  status,
  unreadCount,
  guestName,
  guestContact,
}: ConversationIdentity & {
  reply: string;
  priority: string;
  requiresHost: boolean;
  issueDetected: string | null;
  status?: string;
  unreadCount?: number;
}) {
  try {
    await saveConversationMessage({
      conversationId,
      propertyId,
      role: "assistant",
      content: reply,
      channel,
      priority,
      requiresHost,
      issueDetected,
    });
  } catch (error) {
    console.error("SAVE ASSISTANT MESSAGE FAILED:", error);
  }

  try {
    await updateConversationPreview({
      conversationId,
      propertyId,
      lastMessage: reply,
      lastSender: "assistant",
      channel,
      priority,
      requiresHost,
      issueDetected,
      status: status || (requiresHost ? "attention_required" : "open"),
      unreadCount,
      guestName,
      guestContact,
    });
  } catch (error) {
    console.error("UPDATE ASSISTANT PREVIEW FAILED:", error);
  }
}