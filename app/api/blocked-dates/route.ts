import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type BlockedDatePayload = {
  id?: string;
  property_id?: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
  notes?: string | null;
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

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();

    const { searchParams } =
      new URL(request.url);

    const propertyId =
      searchParams.get("property_id");

    let query = supabase
      .from("blocked_dates")
      .select(
        `
        id,
        property_id,
        start_date,
        end_date,
        reason,
        notes,
        created_at,
        updated_at,
        properties (
          id,
          property_name,
          slug
        )
      `
      )
      .order("start_date", {
        ascending: true,
      });

    if (propertyId && propertyId !== "all") {
      query = query.eq(
        "property_id",
        propertyId
      );
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      blocked_dates: data || [],
    });
  } catch (error) {
    console.error("GET BLOCKED DATES ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        blocked_dates: [],
        error:
          error instanceof Error
            ? error.message
            : "Unable to load blocked dates",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();

    const body =
      (await request.json()) as BlockedDatePayload;

    if (!body.property_id) {
      return NextResponse.json(
        {
          success: false,
          error: "property_id is required",
        },
        { status: 400 }
      );
    }

    if (!body.start_date) {
      return NextResponse.json(
        {
          success: false,
          error: "start_date is required",
        },
        { status: 400 }
      );
    }

    if (!body.end_date) {
      return NextResponse.json(
        {
          success: false,
          error: "end_date is required",
        },
        { status: 400 }
      );
    }

    const startDate =
      new Date(`${body.start_date}T00:00:00`);

    const endDate =
      new Date(`${body.end_date}T00:00:00`);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid blocked dates",
        },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "end_date must be after start_date",
        },
        { status: 400 }
      );
    }

    const payload = {
      property_id: body.property_id,
      start_date: body.start_date,
      end_date: body.end_date,
      reason: body.reason || "Unavailable",
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("blocked_dates")
      .insert(payload)
      .select(
        `
        id,
        property_id,
        start_date,
        end_date,
        reason,
        notes,
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
      blocked_date: data,
    });
  } catch (error) {
    console.error("CREATE BLOCKED DATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create blocked date",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();

    const body =
      (await request.json()) as BlockedDatePayload;

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

    if (body.property_id !== undefined) {
      payload.property_id = body.property_id;
    }

    if (body.start_date !== undefined) {
      payload.start_date = body.start_date;
    }

    if (body.end_date !== undefined) {
      payload.end_date = body.end_date;
    }

    if (body.reason !== undefined) {
      payload.reason = body.reason;
    }

    if (body.notes !== undefined) {
      payload.notes = body.notes;
    }

    const { data, error } = await supabase
      .from("blocked_dates")
      .update(payload)
      .eq("id", body.id)
      .select(
        `
        id,
        property_id,
        start_date,
        end_date,
        reason,
        notes,
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
      blocked_date: data,
    });
  } catch (error) {
    console.error("UPDATE BLOCKED DATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update blocked date",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();

    const { searchParams } =
      new URL(request.url);

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
      .from("blocked_dates")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE BLOCKED DATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete blocked date",
      },
      { status: 500 }
    );
  }
}