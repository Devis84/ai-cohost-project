import { NextResponse } from "next/server";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out",
  });

  response.cookies.set("ai_cohost_auth", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });

  return response;
}

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out",
  });

  response.cookies.set("ai_cohost_auth", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });

  return response;
}
