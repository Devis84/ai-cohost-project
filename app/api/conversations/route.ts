import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ conversations: [] })
  }

  return NextResponse.json({
    conversations: data
  })

}