import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {

  const body = await req.json()

  const { property_id, wifi, checkin, checkout } = body

  const { data, error } = await supabase
    .from("property_info")
    .update({
      wifi: wifi,
      checkin: checkin,
      checkout: checkout
    })
    .eq("property_id", property_id)

  if (error) {
    return Response.json({ error: error.message })
  }

  return Response.json({
    success: true
  })

}