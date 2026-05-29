 import { NextResponse } from "next/server"

import { supabaseServer } from "@/lib/supabase/supabase-server"

export async function GET() {
  try {
    const { data: properties, error: propertiesError } =
      await supabaseServer
        .from("properties")
        .select("*")
        .order("property_name", {
          ascending: true,
        })

    if (propertiesError) {
      throw propertiesError
    }

    const { data: conversations, error: conversationsError } =
      await supabaseServer
        .from("conversations")
        .select("*")
        .order("last_message_at", {
          ascending: false,
        })

    if (conversationsError) {
      throw conversationsError
    }

    const conversationsByProperty =
      new Map<string, unknown[]>()

    for (const conversation of conversations || []) {
      const propertyId = conversation.property_id

      if (!conversationsByProperty.has(propertyId)) {
        conversationsByProperty.set(propertyId, [])
      }

      conversationsByProperty
        .get(propertyId)
        ?.push(conversation)
    }

    const inbox =
      (properties || []).map((property) => {
        const propertyConversations =
          conversationsByProperty.get(property.id) || []

        const latestConversation =
          propertyConversations[0] as
            | Record<string, unknown>
            | undefined

        return {
          propertyId: property.id,
          propertyName:
            property.property_name ||
            property.name ||
            "Untitled property",
          city: property.city || "",

          conversationId:
            latestConversation?.conversation_id ||
            null,

          lastMessage:
            latestConversation?.last_message ||
            latestConversation?.message ||
            null,

          role:
            latestConversation?.last_sender ||
            latestConversation?.role ||
            null,

          created_at:
            latestConversation?.last_message_at ||
            latestConversation?.created_at ||
            null,

          priority:
            latestConversation?.priority ||
            "normal",

          requires_host:
            latestConversation?.requires_host ||
            false,

          issue_detected:
            latestConversation?.issue_detected ||
            null,

          unread_count:
            latestConversation?.unread_count ||
            0,

          conversation_count:
            propertyConversations.length,
        }
      })

    return NextResponse.json({
      success: true,
      inbox,
    })
  } catch (error) {
    console.error("ALL CONVERSATIONS ERROR:", error)

    return NextResponse.json(
      {
        success: false,
        inbox: [],
        error: "Unable to load inbox",
      },
      { status: 500 }
    )
  }
}