 import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const allowedEventTypes = [
  "guest_page_opened",
  "wifi_info_viewed",
  "checkin_info_viewed",
  "ai_chat_started",
  "issue_reported",
] as const;

const whatsappNotificationEnabledSlugs = [
  "maltese-maisonette",
];

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

type HostNotificationCopy = {
  title: string;
  message: string;
  priority: string;
};

type HostNotificationRecord = {
  id: string;
  title: string;
  message: string;
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

function getWhatsAppApiVersion() {
  return (
    process.env.WHATSAPP_GRAPH_API_VERSION ||
    "v18.0"
  );
}

function normalizePropertySlug(value: string) {
  return value.trim().toLowerCase();
}

function shouldSendHostWhatsAppNotification({
  propertySlug,
  eventType,
  isFirstEvent,
}: {
  propertySlug: string;
  eventType: GuestEventType;
  isFirstEvent: boolean;
}) {
  const normalizedSlug = normalizePropertySlug(propertySlug);

  if (!isFirstEvent) {
    return false;
  }

  if (eventType !== "guest_page_opened") {
    return false;
  }

  return whatsappNotificationEnabledSlugs.includes(
    normalizedSlug
  );
}

function normalizeWhatsAppPhone(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.replace(/[^\d]/g, "");
}

function getNotificationCopy({
  eventType,
  propertySlug,
  metadata,
}: {
  eventType: GuestEventType;
  propertySlug: string;
  metadata: Record<string, unknown>;
}): HostNotificationCopy {
  const propertyName =
    typeof metadata.property_name === "string" &&
    metadata.property_name.trim()
      ? metadata.property_name.trim()
      : propertySlug;

  if (eventType === "guest_page_opened") {
    return {
      title: "Guest page opened",
      message: `A guest opened the guest page for ${propertyName}. This may indicate first arrival or that the guest is checking stay instructions.`,
      priority: "normal",
    };
  }

  if (eventType === "wifi_info_viewed") {
    return {
      title: "Wi-Fi info viewed",
      message: `A guest viewed Wi-Fi information for ${propertyName}.`,
      priority: "low",
    };
  }

  if (eventType === "checkin_info_viewed") {
    return {
      title: "Check-in info viewed",
      message: `A guest viewed check-in information for ${propertyName}.`,
      priority: "normal",
    };
  }

  if (eventType === "ai_chat_started") {
    return {
      title: "AI Concierge started",
      message: `A guest started an AI Concierge chat for ${propertyName}.`,
      priority: "normal",
    };
  }

  return {
    title: "Guest issue reported",
    message: `A guest reported an issue for ${propertyName}.`,
    priority: "high",
  };
}

async function updateHostNotificationWhatsAppStatus({
  supabase,
  notificationId,
  status,
  metadata,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  notificationId: string;
  status: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabase
    .from("host_notifications")
    .update({
      whatsapp_status: status,
      metadata: {
        ...(metadata || {}),
        whatsapp_status_updated_at: new Date().toISOString(),
      },
    })
    .eq("id", notificationId);

  if (error) {
    console.error(
      "HOST NOTIFICATION WHATSAPP STATUS UPDATE FAILED:",
      error
    );
  }
}

async function sendHostWhatsAppNotification({
  supabase,
  notification,
  propertySlug,
  eventType,
  metadata,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  notification: HostNotificationRecord;
  propertySlug: string;
  eventType: GuestEventType;
  metadata: Record<string, unknown>;
}) {
  const hostPhone = normalizeWhatsAppPhone(
    process.env.WHATSAPP_HOST_PHONE
  );

  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN;
  const apiVersion = getWhatsAppApiVersion();

  if (!hostPhone || !phoneId || !token) {
    await updateHostNotificationWhatsAppStatus({
      supabase,
      notificationId: notification.id,
      status: "not_configured",
      metadata: {
        whatsapp_error:
          "Missing WHATSAPP_HOST_PHONE, WHATSAPP_PHONE_ID or WHATSAPP_TOKEN",
      },
    });

    return {
      sent: false,
      status: "not_configured",
    };
  }

  const propertyName =
    typeof metadata.property_name === "string" &&
    metadata.property_name.trim()
      ? metadata.property_name.trim()
      : propertySlug;

  const openedAt = new Date().toLocaleString("en-GB", {
    timeZone: "Europe/Rome",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const message = `🏡 AI Co-Host notification

Guest page opened

Property: ${propertyName}
Slug: ${propertySlug}
Event: ${eventType}
Time: ${openedAt}

A guest opened the Maltese Maisonette guest page.`;

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
        to: hostPhone,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      }),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("HOST WHATSAPP NOTIFICATION FAILED:", {
      status: response.status,
      data,
    });

    await updateHostNotificationWhatsAppStatus({
      supabase,
      notificationId: notification.id,
      status: "failed",
      metadata: {
        whatsapp_api_status: response.status,
        whatsapp_api_response: data,
      },
    });

    return {
      sent: false,
      status: "failed",
      data,
    };
  }

  await updateHostNotificationWhatsAppStatus({
    supabase,
    notificationId: notification.id,
    status: "sent",
    metadata: {
      whatsapp_api_response: data,
    },
  });

  return {
    sent: true,
    status: "sent",
    data,
  };
}

async function createHostNotification({
  supabase,
  propertySlug,
  eventType,
  eventId,
  metadata,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  propertySlug: string;
  eventType: GuestEventType;
  eventId: string;
  metadata: Record<string, unknown>;
}) {
  const copy = getNotificationCopy({
    eventType,
    propertySlug,
    metadata,
  });

  const { data, error } = await supabase
    .from("host_notifications")
    .insert({
      property_slug: propertySlug,
      notification_type: eventType,
      title: copy.title,
      message: copy.message,
      priority: copy.priority,
      status: "unread",
      source_event_id: eventId,
      delivery_channel: "dashboard_whatsapp",
      whatsapp_status: "pending_provider",
      telegram_status: "not_configured",
      email_status: "not_configured",
      metadata: {
        ...metadata,
        generated_from: "guest_events_api",
        whatsapp_preferred: true,
        whatsapp_notification_scope: "maltese_maisonette_only",
      },
    })
    .select("id, title, message")
    .single();

  if (error) {
    throw error;
  }

  return data as HostNotificationRecord;
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
    const metadata = cleanMetadata(payload.event_metadata);

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

    const shouldNotifyHost =
      shouldSendHostWhatsAppNotification({
        propertySlug,
        eventType,
        isFirstEvent,
      });

    const { data: insertedEvent, error: insertError } =
      await supabase
        .from("guest_page_events")
        .insert({
          property_slug: propertySlug,
          event_type: eventType,
          event_source:
            cleanText(payload.event_source) || "guest_page",
          event_label: cleanText(payload.event_label),
          event_metadata: metadata,
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

    let hostNotificationCreated = false;
    let hostWhatsAppNotification = null;

    if (shouldNotifyHost && insertedEvent?.id) {
      const notification = await createHostNotification({
        supabase,
        propertySlug,
        eventType,
        eventId: insertedEvent.id,
        metadata,
      });

      hostNotificationCreated = true;

      hostWhatsAppNotification =
        await sendHostWhatsAppNotification({
          supabase,
          notification,
          propertySlug,
          eventType,
          metadata,
        });

      const { error: updateEventError } = await supabase
        .from("guest_page_events")
        .update({
          host_notified: true,
        })
        .eq("id", insertedEvent.id);

      if (updateEventError) {
        throw updateEventError;
      }

      insertedEvent.host_notified = true;
    }

    return NextResponse.json({
      success: true,
      event: insertedEvent,
      host_notification_created: hostNotificationCreated,
      host_whatsapp_notification: hostWhatsAppNotification,
      whatsapp_notification_scope:
        "guest_page_opened_maltese_maisonette_only",
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