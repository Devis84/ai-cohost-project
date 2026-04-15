import { NextResponse } from "next/server"

export async function POST() {
  console.log("🔥 TEST ROUTE HIT")
  return NextResponse.json({ ok: true })
}