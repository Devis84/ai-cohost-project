import { NextResponse } from "next/server"
import { createCleaningTask } from "@/lib/cleaning-service"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const propertyId = body.propertyId

    console.log("FORCED CLEANING TASK CREATION")

    if (!propertyId) {
      return NextResponse.json({
        success: false,
        error: "Missing propertyId"
      })
    }

    // ✅ formato corretto per la data
    const checkoutDate = new Date().toISOString().split("T")[0]

    // ✅ chiamata coerente con cleaning-service
    await createCleaningTask({
      propertyId,
      checkoutDate
    })

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error("AI REPLY ERROR:", error)

    return NextResponse.json({
      success: false,
      error: "Server error"
    })
  }
}