import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          notifications: [],
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notifications: data || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        notifications: [],
        error: error.message,
      },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    const { id, read } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification id is required",
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("notifications")
      .update({
        read: read ?? true,
      })
      .eq("id", id)
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
      notification: data,
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