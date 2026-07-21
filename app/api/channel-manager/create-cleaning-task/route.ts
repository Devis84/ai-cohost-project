import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getPartnerAccessContext,
  inactiveAccessResponse,
} from "@/lib/partner-access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CreateCleaningTaskPayload = {
  booking_id?: string;
};

type BookingWithProperty = {
  id: string;
  property_id: string;
  guest_name: string | null;
  source_type: string | null;
  checkin_date: string;
  checkout_date: string;
  guest_count: number | null;
  status: string | null;
  cleaning_task_id: string | null;
  properties:
    | {
        id: string;
        property_name: string;
        slug: string | null;
        checkout_time: string | null;
      }
    | {
        id: string;
        property_name: string;
        slug: string | null;
        checkout_time: string | null;
      }[]
    | null;
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

function getPropertyFromBooking(
  booking: BookingWithProperty
) {
  if (Array.isArray(booking.properties)) {
    return booking.properties[0] || null;
  }

  return booking.properties;
}

function getSourceLabel(value: string | null) {
  switch (value) {
    case "airbnb":
      return "Airbnb";
    case "booking":
      return "Booking.com";
    case "direct":
      return "Direct";
    case "whatsapp":
      return "WhatsApp";
    case "manual":
      return "Manual";
    case "owner":
      return "Owner Stay";
    default:
      return "Other";
  }
}

export async function POST(request: Request) {
  try {
    const accessContext = await getPartnerAccessContext(request);

    if (!accessContext.isActive) {
      return inactiveAccessResponse(accessContext);
    }

    const supabase = getSupabaseAdminClient();

    const body =
      (await request.json()) as CreateCleaningTaskPayload;

    if (!body.booking_id) {
      return NextResponse.json(
        {
          success: false,
          error: "booking_id is required",
        },
        { status: 400 }
      );
    }

    const { data: bookingData, error: bookingError } =
      await supabase
        .from("bookings")
        .select(
          `
          id,
          property_id,
          guest_name,
          source_type,
          checkin_date,
          checkout_date,
          guest_count,
          status,
          cleaning_task_id,
          properties (
            id,
            property_name,
            slug,
            checkout_time
          )
        `
        )
        .eq("id", body.booking_id)
        .single();

    if (bookingError) {
      throw bookingError;
    }

    const booking =
      bookingData as BookingWithProperty;

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking not found",
        },
        { status: 404 }
      );
    }

    if (booking.cleaning_task_id) {
      return NextResponse.json({
        success: true,
        already_exists: true,
        cleaning_task_id: booking.cleaning_task_id,
        message:
          "Cleaning task already linked to this booking",
      });
    }

    const property =
      getPropertyFromBooking(booking);

    const propertyName =
      property?.property_name || "Unknown property";

    const checkoutTime =
      property?.checkout_time || "10:00";

    const guestName =
      booking.guest_name || "Guest";

    const sourceLabel =
      getSourceLabel(booking.source_type);

    const notes = [
      `Created from Light Channel Manager.`,
      `Guest: ${guestName}`,
      `Source: ${sourceLabel}`,
      `Check-in: ${booking.checkin_date}`,
      `Check-out: ${booking.checkout_date}`,
      `Guests: ${booking.guest_count || 1}`,
      `Booking ID: ${booking.id}`,
    ].join("\n");

    const checklist = {
      bathroom: false,
      kitchen: false,
      bedroom: false,
      trash: false,
      towels: false,
      final_check: false,
    };

    const { data: cleaningTask, error: cleaningError } =
      await supabase
        .from("cleaning_tasks")
        .insert({
          property_name: propertyName,
          cleaning_date: booking.checkout_date,
          checkout_time: checkoutTime,
          cleaner_name: "",
          status: "pending",
          notes,
          checklist,
        })
        .select(
          `
          id,
          property_name,
          cleaning_date,
          checkout_time,
          cleaner_name,
          status,
          notes,
          checklist,
          created_at
        `
        )
        .single();

    if (cleaningError) {
      throw cleaningError;
    }

    const { error: updateBookingError } =
      await supabase
        .from("bookings")
        .update({
          cleaning_task_id: cleaningTask.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

    if (updateBookingError) {
      throw updateBookingError;
    }

    return NextResponse.json({
      success: true,
      cleaning_task: cleaningTask,
      cleaning_task_id: cleaningTask.id,
    });
  } catch (error) {
    console.error(
      "CREATE CLEANING TASK FROM BOOKING ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create cleaning task",
      },
      { status: 500 }
    );
  }
}