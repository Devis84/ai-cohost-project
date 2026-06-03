 import OpenAI from "openai";
import { NextResponse } from "next/server";

import { detectEscalation } from "@/lib/ai/escalation";
import { buildKnowledgePrompt } from "@/lib/ai/prompt-builder";
import {
  findOrCreateConversation,
  getConversationHistory,
  saveConversationMessage,
  updateConversationPreview,
} from "@/lib/services/conversation-service";
import { supabaseServer } from "@/lib/supabase/supabase-server";

type ChatRequestBody = {
  message?: string;
  propertySlug?: string;
  propertyId?: string;
  conversationId?: string;
  guestName?: string;
  guestContact?: string;
  channel?: string;
};

type ChatHistoryMessage = {
  role?: string;
  content?: string;
  message?: string;
};

type PropertyRecord = {
  id: string;
  property_name?: string | null;
  slug?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  wifi_name?: string | null;
  wifi_password?: string | null;
  checkin_time?: string | null;
  checkout_time?: string | null;
  checkin_instructions?: string | null;
  lockbox_code?: string | null;
  emergency_numbers?: string | null;
  house_rules?: string | null;
  description?: string | null;
  amenities?: string | null;
  parking_info?: string | null;
  local_info?: string | null;
  emergency_info?: string | null;
  ai_knowledge?: string | null;
  knowledge_base?: {
    welcome_book?: {
      description?: string;
      amenities?: string;
      house_rules?: string;
      parking?: string;
      trash?: string;
      ac?: string;
      boiler?: string;
      restaurants?: string;
      transport?: string;
      local_guide?: string;
      emergency?: string;
      checkout_notes?: string;
      extra_notes?: string;
    };
    ai_training?: {
      faq?: string;
      troubleshooting?: string;
      guest_style?: string;
      hidden_notes?: string;
      additional_notes?: string;
    };
  } | null;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing-key",
});

async function findProperty({
  propertySlug,
  propertyId,
}: {
  propertySlug?: string;
  propertyId?: string;
}) {
  if (propertyId) {
    const { data } = await supabaseServer
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .maybeSingle();

    if (data) {
      return data as PropertyRecord;
    }
  }

  if (propertySlug) {
    const cleanSlug =
      decodeURIComponent(propertySlug).trim();

    const { data: bySlug } = await supabaseServer
      .from("properties")
      .select("*")
      .eq("slug", cleanSlug)
      .maybeSingle();

    if (bySlug) {
      return bySlug as PropertyRecord;
    }

    const { data: byName } = await supabaseServer
      .from("properties")
      .select("*")
      .eq("property_name", cleanSlug)
      .maybeSingle();

    if (byName) {
      return byName as PropertyRecord;
    }
  }

  return null;
}

function normalizeOpenAIRole(role?: string) {
  if (role === "assistant") {
    return "assistant" as const;
  }

  return "user" as const;
}

function includesAny(message: string, words: string[]) {
  const lower = message.toLowerCase();

  return words.some((word) =>
    lower.includes(word.toLowerCase())
  );
}

