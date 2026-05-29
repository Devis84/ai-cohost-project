 import { NextResponse } from "next/server"

import {
  getConversationHistory,
  markConversationRead,
} from "@/lib/services/conversation-service"
import { supabaseServer } from "@/lib/supabase/supabase-server"

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url)

    const propertyId =
      searchParams.get("property_id")

    const conversationId =
      searchParams.get("conversation_id")

    if (conversationId) {
      const { data: conversation } =
        await supabaseServer
          .from("conversations")
          .select("*")
          .eq("conversation_id", conversationId)
          .maybeSingle()

      const messages =
        await getConversationHistory(
          conversationId,
          100
        )

      return NextResponse.json({
        success: true,
        conversation,
        messages,
      })
    }

    let query = supabaseServer
      .from("conversations")
      .select("*")
      .order("last_message_at", {
        ascending: false,
      })

    if (propertyId) {
      query = query.eq("property_id", propertyId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      conversations: data || [],
    })
  } catch (error) {
    console.error("GET /api/conversations ERROR:", error)

    return NextResponse.json(
      {
        success: false,
        conversations: [],
        error: "Unable to load conversations",
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    const conversationId =
      body.conversationId ||
      body.conversation_id

    if (!conversationId) {
      return NextResponse.json(
        {
          success: false,
          error: "conversationId is required",
        },
        { status: 400 }
      )
    }

    const action = body.action || "mark_read"

    if (action === "mark_read") {
      const conversation =
        await markConversationRead(conversationId)

      return NextResponse.json({
        success: true,
        conversation,
      })
    }

    const payload = {
      ...body,
      updated_at: new Date().toISOString(),
    }

    delete payload.conversationId
    delete payload.conversation_id
    delete payload.action

    const { data, error } = await supabaseServer
      .from("conversations")
      .update(payload)
      .eq("conversation_id", conversationId)
      .select("*")
      .maybeSingle()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      conversation: data,
    })
  } catch (error) {
    console.error("PATCH /api/conversations ERROR:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update conversation",
      },
      { status: 500 }
    )
  }
}