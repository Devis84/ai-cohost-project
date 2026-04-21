import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {

  try {

    const body = await req.json()

    const { token } = body

    const { data: checkin } = await supabase
      .from("checkins")
      .select("*")
      .eq("token", token)
      .single()

    if (!checkin) {
      return NextResponse.json({ ok: false })
    }

    if (checkin.used) {
      return NextResponse.json({ ok: false })
    }

    await supabase
      .from("checkins")
      .update({ used: true })
      .eq("id", checkin.id)

    await supabase
      .from("stays")
      .insert({
        property_id: checkin.property_id
      })

    return NextResponse.json({ ok: true })

  } catch (error) {

    console.error(error)

    return NextResponse.json({ ok: false })

  }

}