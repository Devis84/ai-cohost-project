export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase/supabase-server";

type EmailLoginBody = {
  email?: string;
};

type UserProfile = {
  id: string;
  email: string;
  full_name?: string | null;
  role?: string | null;
  is_active?: boolean | null;
};

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function normalizeEmail(value: unknown) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getCookieOptions() {
  return {
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  };
}

async function writeLoginAudit({
  email,
  action,
  metadata,
}: {
  email: string;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseServer.from("audit_logs").insert({
      user_email: email || null,
      action,
      entity_type: "auth",
      metadata: metadata || {},
    });
  } catch (error) {
    console.error("EMAIL LOGIN AUDIT FAILED:", error);
  }
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json().catch(() => ({}))) as EmailLoginBody;

    const email = normalizeEmail(body.email);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabaseServer
      .from("user_profiles")
      .select("id, email, full_name, role, is_active")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("EMAIL LOGIN USER LOOKUP FAILED:", error);

      await writeLoginAudit({
        email,
        action: "email_login_lookup_failed",
        metadata: {
          error: error.message,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Login check failed. Please try again.",
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      await writeLoginAudit({
        email,
        action: "email_login_denied_unknown_email",
        metadata: {
          reason: "email_not_found_in_user_profiles",
        },
      });

      return NextResponse.json(
        {
          success: false,
          error:
            "This email is not authorized for dashboard access.",
        },
        {
          status: 403,
        }
      );
    }

    const user = data as UserProfile;

    if (!user.is_active) {
      await writeLoginAudit({
        email,
        action: "email_login_denied_inactive_user",
        metadata: {
          user_id: user.id,
          role: user.role || null,
          reason: "user_profile_inactive",
        },
      });

      return NextResponse.json(
        {
          success: false,
          error:
            "This dashboard access has been disabled. Please contact the admin.",
        },
        {
          status: 403,
        }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name || "",
        role: user.role || "viewer",
      },
    });

    const cookieOptions = getCookieOptions();

    response.cookies.set(
      "ai_cohost_auth",
      "true",
      cookieOptions
    );

    response.cookies.set(
      "ai_cohost_user_email",
      email,
      cookieOptions
    );

    await writeLoginAudit({
      email,
      action: "email_login_success",
      metadata: {
        user_id: user.id,
        role: user.role || null,
        full_name: user.full_name || null,
        auth_mode: "email_only_mvp",
      },
    });

    return response;
  } catch (error) {
    console.error("EMAIL LOGIN API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong during login.",
      },
      {
        status: 500,
      }
    );
  }
}