 import { supabase } from "@/lib/supabase/supabase"
import {
  createCleaningTask,
} from "@/lib/services/cleaning-service"

type StayRecord = {
  id?: string
  property_id: string
  check_out?: string
  checkout_date?: string
  guest_name?: string
  status?: string
}

export async function verifyCheckinToken(
  token: string
) {
  if (!token) {
    return null
  }

  const { data: stays, error } = await supabase
    .from("stays")
    .select("*")
    .eq("checkin_token", token)

  if (error || !stays || stays.length === 0) {
    console.error("VERIFY CHECK-IN ERROR:", error)
    return null
  }

  const stay = stays[0] as StayRecord

  const propertyId = stay.property_id
  const checkoutDate =
    stay.check_out ||
    stay.checkout_date ||
    ""

  if (propertyId && checkoutDate) {
    await createCleaningTask({
      propertyId,
      checkoutDate,
    })
  }

  return {
    propertyId,
    stay,
  }
}