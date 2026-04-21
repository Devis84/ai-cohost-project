import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request){

 try{

  const body = await req.json()

  const wifi = body.wifi
  const checkin = body.checkin
  const checkout = body.checkout

  // create property
  const { data: property, error: propertyError } = await supabase
   .from("properties")
   .insert([
    {
     property_name: "My Property"
    }
   ])
   .select()
   .single()

  if(propertyError){
   console.error(propertyError)
   return Response.json({error:propertyError.message},{status:500})
  }

  const property_id = property.id

  // save property info
  const { error: infoError } = await supabase
   .from("property_info")
   .insert([
    {
     property_id,
     wifi,
     checkin,
     checkout
    }
   ])

  if(infoError){
   console.error(infoError)
   return Response.json({error:infoError.message},{status:500})
  }

  return Response.json({
   property_id
  })

 }catch(err){

  console.error(err)

  return Response.json(
   {error:"server error"},
   {status:500}
  )

 }

}