 import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing id or status",
        },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("issues")
      .update({
        status,
      })
      .eq("id", id)

    if (error) {
      console.error(error)

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
  } catch (error: any) {
    console.error(error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}