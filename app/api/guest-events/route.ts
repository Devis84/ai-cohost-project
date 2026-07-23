 import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const allowedEventTypes = [
  "guest_page_opened",
  "wifi_info_viewed",
  "checkin_info_viewed",
  "ai_chat_started",
  "issue_reported",
] as const;

const hostNotificationEnabledSlugs = [
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
  metadata: Record<string, unknown> | null;
};

type DeliveryResult = {
  sent: boolean;
  status: string;
  data?: unknown;
};

function getSupabaseAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin environment variables"
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
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
    allowedEventTypes.includes(
      value as GuestEventType
    )
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

function normalizeWhatsAppPhone(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  return value.replace(/[^\d]/g, "");
}

function shouldSendHostNotification({
  propertySlug,
  eventType,
  isFirstEvent,
}: {
  propertySlug: string;
  eventType: GuestEventType;
  isFirstEvent: boolean;
}) {
  const normalizedSlug =
    normalizePropertySlug(propertySlug);

  if (!isFirstEvent) {
    return false;
  }

  if (eventType !== "guest_page_opened") {
    return false;
  }

  return hostNotificationEnabledSlugs.includes(
    normalizedSlug
  );
}

function getPropertyName({
  propertySlug,
  metadata,
}: {
  propertySlug: string;
  metadata: Record<string, unknown>;
}) {
  if (
    typeof metadata.property_name === "string" &&
    metadata.property_name.trim()
  ) {
    return metadata.property_name.trim();
  }

  return propertySlug;
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
  const propertyName = getPropertyName({
    propertySlug,
    metadata,
  });

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

function buildHostMessage({
  propertySlug,
  eventType,
  metadata,
}: {
  propertySlug: string;
  eventType: GuestEventType;
  metadata: Record<string, unknown>;
}) {
  const propertyName = getPropertyName({
    propertySlug,
    metadata,
  });

  const openedAt = new Date().toLocaleString(
    "en-GB",
    {
      timeZone: "Europe/Rome",
      dateStyle: "medium",
      timeStyle: "short",
    }
  );

  return `🏡 AI Co-Host notification

Guest page opened

Property: ${propertyName}
Slug: ${propertySlug}
Event: ${eventType}
Time: ${openedAt}

A guest opened the ${propertyName} guest page.`;
}

async function updateHostNotificationDelivery({
  supabase,
  notification,
  patch,
  metadata,
}: {
  supabase: ReturnType<
    typeof getSupabaseAdminClient
  >;
  notification: HostNotificationRecord;
  patch: {
    whatsapp_status?: string;
    telegram_status?: string;
    delivery_channel?: string;
  };
  metadata?: Record<string, unknown>;
}) {
  const existingMetadata =
    notification.metadata &&
    typeof notification.metadata === "object"
      ? notification.metadata
      : {};

  const { error } = await supabase
    .from("host_notifications")
    .update({
      ...patch,
      metadata: {
        ...existingMetadata,
        ...(metadata || {}),
        delivery_status_updated_at:
          new Date().toISOString(),
      },
    })
    .eq("id", notification.id);

  if (error) {
    console.error(
      "HOST NOTIFICATION DELIVERY STATUS UPDATE FAILED:",
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
  supabase: ReturnType<
    typeof getSupabaseAdminClient
  >;
  notification: HostNotificationRecord;
  propertySlug: string;
  eventType: GuestEventType;
  metadata: Record<string, unknown>;
}): Promise<DeliveryResult> {
  const hostPhone = normalizeWhatsAppPhone(
    process.env.WHATSAPP_HOST_PHONE
  );

  const phoneId =
    process.env.WHATSAPP_PHONE_ID?.trim();

  const token =
    process.env.WHATSAPP_TOKEN?.trim();

  const apiVersion =
    getWhatsAppApiVersion();

  if (!hostPhone || !phoneId || !token) {
    await updateHostNotificationDelivery({
      supabase,
      notification,
      patch: {
        whatsapp_status: "not_configured",
      },
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

  const message = buildHostMessage({
    propertySlug,
    eventType,
    metadata,
  });

  try {
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

    const data = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      console.error(
        "HOST WHATSAPP NOTIFICATION FAILED:",
        {
          status: response.status,
          data,
        }
      );

      await updateHostNotificationDelivery({
        supabase,
        notification,
        patch: {
          whatsapp_status: "failed",
        },
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

    await updateHostNotificationDelivery({
      supabase,
      notification,
      patch: {
        whatsapp_status: "sent",
        delivery_channel: "dashboard_whatsapp",
      },
      metadata: {
        whatsapp_api_response: data,
        whatsapp_sent_at:
          new Date().toISOString(),
      },
    });

    return {
      sent: true,
      status: "sent",
      data,
    };
  } catch (error) {
    console.error(
      "HOST WHATSAPP NOTIFICATION REQUEST ERROR:",
      error
    );

    await updateHostNotificationDelivery({
      supabase,
      notification,
      patch: {
        whatsapp_status: "failed",
      },
      metadata: {
        whatsapp_error:
          error instanceof Error
            ? error.message
            : "WhatsApp request failed",
      },
    });

    return {
      sent: false,
      status: "failed",
    };
  }
}

async function markTelegramNotNeeded({
  supabase,
  notification,
}: {
  supabase: ReturnType<
    typeof getSupabaseAdminClient
  >;
  notification: HostNotificationRecord;
}) {
  await updateHostNotificationDelivery({
    supabase,
    notification,
    patch: {
      telegram_status: "not_needed",
    },
    metadata: {
      telegram_reason:
        "WhatsApp notification delivered successfully",
    },
  });
}

async function sendHostTelegramNotification({
  supabase,
  notification,
  propertySlug,
  eventType,
  metadata,
}: {
  supabase: ReturnType<
    typeof getSupabaseAdminClient
  >;
  notification: HostNotificationRecord;
  propertySlug: string;
  eventType: GuestEventType;
  metadata: Record<string, unknown>;
}): Promise<DeliveryResult> {
  const botToken =
    process.env.TELEGRAM_BOT_TOKEN?.trim();

  const chatId =
    process.env.TELEGRAM_CHAT_ID?.trim();

  if (!botToken || !chatId) {
    await updateHostNotificationDelivery({
      supabase,
      notification,
      patch: {
        telegram_status: "not_configured",
      },
      metadata: {
        telegram_error:
          "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID",
      },
    });

    return {
      sent: false,
      status: "not_configured",
    };
  }

  const message = buildHostMessage({
    propertySlug,
    eventType,
    metadata,
  });

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          disable_web_page_preview: true,
        }),
      }
    );

    const data = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      console.error(
        "HOST TELEGRAM NOTIFICATION FAILED:",
        {
          status: response.status,
          data,
        }
      );

      await updateHostNotificationDelivery({
        supabase,
        notification,
        patch: {
          telegram_status: "failed",
        },
        metadata: {
          telegram_api_status: response.status,
          telegram_api_response: data,
        },
      });

      return {
        sent: false,
        status: "failed",
        data,
      };
    }

    await updateHostNotificationDelivery({
      supabase,
      notification,
      patch: {
        telegram_status: "sent",
        delivery_channel: "dashboard_telegram",
      },
      metadata: {
        telegram_api_response: data,
        telegram_sent_at:
          new Date().toISOString(),
      },
    });

    return {
      sent: true,
      status: "sent",
      data,
    };
  } catch (error) {
    console.error(
      "HOST TELEGRAM NOTIFICATION REQUEST ERROR:",
      error
    );

    await updateHostNotificationDelivery({
      supabase,
      notification,
      patch: {
        telegram_status: "failed",
      },
      metadata: {
        telegram_error:
          error instanceof Error
            ? error.message
            : "Telegram request failed",
      },
    });

    return {
      sent: false,
      status: "failed",
    };
  }
}

async function createHostNotification({
  supabase,
  propertySlug,
  eventType,
  eventId,
  metadata,
}: {
  supabase: ReturnType<
    typeof getSupabaseAdminClient
  >;
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

  const initialMetadata = {
    ...metadata,
    generated_from: "guest_events_api",
    whatsapp_preferred: true,
    telegram_fallback: true,
    notification_scope:
      "guest_page_opened_maltese_maisonette_only",
  };

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
      delivery_channel:
        "dashboard_whatsapp_telegram",
      whatsapp_status: "pending_provider",
      telegram_status: "pending_fallback",
      email_status: "not_configured",
      metadata: initialMetadata,
    })
    .select(
      "id, title, message, metadata"
    )
    .single();

  if (error) {
    throw error;
  }

  return data as HostNotificationRecord;
}

