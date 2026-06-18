export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RevokeGuestAccessBody = {
  token?: string;
  id?: string;
  revoked_reason?: string;
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RevokeGuestAccessBody;

    const id = cleanText(body.id);
    const token = cleanText(body.token);
    const revokedReason =
      cleanText(body.revoked_reason) ||
      "Access revoked by host";

    if (!id && !token) {
      return NextResponse.json(
        {
          success: false,
          error: "id or token is required",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getSupabaseAdminClient();

    let query = supabase
      .from("guest_access_tokens")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
        revoked_reason: revokedReason,
        updated_at: new Date().toISOString(),
      })
      .select("*");

    if (id) {
      query = query.eq("id", id);
    } else {
      query = query.eq("token", token);
    }

    const { data, error } = await query.single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      token: data,
    });
  } catch (error) {
    console.error("GUEST ACCESS REVOKE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to revoke guest access token",
      },
      {
        status: 500,
      }
    );
  }
}