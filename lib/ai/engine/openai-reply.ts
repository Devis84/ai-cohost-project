 import OpenAI from "openai";

import { createFallbackReply } from "@/lib/ai/engine/fallback-reply";
import {
  getGuestLanguageInstruction,
  getLocalizedSensitiveAccessReply,
} from "@/lib/ai/engine/language";
import {
  buildGuestScopedPrompt,
  type PropertyRecordForHospitality,
} from "@/lib/ai/engine/hospitality";
import { isGuestPortalChannel } from "@/lib/ai/engine/property";
import { sanitizeGuestPortalReply } from "@/lib/ai/engine/safety";

type ChatHistoryMessage = {
  role?: string;
  content?: string;
  message?: string;
};

type OpenAIChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing-key",
});

function normalizeOpenAIRole(role?: string): "user" | "assistant" {
  return role === "assistant" ? "assistant" : "user";
}

function buildOpenAIHistory(history: ChatHistoryMessage[]): OpenAIChatMessage[] {
  return history
    .filter((item) => Boolean(item.content || item.message))
    .map((item) => ({
      role: normalizeOpenAIRole(item.role),
      content: item.content || item.message || "",
    }));
}

function shouldUseFallback() {
  const apiKey = process.env.OPENAI_API_KEY;
  return !apiKey || apiKey === "missing-key";
}

export async function getAIReply({
  message,
  property,
  history,
  channel,
}: {
  message: string;
  property: PropertyRecordForHospitality;
  history: ChatHistoryMessage[];
  channel: string;
}) {
  const isGuestPortal = isGuestPortalChannel(channel);
  const hideSensitiveAccessInfo = isGuestPortal;
  const sensitiveAccessReply = getLocalizedSensitiveAccessReply(message);

  if (shouldUseFallback()) {
    return createFallbackReply({
      message,
      property,
      hideSensitiveAccessInfo,
      sensitiveAccessReply,
    });
  }

  try {
    const languageInstruction = isGuestPortal
      ? getGuestLanguageInstruction(message)
      : "Reply in the same language as the guest when possible.";

    const systemPrompt = buildGuestScopedPrompt({
      property,
      languageInstruction,
      hideSensitiveAccessInfo,
    });

    const messages: OpenAIChatMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...buildOpenAIHistory(history),
      {
        role: "user",
        content: message,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: isGuestPortal ? 0.1 : 0.2,
      max_tokens: isGuestPortal ? 420 : 700,
      messages,
    });

    const reply =
      completion.choices[0]?.message?.content ||
      createFallbackReply({
        message,
        property,
        hideSensitiveAccessInfo,
        sensitiveAccessReply,
      });

    if (!isGuestPortal) {
      return reply;
    }

    return sanitizeGuestPortalReply({
      reply,
      lockboxCode: property.lockbox_code,
      originalMessage: message,
    });
  } catch (error) {
    console.error("OPENAI ERROR - FALLING BACK TO LOCAL REPLY:", error);

    return createFallbackReply({
      message,
      property,
      hideSensitiveAccessInfo,
      sensitiveAccessReply,
    });
  }
}