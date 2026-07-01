import { detectEscalation } from "@/lib/ai/escalation";
import { findCachedAnswer, getCachePropertySlug, saveAnswerToCache } from "@/lib/ai/engine/cache";
import { chatSuccess } from "@/lib/ai/engine/chat-response";
import {
  resolveConversationContext,
  saveAssistantMessage,
  saveGuestMessage,
} from "@/lib/ai/engine/conversation";
import { createHostAlert } from "@/lib/ai/engine/escalation";
import { getLocalizedSensitiveAccessReply } from "@/lib/ai/engine/language";
import { getAIReply } from "@/lib/ai/engine/openai-reply";
import { findChatProperty, isGuestPortalChannel } from "@/lib/ai/engine/property";
import { evaluateGuestQuestionScope } from "@/lib/ai/engine/scope";
import { isSensitiveAccessRequest } from "@/lib/ai/engine/safety";

export type ChatEngineInput = {
  message: string;
  propertySlug?: string;
  propertyId?: string;
  conversationId?: string;
  guestName?: string;
  guestContact?: string;
  channel: string;
};

export async function runChatEngine(input: ChatEngineInput) {
  const property = await findChatProperty({
    propertySlug: input.propertySlug,
    propertyId: input.propertyId,
  });

  if (!property) {
    return {
      ok: false as const,
      status: 404,
      error: "Property not found",
    };
  }

  const { conversationId, history } = await resolveConversationContext({
    requestedConversationId: input.conversationId,
    propertyId: property.id,
    propertySlug: property.slug,
    guestName: input.guestName,
    guestContact: input.guestContact,
    channel: input.channel,
  });

  const escalation = detectEscalation(input.message);

  await saveGuestMessage({
    conversationId,
    propertyId: property.id,
    message: input.message,
    channel: input.channel,
    priority: escalation.priority,
    requiresHost: escalation.requires_host,
    issueDetected: escalation.issue_detected,
  });

  if (escalation.requires_host) {
    await createHostAlert({
      propertyId: property.id,
      conversationId,
      message: input.message,
      priority: escalation.priority,
      issueType: escalation.issue_type,
    });
  }

  if (isGuestPortalChannel(input.channel)) {
    if (isSensitiveAccessRequest(input.message)) {
      const reply = getLocalizedSensitiveAccessReply(input.message);

      await createHostAlert({
        propertyId: property.id,
        conversationId,
        message: input.message,
        priority: "medium",
        issueType: "access_request",
      });

      await saveAssistantMessage({
        conversationId,
        propertyId: property.id,
        reply,
        channel: input.channel,
        priority: "medium",
        requiresHost: true,
        issueDetected: "blocked_sensitive_access_request",
        status: "attention_required",
        unreadCount: 1,
        guestName: input.guestName,
        guestContact: input.guestContact,
      });

      return {
        ok: true as const,
        response: chatSuccess({
          reply,
          conversationId,
          escalation,
          blocked: true,
          blockedReason: "blocked_sensitive_access_request",
          usedFallback: false,
          cache: {
            used: false,
            reason: "sensitive_access_request",
          },
        }),
      };
    }

    const scope = evaluateGuestQuestionScope(input.message);

    if (!scope.allowed) {
      const reply =
        scope.reply || "I can only help with questions related to your stay.";

      await saveAssistantMessage({
        conversationId,
        propertyId: property.id,
        reply,
        channel: input.channel,
        priority: "normal",
        requiresHost: false,
        issueDetected: `blocked_guest_scope:${scope.reason}`,
        status: "open",
        unreadCount: 0,
        guestName: input.guestName,
        guestContact: input.guestContact,
      });

      return {
        ok: true as const,
        response: chatSuccess({
          reply,
          conversationId,
          escalation,
          blocked: true,
          blockedReason: scope.reason,
          usedFallback: false,
          cache: {
            used: false,
            reason: "blocked_guest_scope",
          },
        }),
      };
    }
  }

  const canUseCache =
    isGuestPortalChannel(input.channel) && !escalation.requires_host;

  const cachePropertySlug = getCachePropertySlug({
    property,
    propertySlug: input.propertySlug,
  });

  if (canUseCache) {
    const cachedAnswer = await findCachedAnswer({
      propertySlug: cachePropertySlug,
      question: input.message,
    });

    if (cachedAnswer) {
      const reply = cachedAnswer.answer;

      await saveAssistantMessage({
        conversationId,
        propertyId: property.id,
        reply,
        channel: input.channel,
        priority: escalation.priority,
        requiresHost: false,
        issueDetected: null,
        status: "open",
        unreadCount: 0,
        guestName: input.guestName,
        guestContact: input.guestContact,
      });

      return {
        ok: true as const,
        response: chatSuccess({
          reply,
          conversationId,
          escalation,
          blocked: false,
          usedFallback: false,
          cache: {
            used: true,
            id: cachedAnswer.id,
            question_normalized: cachedAnswer.question_normalized,
          },
        }),
      };
    }
  }

  const reply = await getAIReply({
    message: input.message,
    property,
    history,
    channel: input.channel,
  });

  await saveAssistantMessage({
    conversationId,
    propertyId: property.id,
    reply,
    channel: input.channel,
    priority: escalation.priority,
    requiresHost: escalation.requires_host,
    issueDetected: escalation.issue_detected,
    status: escalation.requires_host ? "attention_required" : "open",
    unreadCount: escalation.requires_host ? 1 : 0,
    guestName: input.guestName,
    guestContact: input.guestContact,
  });

  if (canUseCache) {
    await saveAnswerToCache({
      propertySlug: cachePropertySlug,
      question: input.message,
      answer: reply,
      channel: input.channel,
      source:
        !process.env.OPENAI_API_KEY ||
        process.env.OPENAI_API_KEY === "missing-key"
          ? "fallback_generated"
          : "ai_generated",
      metadata: {
        property_id: property.id,
        conversation_id: conversationId,
        escalation_priority: escalation.priority,
      },
    });
  }

  return {
    ok: true as const,
    response: chatSuccess({
      reply,
      conversationId,
      escalation,
      blocked: false,
      usedFallback:
        !process.env.OPENAI_API_KEY ||
        process.env.OPENAI_API_KEY === "missing-key",
      cache: {
        used: false,
        saved: canUseCache,
      },
    }),
  };
}