 import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Legacy chat route disabled. Use /api/chat instead.",
    },
    {
      status: 410,
    }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Legacy chat route disabled. Use /api/chat instead.",
    },
    {
      status: 410,
    }
  );
}