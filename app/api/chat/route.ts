
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
      description?: string | null;
      amenities?: string | null;
      house_rules?: string | null;
      parking?: string | null;
      trash?: string | null;
      ac?: string | null;
      boiler?: string | null;
      restaurants?: string | null;
      transport?: string | null;
      local_guide?: string | null;
      emergency?: string | null;
      checkout_notes?: string | null;
      extra_notes?: string | null;
    };
    ai_training?: {
      faq?: string | null;
      troubleshooting?: string | null;
      guest_style?: string | null;
      hidden_notes?: string | null;
      additional_notes?: string | null;
    };
  } | null;
};

type PromptProperty = {
  id?: string;
  property_name?: string;
  slug?: string;
  city?: string;
  country?: string;
  address?: string;
  wifi_name?: string;
  wifi_password?: string;
  checkin_time?: string;
  checkout_time?: string;
  checkin_instructions?: string;
  lockbox_code?: string;
  emergency_numbers?: string;
  house_rules?: string;
  description?: string;
  amenities?: string;
  parking_info?: string;
  local_info?: string;
  emergency_info?: string;
  ai_knowledge?: string;
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
  };
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing-key",
});

function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizePropertyForPrompt(
  property: PropertyRecord
): PromptProperty {
  return {
    id: property.id,
    property_name:
      property.property_name || "Untitled property",
    slug: safeString(property.slug),
    city: safeString(property.city),
    country: safeString(property.country),
    address: safeString(property.address),
    wifi_name: safeString(property.wifi_name),
    wifi_password: safeString(property.wifi_password),
    checkin_time: safeString(property.checkin_time),
    checkout_time: safeString(property.checkout_time),
    checkin_instructions:
      safeString(property.checkin_instructions),
    lockbox_code: safeString(property.lockbox_code),
    emergency_numbers:
      safeString(property.emergency_numbers),
    house_rules: safeString(property.house_rules),
    description: safeString(property.description),
    amenities: safeString(property.amenities),
    parking_info: safeString(property.parking_info),
    local_info: safeString(property.local_info),
    emergency_info: safeString(property.emergency_info),
    ai_knowledge: safeString(property.ai_knowledge),
    knowledge_base: {
      welcome_book: {
        description:
          safeString(
            property.knowledge_base?.welcome_book?.description
          ),
        amenities:
          safeString(
            property.knowledge_base?.welcome_book?.amenities
          ),
        house_rules:
          safeString(
            property.knowledge_base?.welcome_book?.house_rules
          ),
        parking:
          safeString(
            property.knowledge_base?.welcome_book?.parking
          ),
        trash:
          safeString(
            property.knowledge_base?.welcome_book?.trash
          ),
        ac:
          safeString(
            property.knowledge_base?.welcome_book?.ac
          ),
        boiler:
          safeString(
            property.knowledge_base?.welcome_book?.boiler
          ),
        restaurants:
          safeString(
            property.knowledge_base?.welcome_book?.restaurants
          ),
        transport:
          safeString(
            property.knowledge_base?.welcome_book?.transport
          ),
        local_guide:
          safeString(
            property.knowledge_base?.welcome_book?.local_guide
          ),
        emergency:
          safeString(
            property.knowledge_base?.welcome_book?.emergency
          ),
        checkout_notes:
          safeString(
            property.knowledge_base?.welcome_book?.checkout_notes
          ),
        extra_notes:
          safeString(
            property.knowledge_base?.welcome_book?.extra_notes
          ),
      },
      ai_training: {
        faq:
          safeString(
            property.knowledge_base?.ai_training?.faq
          ),
        troubleshooting:
          safeString(
            property.knowledge_base?.ai_training?.troubleshooting
          ),
        guest_style:
          safeString(
            property.knowledge_base?.ai_training?.guest_style
          ),
        hidden_notes:
          safeString(
            property.knowledge_base?.ai_training?.hidden_notes
          ),
        additional_notes:
          safeString(
            property.knowledge_base?.ai_training?.additional_notes
          ),
      },
    },
  };
}

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
      "enter",
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
      "For emergencies, call the local emergency number."
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

async function tryInsertNotification(
  payloads: Record<string, unknown>[]
) {
  for (const payload of payloads) {
    const { data, error } = await supabaseServer
      .from("notifications")
      .insert(payload)
      .select("*")
      .maybeSingle();

    if (!error) {
      return data;
    }

    console.error(
      "CREATE NOTIFICATION ATTEMPT FAILED:",
      error
    );
  }

  return null;
}

async function tryInsertIssue(
  payloads: Record<string, unknown>[]
) {
  for (const payload of payloads) {
    const { data, error } = await supabaseServer
      .from("issues")
      .insert(payload)
      .select("*")
      .maybeSingle();

    if (!error) {
      return data;
    }

    console.error(
      "CREATE ISSUE ATTEMPT FAILED:",
      error
    );
  }

  return null;
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

  await tryInsertNotification([
    {
      property_id: propertyId,
      conversation_id: conversationId,
      type: "guest_issue",
      title,
      message,
      priority,
      read: false,
      created_at: now,
    },
    {
      property_id: propertyId,
      conversation_id: conversationId,
      title,
      message,
      priority,
      created_at: now,
    },
    {
      property_id: propertyId,
      title,
      message,
      created_at: now,
    },
  ]);

  const issue = await tryInsertIssue([
    {
      property_id: propertyId,
      conversation_id: conversationId,
      issue_type: issueType || "guest_issue",
      priority,
      severity: priority,
      status: "open",
      description: message,
      message,
      created_at: now,
    },
    {
      property_id: propertyId,
      conversation_id: conversationId,
      issue_type: issueType || "guest_issue",
      priority,
      status: "open",
      description: message,
      created_at: now,
    },
    {
      property_id: propertyId,
      conversation_id: conversationId,
      severity: priority,
      status: "open",
      message,
      created_at: now,
    },
    {
      property_id: propertyId,
      status: "open",
      description: message,
      created_at: now,
    },
    {
      property_id: propertyId,
      message,
      created_at: now,
    },
  ]);

  if (!issue) {
    console.error("CREATE ISSUE FAILED COMPLETELY");
  }

  return issue;
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
      buildKnowledgePrompt(
        normalizePropertyForPrompt(property)
      );

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
