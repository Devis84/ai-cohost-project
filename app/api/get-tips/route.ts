import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {

  const { searchParams } = new URL(request.url)
  const property_id = searchParams.get("property_id")

  if (!property_id) {
    return NextResponse.json([])
  }

  const { data, error } = await supabase
    .from("local_tips")
    .select("*")
    .eq("property_id", property_id)

  if (error) {
  console.log(error)

  return NextResponse.json({
    success: false,
    tips: [],
  })
}

return NextResponse.json({
  success: true,
  tips: data,
})

}