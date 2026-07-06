 export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getPartnerAccessContext,
  inactiveAccessResponse,
} from "@/lib/partner-access";

type SyncFromBookingsBody = {
  property_slug?: string;
  property_id?: string;
  dry_run?: boolean;
  limit?: number;
};

type BookingRecord = {
  id: string;
  property_id: string | null;
  source_id?: string | null;
  source_type?: string | null;
  source_name?: string | null;
  external_event_id?: string | null;
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  checkin_date?: string | null;
  checkout_date?: string | null;
  guest_count?: number | null;
  status?: string | null;
  notes?: string | null;
  raw_ics_data?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
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

type GuestAccessTokenRecord = {
  id: string;
  property_id: string | null;
  property_slug: string;
  stay_id: string | null;
  booking_id: string | null;
  source: string;
  external_event_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_contact: string | null;
  token: string;
  checkin_date: string | null;
  checkout_date: string | null;
  valid_from: string;
  valid_until: string;
  status: string;
  access_level: string;
  last_used_at: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
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

  return Math.max(1, Math.min(Math.round(value), 500));
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
    throw new Error(`Invalid checkin_date: ${checkinDate}`);
  }

  if (Number.isNaN(checkoutAt.getTime())) {
    throw new Error(`Invalid checkout_date: ${checkoutDate}`);
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

function shouldSyncBooking(booking: BookingRecord) {
  const status = cleanText(booking.status).toLowerCase();
  const checkinDate = cleanDateOnly(booking.checkin_date);
  const checkoutDate = cleanDateOnly(booking.checkout_date);

  if (!checkinDate || !checkoutDate) {
    return {
      sync: false,
      reason: "Missing valid check-in/check-out date",
    };
  }

  if (
    status &&
    ["cancelled", "canceled", "blocked", "unavailable"].includes(status)
  ) {
    return {
      sync: false,
      reason: `Booking status is ${status}`,
    };
  }

  return {
    sync: true,
    reason: "Booking can be synced",
  };
}

async function loadGuestAccessSettings({
  supabase,
  propertySlug,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  propertySlug: string;
}) {
  const { data, error } = await supabase
    .from("guest_access_settings")
    .select("*")
    .eq("property_slug", propertySlug)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const settings = data as GuestAccessSettingsRecord | null;

  return {
    enabled: settings?.enabled === true,
    access_start_hours_before:
      typeof settings?.access_start_hours_before === "number"
        ? settings.access_start_hours_before
        : 24,
    access_end_hours_after:
      typeof settings?.access_end_hours_after === "number"
        ? settings.access_end_hours_after
        : 6,
    raw: settings,
  };
}

export async function POST(request: NextRequest) {
  try {
    const accessContext = await getPartnerAccessContext(request);

    if (!accessContext.isActive) {
      return inactiveAccessResponse(accessContext);
    }

    const body = (await request.json()) as SyncFromBookingsBody;

    const propertySlug =
      cleanText(body.property_slug) || "maltese-maisonette";

    const propertyId = cleanText(body.property_id);
    const dryRun = body.dry_run === true;
    const limit = numberOrDefault(body.limit, 100);

    const supabase = getSupabaseAdminClient();

    const settings = await loadGuestAccessSettings({
      supabase,
      propertySlug,
    });

    let bookingsQuery = supabase
      .from("bookings")
      .select("*")
      .order("checkin_date", { ascending: true })
      .limit(limit);

    if (propertyId) {
      bookingsQuery = bookingsQuery.eq("property_id", propertyId);
    }

    const { data: bookingsData, error: bookingsError } =
      await bookingsQuery;

    if (bookingsError) {
      throw bookingsError;
    }

    const bookings = (bookingsData || []) as BookingRecord[];

    const results: Array<{
      booking_id: string;
      external_event_id: string | null;
      guest_name: string | null;
      checkin_date: string | null;
      checkout_date: string | null;
      action: string;
      reason: string;
      token_id?: string;
      guest_access_url?: string;
    }> = [];

    let createdCount = 0;
    let skippedCount = 0;
    let existingCount = 0;

    for (const booking of bookings) {
      const syncDecision = shouldSyncBooking(booking);

      if (!syncDecision.sync) {
        skippedCount += 1;

        results.push({
          booking_id: booking.id,
          external_event_id: booking.external_event_id || null,
          guest_name: booking.guest_name || null,
          checkin_date: booking.checkin_date || null,
          checkout_date: booking.checkout_date || null,
          action: "skipped",
          reason: syncDecision.reason,
        });

        continue;
      }

      const externalEventId = cleanOptionalText(
        booking.external_event_id
      );

      const {
        data: existingByBookingData,
        error: existingByBookingError,
      } = await supabase
        .from("guest_access_tokens")
        .select("*")
        .eq("property_slug", propertySlug)
        .eq("booking_id", booking.id)
        .limit(1)
        .maybeSingle();

      if (existingByBookingError) {
        throw existingByBookingError;
      }

      let existingToken =
        existingByBookingData as GuestAccessTokenRecord | null;

      if (!existingToken && externalEventId) {
        const {
          data: existingByExternalEventData,
          error: existingByExternalEventError,
        } = await supabase
          .from("guest_access_tokens")
          .select("*")
          .eq("property_slug", propertySlug)
          .eq("external_event_id", externalEventId)
          .limit(1)
          .maybeSingle();

        if (existingByExternalEventError) {
          throw existingByExternalEventError;
        }

        existingToken =
          existingByExternalEventData as GuestAccessTokenRecord | null;
      }

      if (existingToken) {
        existingCount += 1;

        results.push({
          booking_id: booking.id,
          external_event_id: externalEventId,
          guest_name: booking.guest_name || null,
          checkin_date: booking.checkin_date || null,
          checkout_date: booking.checkout_date || null,
          action: "existing",
          reason: "Guest access token already exists",
          token_id: existingToken.id,
          guest_access_url: buildGuestAccessUrl(existingToken.token),
        });

        continue;
      }

      const checkinDate = cleanDateOnly(booking.checkin_date);
      const checkoutDate = cleanDateOnly(booking.checkout_date);

      const { valid_from, valid_until } = createAccessWindow({
        checkinDate,
        checkoutDate,
        accessStartHoursBefore:
          settings.access_start_hours_before,
        accessEndHoursAfter: settings.access_end_hours_after,
      });

      if (dryRun) {
        skippedCount += 1;

        results.push({
          booking_id: booking.id,
          external_event_id: externalEventId,
          guest_name: booking.guest_name || null,
          checkin_date: booking.checkin_date || null,
          checkout_date: booking.checkout_date || null,
          action: "dry_run_create",
          reason: "Dry run only. Token would be created.",
        });

        continue;
      }

      const { data: createdTokenData, error: createError } =
        await supabase
          .from("guest_access_tokens")
          .insert({
            property_id: cleanOptionalText(booking.property_id),
            property_slug: propertySlug,

            booking_id: booking.id,
            stay_id: null,

            source: cleanOptionalText(booking.source_type) || "booking_sync",
            external_event_id: externalEventId,

            guest_name:
              cleanOptionalText(booking.guest_name) ||
              "Imported booking",
            guest_email: cleanOptionalText(booking.guest_email),
            guest_phone: cleanOptionalText(booking.guest_phone),
            guest_contact:
              cleanOptionalText(booking.guest_email) ||
              cleanOptionalText(booking.guest_phone),

            checkin_date: checkinDate,
            checkout_date: checkoutDate,

            valid_from,
            valid_until,

            status: "active",
            access_level: "full",

            metadata: {
              synced_from: "bookings",
              source_name: booking.source_name || null,
              source_type: booking.source_type || null,
              guest_count: booking.guest_count || null,
              booking_status: booking.status || null,
              settings_enabled: settings.enabled,
            },

            updated_at: new Date().toISOString(),
          })
          .select("*")
          .single();

      if (createError) {
        throw createError;
      }

      const createdToken =
        createdTokenData as GuestAccessTokenRecord;

      createdCount += 1;

      results.push({
        booking_id: booking.id,
        external_event_id: externalEventId,
        guest_name: createdToken.guest_name || null,
        checkin_date: createdToken.checkin_date || null,
        checkout_date: createdToken.checkout_date || null,
        action: "created",
        reason: "Guest access token created from booking",
        token_id: createdToken.id,
        guest_access_url: buildGuestAccessUrl(createdToken.token),
      });
    }

    return NextResponse.json({
      success: true,
      property_slug: propertySlug,
      property_id_filter: propertyId || null,
      dry_run: dryRun,
      settings: {
        enabled: settings.enabled,
        access_start_hours_before:
          settings.access_start_hours_before,
        access_end_hours_after: settings.access_end_hours_after,
      },
      summary: {
        bookings_checked: bookings.length,
        created: createdCount,
        existing: existingCount,
        skipped: skippedCount,
      },
      results,
    });
  } catch (error) {
    console.error("GUEST ACCESS SYNC FROM BOOKINGS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to sync guest access from bookings",
      },
      {
        status: 500,
      }
    );
  }
}