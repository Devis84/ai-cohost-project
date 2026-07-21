 import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getPartnerAccessContext,
  inactiveAccessResponse,
} from "@/lib/partner-access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

export async function GET(request: Request) {
  try {
    const accessContext = await getPartnerAccessContext(request);

    if (!accessContext.isActive) {
      return inactiveAccessResponse(accessContext);
    }

    const supabase = getSupabaseAdminClient();

    const { searchParams } =
      new URL(request.url);

    const propertyId =
      searchParams.get("property_id");

    const sourceId =
      searchParams.get("source_id");

    let query = supabase
      .from("calendar_sync_logs")
      .select(
        `
        id,
        property_id,
        source_id,
        status,
        events_found,
        bookings_created,
        bookings_updated,
        bookings_skipped,
        error_message,
        synced_at,
        booking_sources (
          id,
          source_name,
          source_type
        ),
        properties (
          id,
          property_name,
          slug
        )
      `
      )
      .order("synced_at", {
        ascending: false,
      })
      .limit(30);

    if (propertyId && propertyId !== "all") {
      query = query.eq(
        "property_id",
        propertyId
      );
    }

    if (sourceId && sourceId !== "all") {
      query = query.eq(
        "source_id",
        sourceId
      );
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      sync_logs: data || [],
    });
  } catch (error) {
    console.error(
      "GET CALENDAR SYNC LOGS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        sync_logs: [],
        error:
          error instanceof Error
            ? error.message
            : "Unable to load calendar sync logs",
      },
      { status: 500 }
    );
  }
}