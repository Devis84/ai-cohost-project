 import { NextResponse } from "next/server"

import { supabaseServer } from "@/lib/supabase/supabase-server"

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("notifications")
      .select("*")
      .order("created_at", {
        ascending: false,
      })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      notifications: data || [],
    })
  } catch (error) {
    console.error("GET /api/notifications ERROR:", error)

    return NextResponse.json(
      {
        success: false,
        notifications: [],
        error: "Unable to load notifications",
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    const id = body.id
    const read = body.read ?? true

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification id is required",
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from("notifications")
      .update({
        read,
      })
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      notification: data,
    })
  } catch (error) {
    console.error("PATCH /api/notifications ERROR:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update notification",
      },
      { status: 500 }
    )
  }
}