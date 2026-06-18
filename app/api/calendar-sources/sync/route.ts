 import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SyncPayload = {
  source_id?: string;
};

type CalendarSource = {
  id: string;
  property_id: string;
  source_name: string;
  source_type: string;
  ics_url: string;
  is_active: boolean;
};

type IcsEvent = {
  uid: string;
  summary: string;
  dtstart: string;
  dtend: string;
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

function unfoldIcsLines(icsText: string) {
  return icsText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .reduce<string[]>((lines, line) => {
      if (
        line.startsWith(" ") ||
        line.startsWith("\t")
      ) {
        const previous = lines.pop() || "";
        lines.push(previous + line.trim());
      } else {
        lines.push(line.trim());
      }

      return lines;
    }, []);
}

function validateIcsContent(icsText: string) {
  const trimmed = icsText.trim();

  if (!trimmed) {
    throw new Error(
      "The calendar feed is empty. Please check the iCal URL."
    );
  }

  const lower = trimmed.slice(0, 300).toLowerCase();

  if (
    lower.includes("<!doctype html") ||
    lower.includes("<html") ||
    lower.includes("<head") ||
    lower.includes("<body")
  ) {
    throw new Error(
      "This URL returns a web page, not an iCal feed. Please use the Airbnb/Booking.com iCal export URL ending in .ics or containing /calendar/ical/."
    );
  }

  if (!trimmed.includes("BEGIN:VCALENDAR")) {
    throw new Error(
      "This does not look like a valid iCal feed. Please paste the full .ics calendar export URL."
    );
  }

  if (!trimmed.includes("BEGIN:VEVENT")) {
    throw new Error(
      "The iCal feed is valid but contains no booking events."
    );
  }
}

function getIcsValue(
  eventLines: string[],
  key: string
) {
  const line = eventLines.find(
    (item) =>
      item.startsWith(`${key}:`) ||
      item.startsWith(`${key};`)
  );

  if (!line) {
    return "";
  }

  const colonIndex = line.indexOf(":");

  if (colonIndex === -1) {
    return "";
  }

  return line.slice(colonIndex + 1).trim();
}

function normalizeIcsDate(value: string) {
  if (!value) {
    return "";
  }

  const cleanValue = value.trim();

  if (/^\d{8}$/.test(cleanValue)) {
    return `${cleanValue.slice(0, 4)}-${cleanValue.slice(
      4,
      6
    )}-${cleanValue.slice(6, 8)}`;
  }

  if (/^\d{8}T/.test(cleanValue)) {
    return `${cleanValue.slice(0, 4)}-${cleanValue.slice(
      4,
      6
    )}-${cleanValue.slice(6, 8)}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(cleanValue)) {
    return cleanValue.slice(0, 10);
  }

  return "";
}

function parseIcsEvents(icsText: string) {
  validateIcsContent(icsText);

  const lines = unfoldIcsLines(icsText);

  const events: IcsEvent[] = [];
  let currentEventLines: string[] = [];
  let insideEvent = false;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      insideEvent = true;
      currentEventLines = [];
      continue;
    }

    if (line === "END:VEVENT") {
      insideEvent = false;

      const uid =
        getIcsValue(currentEventLines, "UID") ||
        crypto.randomUUID();

      const summary =
        getIcsValue(currentEventLines, "SUMMARY") ||
        "Imported booking";

      const dtstart = normalizeIcsDate(
        getIcsValue(currentEventLines, "DTSTART")
      );

      const dtend = normalizeIcsDate(
        getIcsValue(currentEventLines, "DTEND")
      );

      if (dtstart && dtend) {
        events.push({
          uid,
          summary,
          dtstart,
          dtend,
        });
      }

      currentEventLines = [];
      continue;
    }

    if (insideEvent) {
      currentEventLines.push(line);
    }
  }

  return events;
}

function getGuestNameFromSummary(summary: string) {
  const cleanSummary = summary.trim();

  if (!cleanSummary) {
    return "Imported booking";
  }

  return (
    cleanSummary
      .replace(/^Reservation[:\s-]*/i, "")
      .replace(/^Booking[:\s-]*/i, "")
      .replace(/^Reserved[:\s-]*/i, "")
      .trim() || "Imported booking"
  );
}

async function writeSyncFailure({
  supabase,
  source,
  errorMessage,
  eventsFound,
  bookingsCreated,
  bookingsUpdated,
  bookingsSkipped,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  source: CalendarSource;
  errorMessage: string;
  eventsFound: number;
  bookingsCreated: number;
  bookingsUpdated: number;
  bookingsSkipped: number;
}) {
  const syncedAt = new Date().toISOString();

  await supabase
    .from("booking_sources")
    .update({
      last_sync_at: syncedAt,
      last_sync_status: "error",
      last_sync_error: errorMessage,
      updated_at: syncedAt,
    })
    .eq("id", source.id);

  await supabase
    .from("calendar_sync_logs")
    .insert({
      property_id: source.property_id,
      source_id: source.id,
      status: "error",
      events_found: eventsFound,
      bookings_created: bookingsCreated,
      bookings_updated: bookingsUpdated,
      bookings_skipped: bookingsSkipped,
      error_message: errorMessage,
      synced_at: syncedAt,
    });
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();

  let source: CalendarSource | null = null;
  let eventsFound = 0;
  let bookingsCreated = 0;
  let bookingsUpdated = 0;
  let bookingsSkipped = 0;

  try {
    const body =
      (await request.json()) as SyncPayload;

    if (!body.source_id) {
      return NextResponse.json(
        {
          success: false,
          error: "source_id is required",
        },
        { status: 400 }
      );
    }

    const {
      data: sourceData,
      error: sourceError,
    } = await supabase
      .from("booking_sources")
      .select(
        `
        id,
        property_id,
        source_name,
        source_type,
        ics_url,
        is_active
      `
      )
      .eq("id", body.source_id)
      .single();

    if (sourceError) {
      throw sourceError;
    }

    source = sourceData as CalendarSource;

    if (!source) {
      return NextResponse.json(
        {
          success: false,
          error: "Calendar source not found",
        },
        { status: 404 }
      );
    }

    if (!source.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: "Calendar source is inactive",
        },
        { status: 400 }
      );
    }

    const icsResponse = await fetch(source.ics_url, {
      method: "GET",
      headers: {
        Accept: "text/calendar,text/plain,*/*",
        "User-Agent": "AI-CoHost-Light-Channel-Manager/1.0",
      },
      cache: "no-store",
    });

    if (!icsResponse.ok) {
      throw new Error(
        `Unable to fetch ICS file. HTTP ${icsResponse.status}`
      );
    }

    const contentType =
      icsResponse.headers.get("content-type") || "";

    const icsText = await icsResponse.text();

    if (
      contentType.includes("text/html") ||
      contentType.includes("application/xhtml")
    ) {
      throw new Error(
        "This URL returns a web page, not an iCal feed. Please use the real Airbnb/Booking.com iCal export URL."
      );
    }

    const events = parseIcsEvents(icsText);

    eventsFound = events.length;

    if (events.length === 0) {
      throw new Error(
        "No importable events were found in this iCal feed."
      );
    }

    for (const event of events) {
      const {
        data: existingBooking,
        error: existingError,
      } = await supabase
        .from("bookings")
        .select("id")
        .eq("source_id", source.id)
        .eq("external_event_id", event.uid)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      const payload = {
        property_id: source.property_id,
        source_id: source.id,
        source_type: source.source_type,
        source_name: source.source_name,
        external_event_id: event.uid,
        guest_name: getGuestNameFromSummary(
          event.summary
        ),
        checkin_date: event.dtstart,
        checkout_date: event.dtend,
        guest_count: 1,
        status: "confirmed",
        notes: `Imported from ${source.source_name}`,
        raw_ics_data: event,
        updated_at: new Date().toISOString(),
      };

      if (existingBooking?.id) {
        const { error: updateError } =
          await supabase
            .from("bookings")
            .update(payload)
            .eq("id", existingBooking.id);

        if (updateError) {
          throw updateError;
        }

        bookingsUpdated += 1;
      } else {
        const { error: insertError } =
          await supabase
            .from("bookings")
            .insert(payload);

        if (insertError) {
          throw insertError;
        }

        bookingsCreated += 1;
      }
    }

    const syncedAt = new Date().toISOString();

    await supabase
      .from("booking_sources")
      .update({
        last_sync_at: syncedAt,
        last_sync_status: "success",
        last_sync_error: null,
        updated_at: syncedAt,
      })
      .eq("id", source.id);

    await supabase
      .from("calendar_sync_logs")
      .insert({
        property_id: source.property_id,
        source_id: source.id,
        status: "success",
        events_found: eventsFound,
        bookings_created: bookingsCreated,
        bookings_updated: bookingsUpdated,
        bookings_skipped: bookingsSkipped,
        error_message: null,
        synced_at: syncedAt,
      });

    return NextResponse.json({
      success: true,
      source_id: source.id,
      events_found: eventsFound,
      bookings_created: bookingsCreated,
      bookings_updated: bookingsUpdated,
      bookings_skipped: bookingsSkipped,
    });
  } catch (error) {
    console.error("SYNC CALENDAR SOURCE ERROR:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to sync calendar source";

    if (source) {
      await writeSyncFailure({
        supabase,
        source,
        errorMessage,
        eventsFound,
        bookingsCreated,
        bookingsUpdated,
        bookingsSkipped,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}