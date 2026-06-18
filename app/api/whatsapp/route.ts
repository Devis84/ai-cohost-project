 export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";

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

function getVerifyToken() {
  return (
    process.env.WHATSAPP_VERIFY_TOKEN ||
    "ai-cohost-token"
  );
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

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
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
}: {
  request: Request;
  message: string;
  from: string;
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

    const reply = await getAiReplyFromChatApi({
      request,
      message: text,
      from,
    });

    const sendResult = await sendWhatsAppMessage({
      to: from,
      text: reply,
    });

    return NextResponse.json({
      ok: true,
      replied: sendResult.sent,
      sendResult,
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