import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {

  const body = await req.json()

  console.log("BODY:", body)

  const issueId = body.issueId

  if (!issueId) {
    console.log("NO ISSUE ID")
    return NextResponse.json({
      success: false,
      error: "Missing issueId"
    })
  }

  const { data, error } = await supabase
    .from("issues")
    .update({ status: "resolved" })
    .eq("id", issueId)
    .select()

  console.log("UPDATE RESULT:", data, error)

  return NextResponse.json({
    success: true,
    data,
    error
  })
}