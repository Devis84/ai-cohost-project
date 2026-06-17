import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const allowedEventTypes = [
  "guest_page_opened",
  "wifi_info_viewed",
  "checkin_info_viewed",
  "ai_chat_started",
  "issue_reported",
] as const;

type GuestEventType = (typeof allowedEventTypes)[number];

type GuestEventPayload = {
  property_slug?: unknown;
  event_type?: unknown;
  event_source?: unknown;
  event_label?: unknown;
  event_metadata?: unknown;
  guest_token?: unknown;
  guest_name?: unknown;
  guest_language?: unknown;
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
    return null;
  }

  const cleanValue = value.trim();

  if (!cleanValue) {
    return null;
  }

  return cleanValue.slice(0, 500);
}

function cleanMetadata(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function getClientIp(request: NextRequest) {
  const forwardedFor =
    request.headers.get("x-forwarded-for") || "";

  const firstForwardedIp = forwardedFor
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)[0];

  return (
    firstForwardedIp ||
    request.headers.get("x-real-ip") ||
    null
  );
}

function isAllowedEventType(
  value: unknown
): value is GuestEventType {
  return (
    typeof value === "string" &&
    allowedEventTypes.includes(value as GuestEventType)
  );
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as GuestEventPayload;

    const propertySlug = cleanText(payload.property_slug);

    if (!propertySlug) {
      return NextResponse.json(
        {
          success: false,
          error: "property_slug is required",
        },
        { status: 400 }
      );
    }

    if (!isAllowedEventType(payload.event_type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid event_type",
          allowed_event_types: allowedEventTypes,
        },
        { status: 400 }
      );
    }

    const eventType = payload.event_type;
    const guestToken = cleanText(payload.guest_token);

    const supabase = getSupabaseAdminClient();

    let previousEventQuery = supabase
      .from("guest_page_events")
      .select("id")
      .eq("property_slug", propertySlug)
      .eq("event_type", eventType)
      .limit(1);

    if (guestToken) {
      previousEventQuery = previousEventQuery.eq(
        "guest_token",
        guestToken
      );
    }

    const { data: previousEvents, error: previousEventError } =
      await previousEventQuery;

    if (previousEventError) {
      throw previousEventError;
    }

    const isFirstEvent =
      !previousEvents || previousEvents.length === 0;

    const userAgent =
      request.headers.get("user-agent") || null;

    const ipAddress = getClientIp(request);

    const { data: insertedEvent, error: insertError } =
      await supabase
        .from("guest_page_events")
        .insert({
          property_slug: propertySlug,
          event_type: eventType,
          event_source:
            cleanText(payload.event_source) || "guest_page",
          event_label: cleanText(payload.event_label),
          event_metadata: cleanMetadata(payload.event_metadata),
          guest_token: guestToken,
          guest_name: cleanText(payload.guest_name),
          guest_language: cleanText(payload.guest_language),
          user_agent: userAgent,
          ip_address: ipAddress,
          is_first_event: isFirstEvent,
          host_notified: false,
        })
        .select("*")
        .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      event: insertedEvent,
    });
  } catch (error) {
    console.error("GUEST EVENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to record guest event",
      },
      { status: 500 }
    );
  }
}