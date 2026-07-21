 export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";

function sanitizeRedirectTarget(value: string | null) {
  if (!value) {
    return "/login";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/login";
  }

  return value;
}

function clearAuthCookies(response: NextResponse) {
  const options = {
    path: "/",
    maxAge: 0,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  };

  response.cookies.set(
    "ai_cohost_auth",
    "",
    options
  );

  response.cookies.set(
    "ai_cohost_user_email",
    "",
    options
  );

  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUrl = sanitizeRedirectTarget(
    url.searchParams.get("redirect")
  );

  const response = NextResponse.redirect(
    new URL(redirectUrl, request.url)
  );

  return clearAuthCookies(response);
}

export async function POST() {
  const response = NextResponse.json({
    success: true,
  });

  return clearAuthCookies(response);
}