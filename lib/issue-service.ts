import { supabase } from "@/lib/supabase"

export async function createIssue({
  propertyId,
  message,
  severity
}: {
  propertyId: string
  message: string
  severity: string
}) {

  // controlla se esiste già la stessa issue aperta

  const { data: existing } = await supabase
    .from("issues")
    .select("*")
    .eq("property_id", propertyId)
    .eq("message", message)
    .eq("status", "open")
    .limit(1)

  if (existing && existing.length > 0) {
    return existing[0]
  }

  // crea nuova issue

  const { data, error } = await supabase
    .from("issues")
    .insert({
      property_id: propertyId,
      message,
      severity,
      status: "open"
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data

}