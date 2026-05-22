import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/supabase"

export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    const { conversation_id } = body

    if (!conversation_id) {
      return NextResponse.json(
        {
          success: false,
          error: "conversation_id is required",
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("conversations")
      .update({
        unread_count: 0,
      })
      .eq("conversation_id", conversation_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      conversation: data,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}