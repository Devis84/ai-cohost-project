import { supabase } from "@/lib/supabase"

export async function getActiveStay(guestId: string) {

  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("stays")
    .select("*")
    .eq("guest_id", guestId)
    .lte("check_in", today)
    .gte("check_out", today)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    return null
  }

  return data

}

export async function getPropertyIdForGuest(
  guestId: string,
  fallbackPropertyId: string
) {

  const stay = await getActiveStay(guestId)

  if (!stay) {
    return fallbackPropertyId
  }

  return stay.property_id
}