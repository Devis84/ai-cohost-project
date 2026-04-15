import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {

 const { searchParams } = new URL(req.url)
 const property_id = searchParams.get("property_id")

 if (!property_id) {
  return Response.json([])
 }

 const { data, error } = await supabase
  .from("local_tips")
  .select("*")
  .eq("property_id", property_id)

 if (error) {
  console.error(error)
  return Response.json([])
 }

 return Response.json(data || [])
}