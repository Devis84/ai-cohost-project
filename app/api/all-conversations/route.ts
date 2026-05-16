 import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data: properties, error: propertiesError } =
      await supabase
        .from("properties")
        .select("*")

    if (propertiesError) {
      throw propertiesError
    }

    const inbox = await Promise.all(
      (properties || []).map(async (property: any) => {
        const { data: lastMessage } = await supabase
          .from("conversations")
          .select("*")
          .eq("property_id", property.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        return {
          propertyId: property.id,
          propertyName: property.property_name,
          city: property.city,

          lastMessage: lastMessage?.message || null,
          role: lastMessage?.role || null,
          created_at: lastMessage?.created_at || null,

          priority: lastMessage?.priority || "normal",
          requires_host: lastMessage?.requires_host || false,
          issue_detected: lastMessage?.issue_detected || null,
        }
      })
    )

    return NextResponse.json({
      success: true,
      inbox,
    })
  } catch (error: any) {
    console.error("ALL CONVERSATIONS ERROR:", error)

    return NextResponse.json(
      {
        success: false,
        inbox: [],
        error: error.message,
      },
      { status: 500 }
    )
  }
}