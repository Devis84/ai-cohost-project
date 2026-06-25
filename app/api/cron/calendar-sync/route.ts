import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CalendarSource = {
  id: string;
  property_id: string;
  source_name: string;
  source_type: string;
  is_active: boolean;
};

type SyncResult = {
  source_id: string;
  source_name: string;
  source_type: string;
  property_id: string;
  success: boolean;
  status: number;
  events_found?: number;
  bookings_created?: number;
  bookings_updated?: number;
  bookings_skipped?: number;
  error?: string;
};

function getSupabaseAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing environment variable: SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getExpectedSecret() {
  return process.env.CRON_SECRET || "";
}

function getRequestSecret(request: Request) {
  const url = new URL(request.url);

  const querySecret =
    url.searchParams.get("secret") || "";

  const headerSecret =
    request.headers.get("x-cron-secret") || "";

  const authorization =
    request.headers.get("authorization") || "";

  const bearerSecret = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice("bearer ".length).trim()
    : "";

  return querySecret || headerSecret || bearerSecret;
}

function isAuthorizedCronRequest(request: Request) {
  const expectedSecret = getExpectedSecret();

  if (!expectedSecret) {
    return false;
  }

  const requestSecret = getRequestSecret(request);

  return requestSecret === expectedSecret;
}

function getBaseUrl(request: Request) {
  const url = new URL(request.url);

  const forwardedProto =
    request.headers.get("x-forwarded-proto");

  const forwardedHost =
    request.headers.get("x-forwarded-host");

  const host =
    forwardedHost ||
    request.headers.get("host") ||
    url.host;

  const protocol =
    forwardedProto ||
    url.protocol.replace(":", "") ||
    "https";

  return `${protocol}://${host}`;
}

async function getActiveCalendarSources() {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("booking_sources")
    .select(
      `
      id,
      property_id,
      source_name,
      source_type,
      is_active
    `
    )
    .eq("is_active", true)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data || []) as CalendarSource[];
}

async function syncSingleSource({
  request,
  source,
}: {
  request: Request;
  source: CalendarSource;
}): Promise<SyncResult> {
  const baseUrl = getBaseUrl(request);
  const syncUrl = `${baseUrl}/api/calendar-sources/sync`;

  try {
    const response = await fetch(syncUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "AI-CoHost-Cron-Calendar-Sync/1.0",
      },
      body: JSON.stringify({
        source_id: source.id,
      }),
      cache: "no-store",
    });

    const data = await response
      .json()
      .catch(() => ({}));

    return {
      source_id: source.id,
      source_name: source.source_name,
      source_type: source.source_type,
      property_id: source.property_id,
      success: Boolean(response.ok && data.success),
      status: response.status,
      events_found: data.events_found,
      bookings_created: data.bookings_created,
      bookings_updated: data.bookings_updated,
      bookings_skipped: data.bookings_skipped,
      error: data.error,
    };
  } catch (error) {
    return {
      source_id: source.id,
      source_name: source.source_name,
      source_type: source.source_type,
      property_id: source.property_id,
      success: false,
      status: 500,
      error:
        error instanceof Error
          ? error.message
          : "Calendar source sync failed",
    };
  }
}

async function handleCalendarSyncCron(request: Request) {
  const startedAt = new Date().toISOString();

  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized calendar sync cron request",
      },
      {
        status: 401,
      }
    );
  }

  const sources = await getActiveCalendarSources();

  const results: SyncResult[] = [];

  for (const source of sources) {
    const result = await syncSingleSource({
      request,
      source,
    });

    results.push(result);
  }

  const finishedAt = new Date().toISOString();

  const successfulSources = results.filter(
    (item) => item.success
  );

  const failedSources = results.filter(
    (item) => !item.success
  );

  const totals = results.reduce(
    (accumulator, item) => {
      return {
        events_found:
          accumulator.events_found +
          Number(item.events_found || 0),
        bookings_created:
          accumulator.bookings_created +
          Number(item.bookings_created || 0),
        bookings_updated:
          accumulator.bookings_updated +
          Number(item.bookings_updated || 0),
        bookings_skipped:
          accumulator.bookings_skipped +
          Number(item.bookings_skipped || 0),
      };
    },
    {
      events_found: 0,
      bookings_created: 0,
      bookings_updated: 0,
      bookings_skipped: 0,
    }
  );

  return NextResponse.json({
    success: failedSources.length === 0,
    started_at: startedAt,
    finished_at: finishedAt,
    sources_found: sources.length,
    sources_synced: successfulSources.length,
    sources_failed: failedSources.length,
    totals,
    results,
  });
}

export async function GET(request: Request) {
  try {
    return await handleCalendarSyncCron(request);
  } catch (error) {
    console.error("CALENDAR SYNC CRON ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Calendar sync cron failed",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    return await handleCalendarSyncCron(request);
  } catch (error) {
    console.error("CALENDAR SYNC CRON ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Calendar sync cron failed",
      },
      {
        status: 500,
      }
    );
  }
}