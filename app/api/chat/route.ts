 export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { runChatEngine } from "@/lib/ai/engine/chat-engine";
import { buildGuestV2StayFromToken } from "@/lib/guest-v2/stay-builder";

type ChatRequestBody = {
  message?: string;
  propertySlug?: string;
  propertyId?: string;
  conversationId?: string;
  guestName?: string;
  guestContact?: string;
  channel?: string;
  guestAccessToken?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;

    const message = cleanText(body.message);
    const propertySlug = cleanText(body.propertySlug);
    const propertyId = cleanText(body.propertyId);
    const channel = body.channel || "web";
    const guestAccessToken = cleanText(body.guestAccessToken);

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

    if (message.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "message is too short",
        },
        {
          status: 400,
        }
      );
    }

    if (message.length > 1200) {
      return NextResponse.json(
        {
          success: false,
          error: "message is too long",
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
          error: "propertySlug or propertyId is required",
        },
        {
          status: 400,
        }
      );
    }

    if (channel === "guest_portal" && guestAccessToken) {
      const stay = await buildGuestV2StayFromToken(guestAccessToken);

      if (!stay.access.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: "Guest access is not active",
            blocked: true,
            blockedReason: stay.access.state || "access_denied",
          },
          {
            status: 403,
          }
        );
      }
    }

    const result = await runChatEngine({
      message,
      propertySlug,
      propertyId,
      conversationId: body.conversationId,
      guestName: body.guestName,
      guestContact: body.guestContact,
      channel,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.status >= 500
              ? "Unable to generate the AI reply right now"
              : result.error,
        },
        {
          status: result.status,
        }
      );
    }

    return result.response;
  } catch (error) {
    console.error("CHAT API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while generating the AI reply",
      },
      {
        status: 500,
      }
    );
  }
}