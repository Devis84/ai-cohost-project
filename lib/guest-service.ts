import { supabase } from "@/lib/supabase"

export async function getOrCreateGuest(
  telegramId: string,
  name?: string
) {

  /*
  CHECK IF GUEST EXISTS
  */

  const { data: existing } = await supabase
    .from("guests")
    .select("*")
    .eq("telegram_id", telegramId)
    .single()

  if (existing) {
    return existing
  }

  /*
  CREATE NEW GUEST
  */

  const { data, error } = await supabase
    .from("guests")
    .insert([
      {
        telegram_id: telegramId,
        name: name || "Guest"
      }
    ])
    .select()
    .single()

  if (error) {
    console.error(error)
    return null
  }

  return data

}