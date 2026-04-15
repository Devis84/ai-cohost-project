import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import crypto from "crypto"

export async function POST(req: Request) {

  try {

    const body = await req.json()

    const { propertyId } = body

    console.log("PROPERTY ID:", propertyId)

    const token = crypto.randomBytes(16).toString("hex")

    const expires = new Date()
    expires.setDate(expires.getDate() + 2)

    const { data, error } = await supabase
      .from("checkins")
      .insert({
        property_id: propertyId,
        token: token,
        expires_at: expires
      })
      .select()

    if (error) {

      console.error("SUPABASE ERROR:", error)

      return NextResponse.json({
        ok: false,
        error: error.message
      })

    }

    const url = `http://localhost:3000/checkin?token=${token}`

    return NextResponse.json({
      ok: true,
      url
    })

  } catch (error: any) {

    console.error("SERVER ERROR:", error)

    return NextResponse.json({
      ok: false,
      error: error.message
    })

  }

}