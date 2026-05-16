 import OpenAI from "openai"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { buildKnowledgePrompt } from "@/lib/ai/prompt-builder"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function detectEscalation(message: string) {
  const text = message.toLowerCase()

  const urgentKeywords = [
    "emergency",
    "fire",
    "gas",
    "leak",
    "flood",
    "police",
    "ambulance",
    "hospital",
    "locked out",
    "can't enter",
    "cannot enter",
    "danger",
    "unsafe",
  ]

  const complaintKeywords = [
    "refund",
    "dirty",
    "not clean",
    "complaint",
    "angry",
    "unacceptable",
    "broken",
    "not working",
    "mold",
    "smell",
    "noise",
    "terrible",
  ]

  const urgent = urgentKeywords.some((keyword) =>
    text.includes(keyword)
  )

  const complaint = complaintKeywords.some((keyword) =>
    text.includes(keyword)
  )

  if (urgent) {
    return {
      priority: "high",
      requires_host: true,
      issue_detected: "urgent_guest_issue",
    }
  }

  if (complaint) {
    return {
      priority: "medium",
      requires_host: true,
      issue_detected: "guest_complaint",
    }
  }

  return {
    priority: "normal",
    requires_host: false,
    issue_detected: null,
  }
}

export async function POST(req: Request) {
  try {
    const {
      message,
      propertySlug,
      conversationId,
    } = await req.json()

    if (
      !message ||
      !propertySlug ||
      !conversationId
    ) {
      return NextResponse.json(
        {
          error:
            "Missing message, propertySlug or conversationId",
        },
        {
          status: 400,
        }
      )
    }

    /*
    LOAD PROPERTY
    */

    const {
      data: property,
      error: propertyError,
    } = await supabase
      .from("properties")
      .select("*")
      .eq("slug", propertySlug)
      .single()

    if (propertyError || !property) {
      console.error(propertyError)

      return NextResponse.json(
        {
          error: "Property not found",
        },
        {
          status: 404,
        }
      )
    }

    /*
    LOAD MESSAGE HISTORY
    */

    const {
      data: previousMessages,
    } = await supabase
      .from("messages")
      .select("*")
      .eq(
        "conversation_id",
        conversationId
      )
      .order("created_at", {
        ascending: true,
      })
      .limit(20)

    const history =
      previousMessages?.map((m) => ({
        role: m.role,
        content: m.content,
      })) || []

    /*
    BUILD SYSTEM PROMPT
    */

    const systemPrompt =
      buildKnowledgePrompt(property)

    /*
    ESCALATION DETECTION
    */

    const escalation =
      detectEscalation(message)

    /*
    CREATE NOTIFICATION
    */

    if (escalation.requires_host) {
      await supabase
        .from("notifications")
        .insert({
          property_id: property.id,

          type: "guest_issue",

          title:
            "Guest issue detected",

          message,

          priority:
            escalation.priority,
        })
    }

    /*
    SAVE USER MESSAGE
    */

    await supabase
      .from("messages")
      .insert({
        property_id: property.id,

        conversation_id:
          conversationId,

        role: "user",

        content: message,

        priority:
          escalation.priority,

        requires_host:
          escalation.requires_host,

        issue_detected:
          escalation.issue_detected,
      })

    /*
    UPDATE CONVERSATION
    */

    await supabase
      .from("conversations")
      .upsert(
        {
          property_id: property.id,

          conversation_id:
            conversationId,

          role: "user",

          message,

          priority:
            escalation.priority,

          requires_host:
            escalation.requires_host,

          issue_detected:
            escalation.issue_detected,

          status:
            escalation.requires_host
              ? "urgent"
              : "open",

          last_message_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "conversation_id",
        }
      )

    /*
    OPENAI COMPLETION
    */

    const completion =
      await openai.chat.completions.create(
        {
          model: "gpt-4o-mini",

          temperature: 0.2,

          messages: [
            {
              role: "system",
              content: systemPrompt,
            },

            ...history,

            {
              role: "user",
              content: message,
            },
          ],
        }
      )

    const reply =
      completion.choices[0].message
        .content || ""

    /*
    SAVE AI MESSAGE
    */

    await supabase
      .from("messages")
      .insert({
        property_id: property.id,

        conversation_id:
          conversationId,

        role: "assistant",

        content: reply,

        priority: "normal",

        requires_host: false,

        issue_detected: null,
      })

    /*
    UPDATE CONVERSATION
    */

    await supabase
      .from("conversations")
      .upsert(
        {
          property_id: property.id,

          conversation_id:
            conversationId,

          role: "assistant",

          message: reply,

          priority:
            escalation.priority,

          requires_host:
            escalation.requires_host,

          issue_detected:
            escalation.issue_detected,

          status:
            escalation.requires_host
              ? "urgent"
              : "open",

          last_message_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "conversation_id",
        }
      )

    /*
    RESPONSE
    */

    return NextResponse.json({
      reply,
      escalation,
    })
  } catch (error) {
    console.error(
      "CHAT API ERROR:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Something went wrong",
      },
      {
        status: 500,
      }
    )
  }
}