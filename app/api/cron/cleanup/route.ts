export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type CleanupResult = {
  guest_page_events_archived: number;
  host_notifications_archived: number;
  ai_answer_cache_archived: number;
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

function getCutoffDate(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  return date.toISOString();
}

function isAuthorizedCronRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  const authorizationHeader =
    request.headers.get("authorization") || "";

  const bearerToken = authorizationHeader.startsWith("Bearer ")
    ? authorizationHeader.replace("Bearer ", "").trim()
    : "";

  const querySecret =
    request.nextUrl.searchParams.get("secret") || "";

  return bearerToken === cronSecret || querySecret === cronSecret;
}

async function archiveOldGuestPageEvents() {
  const supabase = getSupabaseAdminClient();
  const cutoff = getCutoffDate(90);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("guest_page_events")
    .update({
      archived_at: now,
      cleanup_reason:
        "archived_old_guest_page_event_after_90_days",
    })
    .is("archived_at", null)
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    throw error;
  }

  return data?.length || 0;
}

async function archiveOldReadHostNotifications() {
  const supabase = getSupabaseAdminClient();
  const cutoff = getCutoffDate(90);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("host_notifications")
    .update({
      archived_at: now,
    })
    .is("archived_at", null)
    .eq("status", "read")
    .lt("read_at", cutoff)
    .select("id");

  if (error) {
    throw error;
  }

  return data?.length || 0;
}

async function archiveOldUnapprovedAiCache() {
  const supabase = getSupabaseAdminClient();
  const cutoff = getCutoffDate(30);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("ai_answer_cache")
    .update({
      archived_at: now,
      cleanup_reason:
        "archived_unapproved_ai_cache_after_30_days",
    })
    .is("archived_at", null)
    .eq("approved", false)
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    throw error;
  }

  return data?.length || 0;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized cleanup request",
        },
        {
          status: 401,
        }
      );
    }

    const result: CleanupResult = {
      guest_page_events_archived:
        await archiveOldGuestPageEvents(),
      host_notifications_archived:
        await archiveOldReadHostNotifications(),
      ai_answer_cache_archived:
        await archiveOldUnapprovedAiCache(),
    };

    return NextResponse.json({
      success: true,
      mode: "conservative_archive_only",
      result,
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("CLEANUP CRON ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Cleanup cron failed",
      },
      {
        status: 500,
      }
    );
  }
}