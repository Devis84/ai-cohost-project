 import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("cleaning_tasks")
      .select("*")
      .order("cleaning_date", { ascending: true })

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
      tasks: data || [],
    })
  } catch (error) {
    console.error("CLEANING TASKS GET ERROR:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      property_id,
      property_name,
      cleaning_date,
      checkout_time,
      cleaner_name,
      cleaner_contact,
      status,
      notes,
    } = body

    if (!property_name || !cleaning_date) {
      return NextResponse.json(
        {
          success: false,
          error: "property_name and cleaning_date are required",
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("cleaning_tasks")
      .insert({
        property_id: property_id || null,
        property_name,
        cleaning_date,
        checkout_time: checkout_time || null,
        cleaner_name: cleaner_name || null,
        cleaner_contact: cleaner_contact || null,
        status: status || "pending",
        notes: notes || null,
      })
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
      task: data,
    })
  } catch (error) {
    console.error("CLEANING TASKS POST ERROR:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 }
    )
  }
}