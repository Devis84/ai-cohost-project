 export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { runChatEngine } from "@/lib/ai/engine/chat-engine";

type ChatRequestBody = {
  message?: string;
  propertySlug?: string;
  propertyId?: string;
  conversationId?: string;
  guestName?: string;
  guestContact?: string;
  channel?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;

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
          error: "propertySlug or propertyId is required",
        },
        {
          status: 400,
        }
      );
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
          error: result.error,
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