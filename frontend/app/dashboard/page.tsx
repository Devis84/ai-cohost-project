import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {

  try {

    const body = await req.json()

    const issueId = body.issueId

    if (!issueId) {
      return NextResponse.json({
        success: false,
        error: "issueId missing"
      })
    }

    const { data, error } = await supabase
      .from("issues")
      .update({
        status: "resolved"
      })
      .match({
        id: issueId
      })
      .select()

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      })
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (e) {

    return NextResponse.json({
      success: false,
      error: "server error"
    })

  }

}