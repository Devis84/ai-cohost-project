 import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const property_id = searchParams.get("property_id")
    const conversation_id = searchParams.get("conversation_id")

    let query = supabase
      .from("conversations")
      .select("*")
      .order("created_at", { ascending: true })

    if (property_id) {
      query = query.eq("property_id", property_id)
    }

    if (conversation_id) {
      query = query.eq("conversation_id", conversation_id)
    }

    const { data, error } = await query

    if (error) {
      console.error("CONVERSATIONS GET ERROR:", error)

      return NextResponse.json(
        {
          success: false,
          conversations: [],
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      conversations: data || [],
    })
  } catch (error: any) {
    console.error("CONVERSATIONS SERVER ERROR:", error)

    return NextResponse.json(
      {
        success: false,
        conversations: [],
        error: error.message,
      },
      { status: 500 }
    )
  }
}