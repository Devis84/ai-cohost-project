import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type BookingPayload = {
  id?: string;
  property_id?: string;
  source_id?: string | null;
  source_type?: string;
  source_name?: string | null;
  external_event_id?: string | null;
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  checkin_date?: string;
  checkout_date?: string;
  guest_count?: number;
  status?: string;
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
      .from("bookings")
      .select(
        `
        id,
        property_id,
        source_id,
        source_type,
        source_name,
        external_event_id,
        guest_name,
        guest_email,
        guest_phone,
        checkin_date,
        checkout_date,
        guest_count,
        status,
        notes,
        cleaning_task_id,
        created_at,
        updated_at,
        properties (
          id,
          property_name,
          slug
        )
      `
      )
      .order("checkin_date", {
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
      bookings: data || [],
    });
  } catch (error) {
    console.error("GET BOOKINGS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        bookings: [],
        error:
          error instanceof Error
            ? error.message
            : "Unable to load bookings",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();

    const body =
      (await request.json()) as BookingPayload;

    if (!body.property_id) {
      return NextResponse.json(
        {
          success: false,
          error: "property_id is required",
        },
        { status: 400 }
      );
    }

    if (!body.checkin_date) {
      return NextResponse.json(
        {
          success: false,
          error: "checkin_date is required",
        },
        { status: 400 }
      );
    }

    if (!body.checkout_date) {
      return NextResponse.json(
        {
          success: false,
          error: "checkout_date is required",
        },
        { status: 400 }
      );
    }

    const checkinDate =
      new Date(`${body.checkin_date}T00:00:00`);

    const checkoutDate =
      new Date(`${body.checkout_date}T00:00:00`);

    if (
      Number.isNaN(checkinDate.getTime()) ||
      Number.isNaN(checkoutDate.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid booking dates",
        },
        { status: 400 }
      );
    }

    if (checkoutDate <= checkinDate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "checkout_date must be after checkin_date",
        },
        { status: 400 }
      );
    }

    const payload = {
      property_id: body.property_id,
      source_id: body.source_id || null,
      source_type:
        body.source_type || "manual",
      source_name:
        body.source_name || body.source_type || "Manual",
      external_event_id:
        body.external_event_id || null,
      guest_name:
        body.guest_name || "Manual booking",
      guest_email:
        body.guest_email || null,
      guest_phone:
        body.guest_phone || null,
      checkin_date: body.checkin_date,
      checkout_date: body.checkout_date,
      guest_count:
        typeof body.guest_count === "number" &&
        body.guest_count > 0
          ? body.guest_count
          : 1,
      status: body.status || "confirmed",
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("bookings")
      .insert(payload)
      .select(
        `
        id,
        property_id,
        source_id,
        source_type,
        source_name,
        external_event_id,
        guest_name,
        guest_email,
        guest_phone,
        checkin_date,
        checkout_date,
        guest_count,
        status,
        notes,
        cleaning_task_id,
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
      booking: data,
    });
  } catch (error) {
    console.error("CREATE BOOKING ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create booking",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();

    const body =
      (await request.json()) as BookingPayload;

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

    if (body.source_id !== undefined) {
      payload.source_id = body.source_id;
    }

    if (body.source_type !== undefined) {
      payload.source_type = body.source_type;
    }

    if (body.source_name !== undefined) {
      payload.source_name = body.source_name;
    }

    if (body.external_event_id !== undefined) {
      payload.external_event_id =
        body.external_event_id;
    }

    if (body.guest_name !== undefined) {
      payload.guest_name = body.guest_name;
    }

    if (body.guest_email !== undefined) {
      payload.guest_email = body.guest_email;
    }

    if (body.guest_phone !== undefined) {
      payload.guest_phone = body.guest_phone;
    }

    if (body.checkin_date !== undefined) {
      payload.checkin_date = body.checkin_date;
    }

    if (body.checkout_date !== undefined) {
      payload.checkout_date = body.checkout_date;
    }

    if (body.guest_count !== undefined) {
      payload.guest_count = body.guest_count;
    }

    if (body.status !== undefined) {
      payload.status = body.status;
    }

    if (body.notes !== undefined) {
      payload.notes = body.notes;
    }

    const { data, error } = await supabase
      .from("bookings")
      .update(payload)
      .eq("id", body.id)
      .select(
        `
        id,
        property_id,
        source_id,
        source_type,
        source_name,
        external_event_id,
        guest_name,
        guest_email,
        guest_phone,
        checkin_date,
        checkout_date,
        guest_count,
        status,
        notes,
        cleaning_task_id,
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
      booking: data,
    });
  } catch (error) {
    console.error("UPDATE BOOKING ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update booking",
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
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE BOOKING ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete booking",
      },
      { status: 500 }
    );
  }
}