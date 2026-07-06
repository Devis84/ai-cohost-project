 export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type WhatsAppWebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: WhatsAppIncomingMessage[];
        statuses?: unknown[];
      };
    }>;
  }>;
};

type WhatsAppIncomingMessage = {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: {
    body?: string;
  };
};

type ChatApiResponse = {
  success?: boolean;
  reply?: string;
  error?: string;
};

type GuestAccessSettingsRecord = {
  enabled?: boolean | null;
  require_token_for_whatsapp?: boolean | null;
};

type GuestAccessTokenRecord = {
  id: string;
  token: string;
  property_slug: string;
  guest_phone?: string | null;
  guest_contact?: string | null;
  status?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
};

type WhatsAppAccessDecision = {
  checked: boolean;
  required: boolean;
  allowed: boolean;
  state: string;
  reason: string;
  guestAccessToken?: string;
};

function getVerifyToken() {
  return (
    process.env.WHATSAPP_VERIFY_TOKEN ||
    "ai-cohost-token"
  );
}

function getWebhookSecret() {
  return process.env.WHATSAPP_WEBHOOK_SECRET || "";
}

function getRequestWebhookSecret(request: Request) {
  const url = new URL(request.url);

  const querySecret =
    url.searchParams.get("secret") ||
    url.searchParams.get("webhook_secret") ||
    "";

  const headerSecret =
    request.headers.get("x-webhook-secret") ||
    request.headers.get("x-whatsapp-webhook-secret") ||
    "";

  const authorization =
    request.headers.get("authorization") || "";

  const bearerSecret = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice("bearer ".length).trim()
    : "";

  return querySecret || headerSecret || bearerSecret;
}

function isAuthorizedWebhookRequest(request: Request) {
  const expectedSecret = getWebhookSecret();

  if (!expectedSecret) {
    return false;
  }

  const requestSecret = getRequestWebhookSecret(request);

  return requestSecret === expectedSecret;
}

function getDefaultPropertySlug() {
  return (
    process.env.WHATSAPP_DEFAULT_PROPERTY_SLUG ||
    "maltese-maisonette"
  );
}

function getWhatsAppApiVersion() {
  return (
    process.env.WHATSAPP_GRAPH_API_VERSION ||
    "v18.0"
  );
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

function getIncomingMessage(
  body: WhatsAppWebhookBody
): WhatsAppIncomingMessage | null {
  return (
    body.entry?.[0]?.changes?.[0]?.value?.messages?.[0] ||
    null
  );
}

function getSafeReplyFallback() {
  return "Sorry, I could not answer right now. Please contact the host directly if this is urgent.";
}

function getGuestAccessRequiredReply() {
  return "This WhatsApp assistant is currently limited to guests with an active stay access. Please use the personal guest link sent by the host, or contact the host directly if you need help.";
}

function isTokenCurrentlyActive(token: GuestAccessTokenRecord) {
  if (token.status === "revoked" || token.status === "expired") {
    return false;
  }

  const validFrom = new Date(cleanText(token.valid_from));
  const validUntil = new Date(cleanText(token.valid_until));
  const now = new Date();

  if (
    Number.isNaN(validFrom.getTime()) ||
    Number.isNaN(validUntil.getTime())
  ) {
    return false;
  }

  return now >= validFrom && now <= validUntil;
}

async function getGuestAccessSettings(propertySlug: string) {
  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("guest_access_settings")
      .select("enabled, require_token_for_whatsapp")
      .eq("property_slug", propertySlug)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const settings = data as GuestAccessSettingsRecord | null;

    return {
      enabled: settings?.enabled === true,
      require_token_for_whatsapp:
        settings?.require_token_for_whatsapp === true,
    };
  } catch (error) {
    console.error("WHATSAPP GUEST ACCESS SETTINGS LOOKUP FAILED:", error);

    return {
      enabled: false,
      require_token_for_whatsapp: false,
    };
  }
}

async function findActiveGuestAccessForWhatsApp({
  propertySlug,
  from,
}: {
  propertySlug: string;
  from: string;
}) {
  const normalizedFrom = normalizePhone(from);

  if (!normalizedFrom) {
    return null;
  }

  const supabase = getSupabaseAdminClient();

  const phoneCandidates = Array.from(
    new Set([
      from,
      normalizedFrom,
      normalizedFrom.replace(/^\+/, ""),
      `+${normalizedFrom.replace(/^\+/, "")}`,
    ])
  ).filter(Boolean);

  for (const phone of phoneCandidates) {
    const { data, error } = await supabase
      .from("guest_access_tokens")
      .select(
        "id, token, property_slug, guest_phone, guest_contact, status, valid_from, valid_until"
      )
      .eq("property_slug", propertySlug)
      .eq("guest_phone", phone)
      .eq("status", "active")
      .order("valid_until", { ascending: false })
      .limit(5);

    if (error) {
      console.error("WHATSAPP GUEST ACCESS PHONE LOOKUP FAILED:", error);
      continue;
    }

    const activeToken = ((data || []) as GuestAccessTokenRecord[]).find(
      isTokenCurrentlyActive
    );

    if (activeToken) {
      return activeToken;
    }
  }

  for (const contact of phoneCandidates) {
    const { data, error } = await supabase
      .from("guest_access_tokens")
      .select(
        "id, token, property_slug, guest_phone, guest_contact, status, valid_from, valid_until"
      )
      .eq("property_slug", propertySlug)
      .eq("guest_contact", contact)
      .eq("status", "active")
      .order("valid_until", { ascending: false })
      .limit(5);

    if (error) {
      console.error("WHATSAPP GUEST ACCESS CONTACT LOOKUP FAILED:", error);
      continue;
    }

    const activeToken = ((data || []) as GuestAccessTokenRecord[]).find(
      isTokenCurrentlyActive
    );

    if (activeToken) {
      return activeToken;
    }
  }

  return null;
}

