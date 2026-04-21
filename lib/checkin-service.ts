import { supabase } from "@/lib/supabase"
import { createCleaningTask } from "@/lib/cleaning-service"

export async function verifyCheckinToken(token: string) {

  console.log("VERIFY TOKEN:", token)

  const { data: stays, error } = await (supabase as any)
    .from("stays")
    .select("*")
    .eq("checkin_token", token)

  if (error || !stays || stays.length === 0) {
    console.log("NO STAY FOUND")
    return null
  }

  const stay = stays[0]

  console.log("STAY FOUND:", stay)

  const propertyId = stay.property_id
  const checkoutDate = stay.check_out

  console.log("EXTRACTED:", { propertyId, checkoutDate })

  await createCleaningTask({
  propertyId,
  checkoutDate: stay.check_out
  })

  return {
    propertyId,
    stay
  }

}