export async function POST(
  request: NextRequest
) {
  try {
    const payload =
      (await request.json()) as GuestEventPayload;

    const propertySlug = cleanText(
      payload.property_slug
    );

    if (!propertySlug) {
      return NextResponse.json(
        {
          success: false,
          error: "property_slug is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isAllowedEventType(payload.event_type)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid event_type",
          allowed_event_types:
            allowedEventTypes,
        },
        {
          status: 400,
        }
      );
    }

    const eventType = payload.event_type;

    const guestToken = cleanText(
      payload.guest_token
    );

    const metadata = cleanMetadata(
      payload.event_metadata
    );

    const supabase =
      getSupabaseAdminClient();

    let previousEventQuery = supabase
      .from("guest_page_events")
      .select("id")
      .eq("property_slug", propertySlug)
      .eq("event_type", eventType)
      .limit(1);

    if (guestToken) {
      previousEventQuery =
        previousEventQuery.eq(
          "guest_token",
          guestToken
        );
    }

    const {
      data: previousEvents,
      error: previousEventError,
    } = await previousEventQuery;

    if (previousEventError) {
      throw previousEventError;
    }

    const isFirstEvent =
      !previousEvents ||
      previousEvents.length === 0;

    const userAgent =
      request.headers.get("user-agent") ||
      null;

    const ipAddress =
      getClientIp(request);

    const shouldNotifyHost =
      shouldSendHostNotification({
        propertySlug,
        eventType,
        isFirstEvent,
      });

    const {
      data: insertedEvent,
      error: insertError,
    } = await supabase
      .from("guest_page_events")
      .insert({
        property_slug: propertySlug,
        event_type: eventType,
        event_source:
          cleanText(payload.event_source) ||
          "guest_page",
        event_label: cleanText(
          payload.event_label
        ),
        event_metadata: metadata,
        guest_token: guestToken,
        guest_name: cleanText(
          payload.guest_name
        ),
        guest_language: cleanText(
          payload.guest_language
        ),
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

    let hostWhatsAppNotification:
      | DeliveryResult
      | null = null;

    let hostTelegramNotification:
      | DeliveryResult
      | null = null;

    if (
      shouldNotifyHost &&
      insertedEvent?.id
    ) {
      const notification =
        await createHostNotification({
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

      if (
        hostWhatsAppNotification.sent
      ) {
        await markTelegramNotNeeded({
          supabase,
          notification,
        });

        hostTelegramNotification = {
          sent: false,
          status: "not_needed",
        };
      } else {
        hostTelegramNotification =
          await sendHostTelegramNotification({
            supabase,
            notification,
            propertySlug,
            eventType,
            metadata,
          });
      }

      const externalNotificationSent =
        hostWhatsAppNotification.sent ||
        hostTelegramNotification.sent;

      const {
        error: updateEventError,
      } = await supabase
        .from("guest_page_events")
        .update({
          host_notified:
            externalNotificationSent,
        })
        .eq("id", insertedEvent.id);

      if (updateEventError) {
        throw updateEventError;
      }

      insertedEvent.host_notified =
        externalNotificationSent;
    }

    return NextResponse.json({
      success: true,
      event: insertedEvent,
      host_notification_created:
        hostNotificationCreated,
      host_whatsapp_notification:
        hostWhatsAppNotification,
      host_telegram_notification:
        hostTelegramNotification,
      notification_scope:
        "guest_page_opened_maltese_maisonette_only",
    });
  } catch (error) {
    console.error(
      "GUEST EVENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to record guest event",
      },
      {
        status: 500,
      }
    );
  }
}