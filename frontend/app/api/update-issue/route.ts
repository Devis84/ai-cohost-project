import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {

  try {

    const body = await req.json()

    const { id, status } = body

    const { error } = await supabase
      .from("issues")
      .update({ status })
      .eq("id", id)

    if (error) {
      console.error(error)
      return NextResponse.json({ ok: false })
    }

    return NextResponse.json({ ok: true })

  } catch (error) {

    console.error(error)
    return NextResponse.json({ ok: false })

  }

}