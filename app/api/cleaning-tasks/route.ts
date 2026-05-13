 import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const defaultChecklist = {
  bathroom: false,
  kitchen: false,
  bedroom: false,
  trash: false,
  towels: false,
  final_check: false,
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("cleaning_tasks")
      .select("*")
      .order("cleaning_date", {
        ascending: true,
      })

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
    console.error(
      "CLEANING TASKS GET ERROR:",
      error
    )

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
      checklist,
    } = body

    if (!property_name || !cleaning_date) {
      return NextResponse.json(
        {
          success: false,
          error:
            "property_name and cleaning_date are required",
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
        checkout_time:
          checkout_time || null,
        cleaner_name:
          cleaner_name || null,
        cleaner_contact:
          cleaner_contact || null,
        status: status || "pending",
        notes: notes || null,
        checklist:
          checklist || defaultChecklist,
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
    console.error(
      "CLEANING TASKS POST ERROR:",
      error
    )

    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    const {
      id,
      cleaner_name,
      cleaner_contact,
      status,
      notes,
      checklist,
    } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Task id is required",
        },
        { status: 400 }
      )
    }

    const updatePayload: any = {}

    if (cleaner_name !== undefined) {
      updatePayload.cleaner_name =
        cleaner_name || null
    }

    if (cleaner_contact !== undefined) {
      updatePayload.cleaner_contact =
        cleaner_contact || null
    }

    if (status !== undefined) {
      updatePayload.status = status
    }

    if (notes !== undefined) {
      updatePayload.notes = notes || null
    }

    if (checklist !== undefined) {
      updatePayload.checklist = checklist
    }

    const { data, error } = await supabase
      .from("cleaning_tasks")
      .update(updatePayload)
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
      task: data,
    })
  } catch (error) {
    console.error(
      "CLEANING TASKS PATCH ERROR:",
      error
    )

    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()

    const { id } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Task id is required",
        },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("cleaning_tasks")
      .delete()
      .eq("id", id)

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
    })
  } catch (error) {
    console.error(
      "CLEANING TASK DELETE ERROR:",
      error
    )

    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 }
    )
  }
}