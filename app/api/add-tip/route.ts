import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req:Request){

 const body = await req.json()

 const property_id = body.property_id
 const type = body.type
 const title = body.title
 const description = body.description

 await supabase
  .from("local_tips")
  .insert([
    {
      property_id,
      type,
      title,
      description
    }
  ])

 return Response.json({success:true})

}