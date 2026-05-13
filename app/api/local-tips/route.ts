 import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {

    const { searchParams } =
      new URL(req.url)

    const property_id =
      searchParams.get("property_id")

    if (!property_id) {
      return NextResponse.json(
        {
          success: false,
          tips: [],
          error: "Missing property_id",
        },
        { status: 400 }
      )
    }

    const { data, error } =
      await supabase
        .from("local_tips")
        .select("*")
        .eq("property_id", property_id)

    if (error) {

      console.error(error)

      return NextResponse.json(
        {
          success: false,
          tips: [],
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tips: data || [],
    })

  } catch (error: any) {

    console.error(error)

    return NextResponse.json(
      {
        success: false,
        tips: [],
        error: error.message,
      },
      { status: 500 }
    )
  }
}