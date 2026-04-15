import { supabase } from "@/lib/supabase"

export async function createCleaningTask({
  propertyId,
  checkoutDate
}: {
  propertyId: string
  checkoutDate: string
}) {
  try {
    console.log("CREATING CLEANING TASK:", {
      propertyId,
      checkoutDate
    })

    const { data, error } = await (supabase as any)
      .from("cleaning_tasks")
      .insert([
        {
          property_id: propertyId,
          cleaning_date: checkoutDate,
          status: "pending"
        }
      ])
      .select()

    console.log("CLEANING RESULT:", data, error)

    if (error) {
      throw error
    }

    return data

  } catch (err) {
    console.error("CREATE CLEANING ERROR:", err)
    return null
  }
}