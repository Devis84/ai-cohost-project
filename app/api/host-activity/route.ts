export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type HostActivityAction =
  | "mark_notification_read"
  | "archive_notification";

type HostActivityRequestBody = {
  action?: HostActivityAction;
  notification_id?: string;
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

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();

    const [
      notificationsResult,
      guestEventsResult,
      aiCacheResult,
    ] = await Promise.all([
      supabase
        .from("host_notifications")
        .select(
          "id, property_slug, notification_type, title, message, priority, status, whatsapp_status, telegram_status, email_status, created_at, read_at, archived_at"
        )
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(30),

      supabase
        .from("guest_page_events")
        .select(
          "id, property_slug, event_type, event_source, event_label, guest_language, is_first_event, host_notified, created_at"
        )
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(30),

      supabase
        .from("ai_answer_cache")
        .select(
          "id, property_slug, question_normalized, question_original, source, usage_count, last_used_at, approved, created_at"
        )
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    if (notificationsResult.error) {
      throw notificationsResult.error;
    }

    if (guestEventsResult.error) {
      throw guestEventsResult.error;
    }

    if (aiCacheResult.error) {
      throw aiCacheResult.error;
    }

    const notifications = notificationsResult.data || [];
    const guestEvents = guestEventsResult.data || [];
    const aiCache = aiCacheResult.data || [];

    const unreadNotifications = notifications.filter(
      (item) => item.status === "unread"
    ).length;

    const whatsappSent = notifications.filter(
      (item) => item.whatsapp_status === "sent"
    ).length;

    const firstGuestOpens = guestEvents.filter(
      (item) =>
        item.event_type === "guest_page_opened" &&
        item.is_first_event
    ).length;

    const totalAiCacheUses = aiCache.reduce((total, item) => {
      return total + Number(item.usage_count || 0);
    }, 0);

    return NextResponse.json({
      success: true,
      summary: {
        unread_notifications: unreadNotifications,
        whatsapp_sent: whatsappSent,
        first_guest_opens: firstGuestOpens,
        ai_cache_entries: aiCache.length,
        ai_cache_total_uses: totalAiCacheUses,
      },
      notifications,
      guest_events: guestEvents,
      ai_answer_cache: aiCache,
    });
  } catch (error) {
    console.error("HOST ACTIVITY API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load host activity",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body =
      (await request.json()) as HostActivityRequestBody;

    const action = body.action;
    const notificationId = cleanText(body.notification_id);

    if (!action || !notificationId) {
      return NextResponse.json(
        {
          success: false,
          error: "action and notification_id are required",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    if (action === "mark_notification_read") {
      const { data, error } = await supabase
        .from("host_notifications")
        .update({
          status: "read",
          read_at: now,
        })
        .eq("id", notificationId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        notification: data,
      });
    }

    if (action === "archive_notification") {
      const { data, error } = await supabase
        .from("host_notifications")
        .update({
          status: "archived",
          archived_at: now,
        })
        .eq("id", notificationId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        notification: data,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unsupported action",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error("HOST ACTIVITY UPDATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update host activity",
      },
      {
        status: 500,
      }
    );
  }
}