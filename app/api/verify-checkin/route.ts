 import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    console.log("VERIFY TOKEN:", token);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing token",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("stays")
      .select("*")
      .eq("checkin_token", token);

    console.log("STAY RESULT:", data, error);

    if (error || !data || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No stay found",
        },
        { status: 404 }
      );
    }

    const stay = data[0];

    const propertyId = stay.property_id;
    const checkoutDate = stay.check_out;

    console.log("EXTRACTED:", {
      propertyId,
      checkoutDate,
    });

    if (!propertyId) {
      console.log("PROPERTY ID MISSING");

      return NextResponse.json(
        {
          success: false,
          error: "Missing property_id in stay",
        },
        { status: 400 }
      );
    }

    const { createCleaningTask } = await import(
      "@/lib/services/cleaning-service"
    );

    await createCleaningTask({
      propertyId,
      checkoutDate,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("VERIFY CHECKIN ERROR:", error);

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