import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {

 const { searchParams } = new URL(req.url)
 const property_id = searchParams.get("property_id")

 if (!property_id) {
  return Response.json(null)
 }

 const { data } = await supabase
  .from("property_info")
  .select("*")
  .eq("property_id", property_id)
  .single()

 return Response.json(data)
}