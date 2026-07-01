export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { buildGuestV2StayFromToken } from "@/lib/guest-v2/stay-builder";

type GuestV2ChatRequestBody = {
  token?: string;
  message?: string;
};

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

function getBaseUrl(request: NextRequest) {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL;

  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GuestV2ChatRequestBody;

    const token = cleanText(body.token);
    const message = cleanText(body.message);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "token is required",
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "message is required",
        },
        { status: 400 }
      );
    }

    const stay = await buildGuestV2StayFromToken(token);

    if (!stay.access.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: stay.access.message,
          access: stay.access,
        },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: accessToken, error: accessError } = await supabase
      .from("guest_access_tokens")
      .select("*")
      .eq("token", token)
      .limit(1)
      .single();

    if (accessError || !accessToken?.property_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to resolve guest access token",
        },
        { status: 404 }
      );
    }

    const baseUrl = getBaseUrl(request);

    const chatResponse = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        propertyId: accessToken.property_id,
        conversationId: `guest_v2_${token}`,
        guestName: accessToken.guest_name || stay.guest.name,
        guestContact: accessToken.guest_email || accessToken.guest_phone || "",
        channel: "guest_portal",
      }),
    });

    const chatData = await chatResponse.json();

    if (!chatResponse.ok || !chatData?.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            chatData?.error ||
            "Unable to generate AI Concierge reply",
        },
        { status: chatResponse.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reply: chatData.reply,
      conversationId: chatData.conversationId,
      escalation: chatData.escalation,
      blocked: chatData.blocked,
      cache: chatData.cache,
    });
  } catch (error) {
    console.error("GUEST V2 CHAT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to contact AI Concierge",
      },
      { status: 500 }
    );
  }
}