async function evaluateWhatsAppGuestAccess({
  propertySlug,
  from,
}: {
  propertySlug: string;
  from: string;
}): Promise<WhatsAppAccessDecision> {
  const settings = await getGuestAccessSettings(propertySlug);

  if (!settings.enabled || !settings.require_token_for_whatsapp) {
    return {
      checked: true,
      required: false,
      allowed: true,
      state: "not_required",
      reason: "Guest Stay Access is not required for WhatsApp",
    };
  }

  const activeToken = await findActiveGuestAccessForWhatsApp({
    propertySlug,
    from,
  });

  if (!activeToken) {
    return {
      checked: true,
      required: true,
      allowed: false,
      state: "no_active_whatsapp_stay",
      reason:
        "No active Guest Stay Access token is associated with this WhatsApp number",
    };
  }

  return {
    checked: true,
    required: true,
    allowed: true,
    state: "active",
    reason: "Active Guest Stay Access token found for WhatsApp number",
    guestAccessToken: activeToken.token,
  };
}

async function sendWhatsAppMessage({
  to,
  text,
}: {
  to: string;
  text: string;
}) {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN;
  const apiVersion = getWhatsAppApiVersion();

  if (!phoneId || !token) {
    console.error(
      "WHATSAPP SEND SKIPPED: missing WHATSAPP_PHONE_ID or WHATSAPP_TOKEN"
    );

    return {
      sent: false,
      reason: "missing_whatsapp_env",
    };
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: text,
        },
      }),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("WHATSAPP SEND FAILED:", {
      status: response.status,
      data,
    });

    return {
      sent: false,
      reason: "whatsapp_api_error",
      status: response.status,
      data,
    };
  }

  return {
    sent: true,
    data,
  };
}

async function getAiReplyFromChatApi({
  request,
  message,
  from,
  guestAccessToken,
}: {
  request: Request;
  message: string;
  from: string;
  guestAccessToken?: string;
}) {
  const origin = new URL(request.url).origin;
  const propertySlug = getDefaultPropertySlug();

  const response = await fetch(`${origin}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      propertySlug,
      conversationId: `whatsapp_${propertySlug}_${from}`,
      guestContact: from,
      channel: "guest_portal",
      guestAccessToken,
    }),
  });

  const data = (await response
    .json()
    .catch(() => null)) as ChatApiResponse | null;

  if (!response.ok || !data?.success) {
    console.error("WHATSAPP CHAT API FAILED:", {
      status: response.status,
      data,
    });

    return getSafeReplyFallback();
  }

  return data.reply || getSafeReplyFallback();
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === getVerifyToken() &&
    challenge
  ) {
    return new Response(challenge, {
      status: 200,
    });
  }

  return new Response("Error", {
    status: 403,
  });
}

export async function POST(request: Request) {
  try {
    if (!isAuthorizedWebhookRequest(request)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as WhatsAppWebhookBody;

    const message = getIncomingMessage(body);

    if (!message) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: "no_message",
      });
    }

    const from = cleanText(message.from);
    const messageType = cleanText(message.type);
    const text = cleanText(message.text?.body);

    if (!from) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: "missing_sender",
      });
    }

    if (messageType !== "text" || !text) {
      await sendWhatsAppMessage({
        to: from,
        text: "Sorry, I can currently reply only to text messages. Please send your question as a written message.",
      });

      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: "unsupported_message_type",
      });
    }

    console.log("WHATSAPP MESSAGE RECEIVED:", {
      from,
      text,
      messageId: message.id,
      timestamp: message.timestamp,
    });

    const propertySlug = getDefaultPropertySlug();

    const whatsappAccess = await evaluateWhatsAppGuestAccess({
      propertySlug,
      from,
    });

    if (!whatsappAccess.allowed) {
      const reply = getGuestAccessRequiredReply();

      const sendResult = await sendWhatsAppMessage({
        to: from,
        text: reply,
      });

      return NextResponse.json({
        ok: true,
        replied: sendResult.sent,
        sendResult,
        guestAccess: whatsappAccess,
      });
    }

    const reply = await getAiReplyFromChatApi({
      request,
      message: text,
      from,
      guestAccessToken: whatsappAccess.guestAccessToken,
    });

    const sendResult = await sendWhatsAppMessage({
      to: from,
      text: reply,
    });

    return NextResponse.json({
      ok: true,
      replied: sendResult.sent,
      sendResult,
      guestAccess: whatsappAccess,
    });
  } catch (error) {
    console.error("WHATSAPP WEBHOOK ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "WhatsApp webhook error",
      },
      {
        status: 500,
      }
    );
  }
}