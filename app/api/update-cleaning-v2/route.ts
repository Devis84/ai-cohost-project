import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    console.log("🚀 V2 ENDPOINT HIT")

    const body = await req.json()
    const { id, cleaner_name, status } = body

    console.log("BODY:", body)

    // 🔥 UPDATE DB
    const { error } = await supabase
      .from("cleaning_tasks")
      .update({
        cleaner_name,
        status
      })
      .eq("id", id)

    if (error) {
      console.error("DB ERROR:", error)
      return NextResponse.json({ success: false })
    }

    // 🔥 TELEGRAM SEND
    const message = `
🧹 Cleaning Update

Cleaner: ${cleaner_name || "Not assigned"}
Status: ${status}
Date: ${new Date().toLocaleDateString()}
`

    const telegramRes = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message
        })
      }
    )

    const telegramData = await telegramRes.json()
    console.log("📩 TELEGRAM:", telegramData)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("SERVER ERROR:", err)
    return NextResponse.json({ success: false })
  }
}