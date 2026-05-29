 import { supabase } from "@/lib/supabase/supabase"

type CreateCleaningTaskInput = {
  propertyId: string
  checkoutDate: string
}

export async function createCleaningTask({
  propertyId,
  checkoutDate,
}: CreateCleaningTaskInput) {
  try {
    if (!propertyId || !checkoutDate) {
      return null
    }

    const { data, error } = await supabase
      .from("cleaning_tasks")
      .insert([
        {
          property_id: propertyId,
          cleaning_date: checkoutDate,
          status: "pending",
        },
      ])
      .select()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("CREATE CLEANING TASK ERROR:", error)
    return null
  }
}