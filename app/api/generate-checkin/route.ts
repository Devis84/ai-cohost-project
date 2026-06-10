
export const runtime = "nodejs";

 import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const propertyId =
      body.propertyId ||
      body.property_id;

    if (!propertyId) {
      return NextResponse.json(
        {
          ok: false,
          error: "propertyId is required",
        },
        { status: 400 }
      );
    }

    const token = crypto
      .randomBytes(16)
      .toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2);

    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from("checkins")
      .insert({
        property_id: propertyId,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      console.error("GENERATE CHECK-IN ERROR:", error);

      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const url =
      `${baseUrl}/checkin?token=${token}`;

    return NextResponse.json({
      ok: true,
      token,
      url,
    });
  } catch (error) {
    console.error("GENERATE CHECK-IN SERVER ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate check-in link",
      },
      { status: 500 }
    );
  }
}
