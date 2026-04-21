import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    console.log("=== FETCH CLEANING TASKS ===")

    const { data, error } = await supabase
      .from("cleaning_tasks")
      .select("*")
      .order("cleaning_date", { ascending: true })

    console.log("CLEANING DATA:", data)
    console.log("CLEANING ERROR:", error)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      })
    }

    return NextResponse.json({
      success: true,
      tasks: data
    })

  } catch (err) {
    console.error("API ERROR:", err)

    return NextResponse.json({
      success: false,
      error: "Server error"
    })
  }
}