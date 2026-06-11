import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CalendarSourcePayload = {
  id?: string;
  property_id?: string;
  source_name?: string;
  source_type?: string;
  ics_url?: string;
  is_active?: boolean;
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

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("property_id");

    let query = supabase
      .from("booking_sources")
      .select(
        `
        id,
        property_id,
        source_name,
        source_type,
        ics_url,
        is_active,
        last_sync_at,
        last_sync_status,
        last_sync_error,
        created_at,
        updated_at,
        properties (
          id,
          property_name,
          slug
        )
      `
      )
      .order("created_at", {
        ascending: false,
      });

    if (propertyId && propertyId !== "all") {
      query = query.eq("property_id", propertyId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      calendar_sources: data || [],
    });
  } catch (error) {
    console.error("GET CALENDAR SOURCES ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        calendar_sources: [],
        error:
          error instanceof Error
            ? error.message
            : "Unable to load calendar sources",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();

    const body =
      (await request.json()) as CalendarSourcePayload;

    if (!body.property_id) {
      return NextResponse.json(
        {
          success: false,
          error: "property_id is required",
        },
        { status: 400 }
      );
    }

    if (!body.source_name) {
      return NextResponse.json(
        {
          success: false,
          error: "source_name is required",
        },
        { status: 400 }
      );
    }

    if (!body.source_type) {
      return NextResponse.json(
        {
          success: false,
          error: "source_type is required",
        },
        { status: 400 }
      );
    }

    if (!body.ics_url) {
      return NextResponse.json(
        {
          success: false,
          error: "ics_url is required",
        },
        { status: 400 }
      );
    }

    const normalizedUrl = body.ics_url.trim();

    if (
      !normalizedUrl.startsWith("http://") &&
      !normalizedUrl.startsWith("https://")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "ICS URL must start with http:// or https://",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("booking_sources")
      .insert({
        property_id: body.property_id,
        source_name: body.source_name.trim(),
        source_type: body.source_type,
        ics_url: normalizedUrl,
        is_active: body.is_active ?? true,
        last_sync_status: "not_synced",
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        id,
        property_id,
        source_name,
        source_type,
        ics_url,
        is_active,
        last_sync_at,
        last_sync_status,
        last_sync_error,
        created_at,
        updated_at,
        properties (
          id,
          property_name,
          slug
        )
      `
      )
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      calendar_source: data,
    });
  } catch (error) {
    console.error("CREATE CALENDAR SOURCE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create calendar source",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();

    const body =
      (await request.json()) as CalendarSourcePayload;

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "id is required",
        },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.source_name !== undefined) {
      payload.source_name = body.source_name;
    }

    if (body.source_type !== undefined) {
      payload.source_type = body.source_type;
    }

    if (body.ics_url !== undefined) {
      payload.ics_url = body.ics_url;
    }

    if (body.is_active !== undefined) {
      payload.is_active = body.is_active;
    }

    const { data, error } = await supabase
      .from("booking_sources")
      .update(payload)
      .eq("id", body.id)
      .select(
        `
        id,
        property_id,
        source_name,
        source_type,
        ics_url,
        is_active,
        last_sync_at,
        last_sync_status,
        last_sync_error,
        created_at,
        updated_at,
        properties (
          id,
          property_name,
          slug
        )
      `
      )
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      calendar_source: data,
    });
  } catch (error) {
    console.error("UPDATE CALENDAR SOURCE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update calendar source",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "id is required",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("booking_sources")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE CALENDAR SOURCE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete calendar source",
      },
      { status: 500 }
    );
  }
}