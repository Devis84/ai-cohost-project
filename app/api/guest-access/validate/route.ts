 export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTokenStayState } from "@/lib/stay-lifecycle-integration";

type ValidateGuestAccessBody = {
  token?: string;
  property_slug?: string;
  mark_used?: boolean;
  gracePeriodHours?: number;
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

function buildGuestAccessUrl(token: string) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://ai-cohost-project.vercel.app";

  return `${siteUrl.replace(/\/$/, "")}/guest-access/${token}`;
}

function getAccessState({
  status,
  validFrom,
  validUntil,
}: {
  status: string;
  validFrom: string;
  validUntil: string;
}) {
  const now = new Date();
  const from = new Date(validFrom);
  const until = new Date(validUntil);

  if (status === "revoked") {
    return {
      allowed: false,
      state: "revoked",
      reason: "Guest access has been revoked",
    };
  }

  if (status === "expired") {
    return {
      allowed: false,
      state: "expired",
      reason: "Guest access has expired",
    };
  }

  if (Number.isNaN(from.getTime()) || Number.isNaN(until.getTime())) {
    return {
      allowed: false,
      state: "invalid_dates",
      reason: "Guest access dates are invalid",
    };
  }

  if (now < from) {
    return {
      allowed: false,
      state: "not_active_yet",
      reason: "Guest access is not active yet",
    };
  }

  if (now > until) {
    return {
      allowed: false,
      state: "expired",
      reason: "Guest access has expired",
    };
  }

  return {
    allowed: true,
    state: "active",
    reason: "Guest access is active",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ValidateGuestAccessBody;

    const token = cleanText(body.token);
    const propertySlug = cleanText(body.property_slug);
    const markUsed = body.mark_used !== false;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          allowed: false,
          state: "missing_token",
          error: "token is required",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getSupabaseAdminClient();

    let query = supabase
      .from("guest_access_tokens")
      .select("*")
      .eq("token", token);

    if (propertySlug) {
      query = query.eq("property_slug", propertySlug);
    }

    const { data, error } = await query.limit(1).single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: true,
          allowed: false,
          state: "not_found",
          reason: "Guest access token was not found",
        },
        {
          status: 200,
        }
      );
    }

    const accessState = getAccessState({
      status: data.status,
      validFrom: data.valid_from,
      validUntil: data.valid_until,
    });

    // Calculate stay lifecycle state
    const stayState = getTokenStayState(
      {
        ...data,
        checkout_date: data.checkout_date || data.valid_until,
      },
      { gracePeriodHours: body.gracePeriodHours || 4 }
    );

    if (markUsed) {
      await supabase
        .from("guest_access_tokens")
        .update({
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
    }

    return NextResponse.json({
      success: true,
      ...accessState,
      stay_state: stayState,
      token: {
        id: data.id,
        property_id: data.property_id,
        property_slug: data.property_slug,
        stay_id: data.stay_id,
        booking_id: data.booking_id,
        source: data.source,
        external_event_id: data.external_event_id,
        guest_name: data.guest_name,
        guest_email: data.guest_email,
        guest_phone: data.guest_phone,
        guest_contact: data.guest_contact,
        token: data.token,
        guest_access_url: buildGuestAccessUrl(data.token),
        checkin_date: data.checkin_date,
        checkout_date: data.checkout_date,
        valid_from: data.valid_from,
        valid_until: data.valid_until,
        status: data.status,
        access_level: data.access_level,
        last_used_at: data.last_used_at,
        revoked_at: data.revoked_at,
        revoked_reason: data.revoked_reason,
        metadata: data.metadata,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    });
  } catch (error) {
    console.error("GUEST ACCESS VALIDATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        allowed: false,
        state: "server_error",
        error:
          error instanceof Error
            ? error.message
            : "Unable to validate guest access token",
      },
      {
        status: 500,
      }
    );
  }
}