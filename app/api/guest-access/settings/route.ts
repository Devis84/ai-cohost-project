export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getPartnerAccessContext,
  inactiveAccessResponse,
} from "@/lib/partner-access";

type GuestAccessSettingsBody = {
  property_slug?: string;
  property_id?: string | null;

  enabled?: boolean;

  access_start_hours_before?: number;
  access_end_hours_after?: number;

  require_token_for_guest_page?: boolean;
  require_token_for_ai?: boolean;
  require_token_for_whatsapp?: boolean;

  expired_message?: string;
  not_active_message?: string;
  revoked_message?: string;

  metadata?: Record<string, unknown>;
};

type GuestAccessSettingsRecord = {
  id: string;
  property_id: string | null;
  property_slug: string;

  enabled: boolean;

  access_start_hours_before: number;
  access_end_hours_after: number;

  require_token_for_guest_page: boolean;
  require_token_for_ai: boolean;
  require_token_for_whatsapp: boolean;

  expired_message: string;
  not_active_message: string;
  revoked_message: string;

  metadata: Record<string, unknown>;

  created_at: string;
  updated_at: string;
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

function booleanOrDefault(value: unknown, fallback: boolean) {
  if (typeof value !== "boolean") {
    return fallback;
  }

  return value;
}

function numberOrDefault(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(Math.round(value), 168));
}

function messageOrDefault(value: unknown, fallback: string) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return fallback;
  }

  return cleaned.slice(0, 1000);
}

function normalizeSettings(
  settings: GuestAccessSettingsRecord | null,
  propertySlug: string
): GuestAccessSettingsRecord {
  const now = new Date().toISOString();

  return {
    id: settings?.id || "",
    property_id: settings?.property_id || null,
    property_slug: settings?.property_slug || propertySlug,

    enabled: settings?.enabled === true,

    access_start_hours_before:
      typeof settings?.access_start_hours_before === "number"
        ? settings.access_start_hours_before
        : 24,

    access_end_hours_after:
      typeof settings?.access_end_hours_after === "number"
        ? settings.access_end_hours_after
        : 6,

    require_token_for_guest_page:
      settings?.require_token_for_guest_page === true,

    require_token_for_ai: settings?.require_token_for_ai === true,

    require_token_for_whatsapp:
      settings?.require_token_for_whatsapp === true,

    expired_message:
      settings?.expired_message ||
      "This guest access has expired because the stay has ended. For anything related to your past stay, please contact the host directly.",

    not_active_message:
      settings?.not_active_message ||
      "This guest access is not active yet. Please check your check-in details or contact the host.",

    revoked_message:
      settings?.revoked_message ||
      "This guest access is no longer available. Please contact the host if you need assistance.",

    metadata: settings?.metadata || {},

    created_at: settings?.created_at || now,
    updated_at: settings?.updated_at || now,
  };
}

export async function GET(request: NextRequest) {
  try {
    const accessContext = await getPartnerAccessContext(request);

    if (!accessContext.isActive) {
      return inactiveAccessResponse(accessContext);
    }

    const { searchParams } = new URL(request.url);
    const propertySlug =
      cleanText(searchParams.get("property_slug")) ||
      "maltese-maisonette";

    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("guest_access_settings")
      .select("*")
      .eq("property_slug", propertySlug)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const settings = normalizeSettings(
      data as GuestAccessSettingsRecord | null,
      propertySlug
    );

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("GUEST ACCESS SETTINGS GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load guest access settings",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessContext = await getPartnerAccessContext(request);

    if (!accessContext.isActive) {
      return inactiveAccessResponse(accessContext);
    }

    const body = (await request.json()) as GuestAccessSettingsBody;

    const propertySlug =
      cleanText(body.property_slug) || "maltese-maisonette";

    const supabase = getSupabaseAdminClient();

    const { data: existingData, error: existingError } = await supabase
      .from("guest_access_settings")
      .select("*")
      .eq("property_slug", propertySlug)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    const existing = normalizeSettings(
      existingData as GuestAccessSettingsRecord | null,
      propertySlug
    );

    const updatePayload = {
      property_id:
        body.property_id === undefined
          ? existing.property_id
          : cleanOptionalText(body.property_id),

      property_slug: propertySlug,

      enabled: booleanOrDefault(body.enabled, existing.enabled),

      access_start_hours_before: numberOrDefault(
        body.access_start_hours_before,
        existing.access_start_hours_before
      ),

      access_end_hours_after: numberOrDefault(
        body.access_end_hours_after,
        existing.access_end_hours_after
      ),

      require_token_for_guest_page: booleanOrDefault(
        body.require_token_for_guest_page,
        existing.require_token_for_guest_page
      ),

      require_token_for_ai: booleanOrDefault(
        body.require_token_for_ai,
        existing.require_token_for_ai
      ),

      require_token_for_whatsapp: booleanOrDefault(
        body.require_token_for_whatsapp,
        existing.require_token_for_whatsapp
      ),

      expired_message: messageOrDefault(
        body.expired_message,
        existing.expired_message
      ),

      not_active_message: messageOrDefault(
        body.not_active_message,
        existing.not_active_message
      ),

      revoked_message: messageOrDefault(
        body.revoked_message,
        existing.revoked_message
      ),

      metadata:
        body.metadata && typeof body.metadata === "object"
          ? body.metadata
          : existing.metadata,

      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("guest_access_settings")
      .upsert(updatePayload, {
        onConflict: "property_slug",
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      settings: data,
    });
  } catch (error) {
    console.error("GUEST ACCESS SETTINGS UPDATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update guest access settings",
      },
      {
        status: 500,
      }
    );
  }
}