function valueOrFallback(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function createFallbackReply(
  message: string,
  property: PropertyRecord
) {
  const welcome =
    property.knowledge_base?.welcome_book || {};

  const aiTraining =
    property.knowledge_base?.ai_training || {};

  const propertyName =
    property.property_name || "the property";

  if (
    includesAny(message, [
      "wifi",
      "wi-fi",
      "internet",
      "password",
      "network",
    ])
  ) {
    return `The WiFi network is "${valueOrFallback(
      property.wifi_name,
      "not available"
    )}" and the password is "${valueOrFallback(
      property.wifi_password,
      "not available"
    )}".`;
  }

  if (
    includesAny(message, [
      "check in",
      "check-in",
      "arrival",
      "arrive",
      "access",
      "lockbox",
      "key",
      "door",
      "open",
    ])
  ) {
    const checkinTime =
      valueOrFallback(property.checkin_time, "not available");

    const instructions =
      valueOrFallback(
        property.checkin_instructions,
        "No check-in instructions have been provided yet."
      );

    const lockbox = property.lockbox_code
      ? ` The lockbox code is ${property.lockbox_code}.`
      : "";

    return `Check-in is from ${checkinTime}. ${instructions}${lockbox}`;
  }

  if (
    includesAny(message, [
      "checkout",
      "check out",
      "leave",
      "departure",
    ])
  ) {
    const checkoutTime =
      valueOrFallback(property.checkout_time, "not available");

    const checkoutNotes =
      welcome.checkout_notes ||
      "Please make sure the door is locked and the keys are left as instructed.";

    return `Check-out is at ${checkoutTime}. ${checkoutNotes}`;
  }

  if (
    includesAny(message, [
      "park",
      "parking",
      "car",
      "garage",
    ])
  ) {
    return (
      welcome.parking ||
      property.parking_info ||
      "Parking information has not been provided yet."
    );
  }

  if (
    includesAny(message, [
      "rule",
      "rules",
      "smoking",
      "party",
      "quiet",
    ])
  ) {
    return (
      welcome.house_rules ||
      property.house_rules ||
      "House rules have not been provided yet."
    );
  }

  if (
    includesAny(message, [
      "restaurant",
      "food",
      "eat",
      "drink",
      "bar",
      "coffee",
    ])
  ) {
    return (
      welcome.restaurants ||
      "Restaurant recommendations have not been added yet."
    );
  }

  if (
    includesAny(message, [
      "transport",
      "bus",
      "taxi",
      "ferry",
      "airport",
    ])
  ) {
    return (
      welcome.transport ||
      "Transport information has not been added yet."
    );
  }

  if (
    includesAny(message, [
      "emergency",
      "urgent",
      "police",
      "hospital",
      "doctor",
    ])
  ) {
    return (
      property.emergency_numbers ||
      welcome.emergency ||
      property.emergency_info ||
      "For emergencies in Malta, call 112."
    );
  }

  if (
    includesAny(message, [
      "cockroach",
      "insect",
      "bug",
      "broken",
      "problem",
      "issue",
      "cannot",
      "can't",
      "not working",
    ])
  ) {
    return "I’m sorry about that. I’ve noted this as something that may require host attention. Please share any useful details or photos if available.";
  }

  const description =
    welcome.description ||
    property.description ||
    `${propertyName} is ready for your stay.`;

  const faq =
    aiTraining.faq ||
    property.ai_knowledge ||
    "";

  if (faq) {
    return `${description}\n\nUseful information: ${faq}`;
  }

  return `I can help with WiFi, check-in, parking, house rules, restaurants, transport and emergency information for ${propertyName}.`;
}

async function createHostAlert({
  propertyId,
  conversationId,
  message,
  priority,
  issueType,
}: {
  propertyId: string;
  conversationId: string;
  message: string;
  priority: string;
  issueType: string | null;
}) {
  const title =
    priority === "high"
      ? "Urgent guest issue detected"
      : "Guest issue detected";

  const now = new Date().toISOString();

  try {
    const notificationResponse =
      await supabaseServer
        .from("notifications")
        .insert({
          property_id: propertyId,
          conversation_id: conversationId,
          type: "guest_issue",
          title,
          message,
          priority,
          read: false,
          created_at: now,
        });

    if (notificationResponse.error) {
      console.error(
        "CREATE NOTIFICATION ERROR:",
        notificationResponse.error
      );
    }
  } catch (error) {
    console.error("CREATE NOTIFICATION FAILED:", error);
  }

  try {
    const issueResponse =
      await supabaseServer
        .from("issues")
        .insert({
          property_id: propertyId,
          conversation_id: conversationId,
          issue_type: issueType || "guest_issue",
          priority,
          status: "open",
          description: message,
          message,
          created_at: now,
        });

    if (issueResponse.error) {
      console.error(
        "CREATE ISSUE ERROR:",
        issueResponse.error
      );
    }
  } catch (error) {
    console.error("CREATE ISSUE FAILED:", error);
  }
}

async function getAIReply({
  message,
  property,
  history,
}: {
  message: string;
  property: PropertyRecord;
  history: ChatHistoryMessage[];
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === "missing-key") {
    return createFallbackReply(message, property);
  }

  try {
    const systemPrompt =
      buildKnowledgePrompt(property);

    const openAIHistory =
      history
        .filter((item) =>
          Boolean(item.content || item.message)
        )
        .map((item) => ({
          role: normalizeOpenAIRole(item.role),
          content: item.content || item.message || "",
        }));

    const completion =
      await openai.chat.completions.create({
        model:
          process.env.OPENAI_MODEL ||
          "gpt-4.1-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...openAIHistory,
          {
            role: "user",
            content: message,
          },
        ],
      });

    return (
      completion.choices[0]?.message?.content ||
      createFallbackReply(message, property)
    );
  } catch (error) {
    console.error(
      "OPENAI ERROR - FALLING BACK TO LOCAL REPLY:",
      error
    );

    return createFallbackReply(message, property);
  }
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as ChatRequestBody;

    const message = body.message?.trim();
    const propertySlug = body.propertySlug?.trim();
    const propertyId = body.propertyId?.trim();
    const channel = body.channel || "web";

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "message is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!propertySlug && !propertyId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "propertySlug or propertyId is required",
        },
        {
          status: 400,
        }
      );
    }

    const property = await findProperty({
      propertySlug,
      propertyId,
    });

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: "Property not found",
        },
        {
          status: 404,
        }
      );
    }

    const fallbackConversationId =
      body.conversationId ||
      `guest_${property.slug || property.id}`;

    let conversationId =
      fallbackConversationId;

    try {
      const conversation =
        await findOrCreateConversation({
          conversationId: body.conversationId,
          propertyId: property.id,
          guestName: body.guestName,
          guestContact: body.guestContact,
          channel,
        });

      conversationId =
        conversation.conversationId;
    } catch (error) {
      console.error(
        "FIND OR CREATE CONVERSATION FAILED:",
        error
      );
    }

    let history: ChatHistoryMessage[] = [];

    try {
      history =
        (await getConversationHistory(
          conversationId,
          20
        )) as ChatHistoryMessage[];
    } catch (error) {
      console.error(
        "GET CONVERSATION HISTORY FAILED:",
        error
      );
    }

    const escalation =
      detectEscalation(message);

    try {
      await saveConversationMessage({
        conversationId,
        propertyId: property.id,
        role: "user",
        content: message,
        channel,
        priority: escalation.priority,
        requiresHost: escalation.requires_host,
        issueDetected: escalation.issue_detected,
      });
    } catch (error) {
      console.error(
        "SAVE USER MESSAGE FAILED:",
        error
      );
    }

    try {
      await updateConversationPreview({
        conversationId,
        propertyId: property.id,
        lastMessage: message,
        lastSender: "guest",
        channel,
        priority: escalation.priority,
        requiresHost: escalation.requires_host,
        issueDetected: escalation.issue_detected,
        status: escalation.requires_host
          ? "attention_required"
          : "open",
        guestName: body.guestName,
        guestContact: body.guestContact,
      });
    } catch (error) {
      console.error(
        "UPDATE CONVERSATION PREVIEW FAILED:",
        error
      );
    }

    if (escalation.requires_host) {
      await createHostAlert({
        propertyId: property.id,
        conversationId,
        message,
        priority: escalation.priority,
        issueType: escalation.issue_type,
      });
    }

    const reply = await getAIReply({
      message,
      property,
      history,
    });

    try {
      await saveConversationMessage({
        conversationId,
        propertyId: property.id,
        role: "assistant",
        content: reply,
        channel,
        priority: escalation.priority,
        requiresHost: false,
        issueDetected: null,
      });
    } catch (error) {
      console.error(
        "SAVE ASSISTANT MESSAGE FAILED:",
        error
      );
    }

    try {
      await updateConversationPreview({
        conversationId,
        propertyId: property.id,
        lastMessage: reply,
        lastSender: "assistant",
        channel,
        priority: escalation.priority,
        requiresHost: escalation.requires_host,
        issueDetected: escalation.issue_detected,
        status: escalation.requires_host
          ? "attention_required"
          : "open",
        unreadCount: escalation.requires_host ? 1 : 0,
        guestName: body.guestName,
        guestContact: body.guestContact,
      });
    } catch (error) {
      console.error(
        "UPDATE ASSISTANT PREVIEW FAILED:",
        error
      );
    }

    return NextResponse.json({
      success: true,
      reply,
      conversationId,
      escalation,
      usedFallback:
        !process.env.OPENAI_API_KEY ||
        process.env.OPENAI_API_KEY === "missing-key",
    });
  } catch (error) {
    console.error("CHAT API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while generating the AI reply",
      },
      {
        status: 500,
      }
    );
  }
}