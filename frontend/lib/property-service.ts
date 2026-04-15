import { supabase } from "@/lib/supabase"

export async function getProperty(propertyId: string) {

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single()

  if (propertyError) {
    console.error("Property error:", propertyError)
  }

  const { data: propertyInfo, error: infoError } = await supabase
    .from("property_info")
    .select("*")
    .eq("property_id", propertyId)
    .single()

  if (infoError) {
    console.error("Property info error:", infoError)
  }

  const { data: tips, error: tipsError } = await supabase
    .from("local_tips")
    .select("*")
    .eq("property_id", propertyId)

  if (tipsError) {
    console.error("Tips error:", tipsError)
  }

  return {
    property,
    propertyInfo,
    tips
  }

}