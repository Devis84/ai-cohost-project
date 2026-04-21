import { supabase } from "@/lib/supabase"

/*
GET LAST N MESSAGES (SMART MEMORY)
*/

export async function getConversationHistory(propertyId: string, limit = 6) {

  const { data, error } = await supabase
    .from("conversations")
    .select("role,message")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Conversation history error:", error)
    return []
  }

  /*
  Reverse so the order becomes:
  oldest → newest
  */

  const ordered = (data || []).reverse()

  return ordered
}


/*
SAVE MESSAGE
*/

export async function saveMessage(
  propertyId: string,
  role: string,
  message: string
) {

  const { error } = await supabase
    .from("conversations")
    .insert({
      property_id: propertyId,
      role,
      message
    })

  if (error) {
    console.error("Save message error:", error)
  }

}