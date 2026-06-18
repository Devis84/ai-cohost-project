export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type CreateGuestAccessBody = {
  property_slug?: string;
  property_id?: string;
  stay_id?: string;
  booking_id?: string;

  source?: string;
  external_event_id?: string;

  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  guest_contact?: string;

  checkin_date?: string;
  checkout_date?: string;

  access_start_hours_before?: number;
  access_end_hours_after?: number;

  metadata?: Record<string, unknown>;
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

function cleanOptionalText(value: unknown) {
  const cleaned = cleanText(value);
  return cleaned.length > 0 ? cleaned : null;
}

function cleanDateOnly(value: unknown) {
  const cleaned = cleanText(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return "";
  }

  return cleaned;
}

function numberOrDefault(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.round(value);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function createAccessWindow({
  checkinDate,
  checkoutDate,
  accessStartHoursBefore,
  accessEndHoursAfter,
}: {
  checkinDate: string;
  checkoutDate: string;
  accessStartHoursBefore: number;
  accessEndHoursAfter: number;
}) {
  const checkinAt = new Date(`${checkinDate}T15:00:00.000Z`);
  const checkoutAt = new Date(`${checkoutDate}T11:00:00.000Z`);

  if (Number.isNaN(checkinAt.getTime())) {
    throw new Error("Invalid checkin_date");
  }

  if (Number.isNaN(checkoutAt.getTime())) {
    throw new Error("Invalid checkout_date");
  }

  const validFrom = addHours(checkinAt, -Math.abs(accessStartHoursBefore));
  const validUntil = addHours(checkoutAt, Math.abs(accessEndHoursAfter));

  if (validUntil <= validFrom) {
    throw new Error("Invalid access window");
  }

  return {
    valid_from: validFrom.toISOString(),
    valid_until: validUntil.toISOString(),
  };
}

function buildGuestAccessUrl(token: string) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://ai-cohost-project.vercel.app";

  return `${siteUrl.replace(/\/$/, "")}/guest-access/${token}`;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();

    const { searchParams } = new URL(request.url);
    const propertySlug = cleanText(searchParams.get("property_slug"));
    const status = cleanText(searchParams.get("status"));

    let query = supabase
      .from("guest_access_tokens")
      .select(
        "id, property_id, property_slug, stay_id, booking_id, source, external_event_id, guest_name, guest_email, guest_phone, guest_contact, token, checkin_date, checkout_date, valid_from, valid_until, status, access_level, last_used_at, revoked_at, revoked_reason, metadata, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (propertySlug) {
      query = query.eq("property_slug", propertySlug);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const tokens = (data || []).map((item) => ({
      ...item,
      guest_access_url: buildGuestAccessUrl(item.token),
    }));

    return NextResponse.json({
      success: true,
      tokens,
    });
  } catch (error) {
    console.error("GUEST ACCESS LIST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load guest access tokens",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateGuestAccessBody;

    const propertySlug = cleanText(body.property_slug);
    const checkinDate = cleanDateOnly(body.checkin_date);
    const checkoutDate = cleanDateOnly(body.checkout_date);

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

    if (!checkinDate || !checkoutDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid checkin_date and checkout_date are required",
        },
        {
          status: 400,
        }
      );
    }

    const accessStartHoursBefore = numberOrDefault(
      body.access_start_hours_before,
      24
    );

    const accessEndHoursAfter = numberOrDefault(
      body.access_end_hours_after,
      6
    );

    const { valid_from, valid_until } = createAccessWindow({
      checkinDate,
      checkoutDate,
      accessStartHoursBefore,
      accessEndHoursAfter,
    });

    const supabase = getSupabaseAdminClient();

    const insertPayload = {
      property_id: cleanOptionalText(body.property_id),
      property_slug: propertySlug,

      stay_id: cleanOptionalText(body.stay_id),
      booking_id: cleanOptionalText(body.booking_id),

      source: cleanOptionalText(body.source) || "manual",
      external_event_id: cleanOptionalText(body.external_event_id),

      guest_name: cleanOptionalText(body.guest_name),
      guest_email: cleanOptionalText(body.guest_email),
      guest_phone: cleanOptionalText(body.guest_phone),
      guest_contact: cleanOptionalText(body.guest_contact),

      checkin_date: checkinDate,
      checkout_date: checkoutDate,

      valid_from,
      valid_until,

      status: "active",
      access_level: "full",

      metadata: body.metadata || {},
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("guest_access_tokens")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      token: {
        ...data,
        guest_access_url: buildGuestAccessUrl(data.token),
      },
    });
  } catch (error) {
    console.error("GUEST ACCESS CREATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create guest access token",
      },
      {
        status: 500,
      }
    );
  }
}