
export const runtime = "nodejs";

 import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getPartnerAccessContext,
  inactiveAccessResponse,
} from "@/lib/partner-access";

export const dynamic = "force-dynamic";

const defaultChecklist = {
  bathroom: false,
  kitchen: false,
  bedroom: false,
  trash: false,
  towels: false,
  final_check: false,
};

type CleaningTaskPayload = {
  id?: string;
  property_id?: string | null;
  property_name?: string | null;
  cleaning_date?: string | null;
  checkout_date?: string | null;
  checkout_time?: string | null;
  next_checkin_date?: string | null;
  next_checkin_time?: string | null;
  planned_start_time?: string | null;
  planned_end_time?: string | null;
  actual_start_time?: string | null;
  actual_end_time?: string | null;
  cleaner_name?: string | null;
  cleaner_contact?: string | null;
  hourly_rate?: number | string | null;
  extra_fee?: number | string | null;
  currency?: string | null;
  priority?: string | null;
  status?: string | null;
  notes?: string | null;
  checklist?: Record<string, boolean> | null;
  assigned_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
};

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function normalizeNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return 0;
  }

  return numberValue;
}

function normalizeNullableString(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return String(value);
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function buildInsertPayload(body: CleaningTaskPayload) {
  return {
    property_id: normalizeNullableString(body.property_id),
    property_name: normalizeNullableString(body.property_name),
    cleaning_date: normalizeNullableString(body.cleaning_date),
    checkout_date: normalizeNullableString(body.checkout_date),
    checkout_time: normalizeNullableString(body.checkout_time),
    next_checkin_date: normalizeNullableString(body.next_checkin_date),
    next_checkin_time: normalizeNullableString(body.next_checkin_time),
    planned_start_time: normalizeNullableString(body.planned_start_time),
    planned_end_time: normalizeNullableString(body.planned_end_time),
    actual_start_time: normalizeNullableString(body.actual_start_time),
    actual_end_time: normalizeNullableString(body.actual_end_time),
    cleaner_name: normalizeNullableString(body.cleaner_name),
    cleaner_contact: normalizeNullableString(body.cleaner_contact),
    hourly_rate: normalizeNumber(body.hourly_rate),
    extra_fee: normalizeNumber(body.extra_fee),
    currency: normalizeNullableString(body.currency) || "EUR",
    priority: normalizeNullableString(body.priority) || "normal",
    status: normalizeNullableString(body.status) || "pending",
    notes: normalizeNullableString(body.notes),
    checklist: body.checklist || defaultChecklist,
    assigned_at: body.assigned_at || null,
    started_at: body.started_at || null,
    completed_at: body.completed_at || null,
  };
}

function buildUpdatePayload(body: CleaningTaskPayload) {
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const stringFields: Array<keyof CleaningTaskPayload> = [
    "property_id",
    "property_name",
    "cleaning_date",
    "checkout_date",
    "checkout_time",
    "next_checkin_date",
    "next_checkin_time",
    "planned_start_time",
    "planned_end_time",
    "actual_start_time",
    "actual_end_time",
    "cleaner_name",
    "cleaner_contact",
    "currency",
    "priority",
    "status",
    "notes",
    "assigned_at",
    "started_at",
    "completed_at",
  ];

  stringFields.forEach((field) => {
    if (body[field] !== undefined) {
      updatePayload[field] = normalizeNullableString(body[field]);
    }
  });

  if (body.hourly_rate !== undefined) {
    updatePayload.hourly_rate = normalizeNumber(body.hourly_rate);
  }

  if (body.extra_fee !== undefined) {
    updatePayload.extra_fee = normalizeNumber(body.extra_fee);
  }

  if (body.checklist !== undefined) {
    updatePayload.checklist = body.checklist || defaultChecklist;
  }

  return updatePayload;
}

export async function GET(request: Request) {
  try {
    const accessContext = await getPartnerAccessContext(request);

    if (!accessContext.isActive) {
      return inactiveAccessResponse(accessContext);
    }

    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("cleaning_tasks")
      .select("*")
      .order("cleaning_date", {
        ascending: true,
      })
      .order("planned_start_time", {
        ascending: true,
      });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tasks: data || [],
    });
  } catch (error) {
    console.error("CLEANING TASKS GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const accessContext = await getPartnerAccessContext(req);

    if (!accessContext.isActive) {
      return inactiveAccessResponse(accessContext);
    }

    const supabase = getSupabaseAdminClient();
    const body = (await req.json()) as CleaningTaskPayload;

    if (!body.property_name || !body.cleaning_date) {
      return NextResponse.json(
        {
          success: false,
          error: "property_name and cleaning_date are required",
        },
        { status: 400 }
      );
    }

    const insertPayload = buildInsertPayload(body);

    const { data, error } = await supabase
      .from("cleaning_tasks")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      task: data,
    });
  } catch (error) {
    console.error("CLEANING TASKS POST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Server error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const accessContext = await getPartnerAccessContext(req);

    if (!accessContext.isActive) {
      return inactiveAccessResponse(accessContext);
    }

    const supabase = getSupabaseAdminClient();
    const body = (await req.json()) as CleaningTaskPayload;

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Task id is required",
        },
        { status: 400 }
      );
    }

    const updatePayload = buildUpdatePayload(body);

    const { data, error } = await supabase
      .from("cleaning_tasks")
      .update(updatePayload)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      task: data,
    });
  } catch (error) {
    console.error("CLEANING TASKS PATCH ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Server error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const accessContext = await getPartnerAccessContext(req);

    if (!accessContext.isActive) {
      return inactiveAccessResponse(accessContext);
    }

    const supabase = getSupabaseAdminClient();
    const body = (await req.json()) as CleaningTaskPayload;

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Task id is required",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("cleaning_tasks")
      .delete()
      .eq("id", body.id);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("CLEANING TASK DELETE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Server error",
      },
      { status: 500 }
    );
  }
}
