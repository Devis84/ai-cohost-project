import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createCleaningTask } from "@/lib/cleaning-service"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const { token } = await req.json()

    console.log("VERIFY TOKEN:", token)

    if (!token) {
      return NextResponse.json({
        success: false,
        error: "Missing token"
      })
    }

    const { data, error } = await supabase
      .from("stays")
      .select("*")
      .eq("checkin_token", token)

    console.log("STAY RESULT:", data, error)

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No stay found"
      })
    }

    const stay = data[0]

    const propertyId = stay.property_id
    const checkoutDate = stay.check_out

    console.log("EXTRACTED:", { propertyId, checkoutDate })

    if (!propertyId) {
      console.log("❌ PROPERTY ID MISSING")
      return NextResponse.json({
        success: false,
        error: "Missing property_id in stay"
      })
    }

    // 🔥 CREA CLEANING TASK CORRETTO
    await createCleaningTask({
      propertyId: propertyId,
      checkoutDate: checkoutDate
    })

    return NextResponse.json({
      success: true
    })

  } catch (err) {
    console.error("VERIFY CHECKIN ERROR:", err)

    return NextResponse.json({
      success: false,
      error: "Server error"
    })
  }
}