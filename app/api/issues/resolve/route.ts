 import { NextResponse } from "next/server"

import { supabaseServer } from "@/lib/supabase/supabase-server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const issueId =
      body.issueId ||
      body.issue_id ||
      body.id

    if (!issueId) {
      return NextResponse.json(
        {
          success: false,
          error: "issueId is required",
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from("issues")
      .update({
        status: "resolved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", issueId)
      .select("*")
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      issue: data,
    })
  } catch (error) {
    console.error("POST /api/issues/resolve ERROR:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Unable to resolve issue",
      },
      { status: 500 }
    )
  }
}