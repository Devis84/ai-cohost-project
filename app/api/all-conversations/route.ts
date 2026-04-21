import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {

  try {

    /*
    LOAD ALL PROPERTIES
    */

    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("*")

    if (propertiesError) {
      throw propertiesError
    }

    /*
    FOR EACH PROPERTY GET LAST MESSAGE
    */

    const inbox = await Promise.all(

      properties.map(async (property: any) => {

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
          created_at: lastMessage?.created_at || null
        }

      })

    )

    return NextResponse.json({
      conversations: inbox
    })

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      { error: "Failed to load conversations" },
      { status: 500 }
    )

  }

}