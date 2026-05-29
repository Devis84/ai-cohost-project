 import OpenAI from "openai"
import { NextResponse } from "next/server"

import { detectEscalation } from "@/lib/ai/escalation"
import { buildKnowledgePrompt } from "@/lib/ai/prompt-builder"
import {
  findOrCreateConversation,
  getConversationHistory,
  saveConversationMessage,
  updateConversationPreview,
} from "@/lib/services/conversation-service"
import { supabaseServer } from "@/lib/supabase/supabase-server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type ChatRequestBody = {
  message?: string
  propertySlug?: string
  propertyId?: string
  conversationId?: string
  guestName?: string
  guestContact?: string
  channel?: string
}

type ChatHistoryMessage = {
  role?: string
  content?: string
  message?: string
}

async function findProperty({
  propertySlug,
  propertyId,
}: {
  propertySlug?: string
  propertyId?: string
}) {
  if (propertyId) {
    const { data } = await supabaseServer
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .maybeSingle()

    if (data) {
      return data
    }
  }

  if (propertySlug) {
    const cleanSlug =
      decodeURIComponent(propertySlug).trim()

    const { data: bySlug } = await supabaseServer
      .from("properties")
      .select("*")
      .eq("slug", cleanSlug)
      .maybeSingle()

    if (bySlug) {
      return bySlug
    }

    const { data: byName } = await supabaseServer
      .from("properties")
      .select("*")
      .eq("property_name", cleanSlug)
      .maybeSingle()

    if (byName) {
      return byName
    }
  }

  return null
}

function normalizeOpenAIRole(role?: string) {
  if (role === "assistant") {
    return "assistant" as const
  }

  return "user" as const
}

async function createHostAlert({
  propertyId,
  conversationId,
  message,
  priority,
  issueType,
}: {
  propertyId: string
  conversationId: string
  message: string
  priority: string
  issueType: string | null
}) {
  const title =
    priority === "high"
      ? "Urgent guest issue detected"
      : "Guest issue detected"

  const now = new Date().toISOString()

  const notificationResponse =
    await supabaseServer
      .from("notifications")
      .insert({
        property_id: propertyId,
        conversation_id: conversationId,
        type: "guest_issue",
        title,
        message,
        priority,
        read: false,
        created_at: now,
      })

  if (notificationResponse.error) {
    console.error(
      "CREATE NOTIFICATION ERROR:",
      notificationResponse.error
    )
  }

  const issueResponse =
    await supabaseServer
      .from("issues")
      .insert({
        property_id: propertyId,
        conversation_id: conversationId,
        issue_type: issueType || "guest_issue",
        priority,
        status: "open",
        description: message,
        message,
        created_at: now,
        updated_at: now,
      })

  if (issueResponse.error) {
    console.error(
      "CREATE ISSUE ERROR:",
      issueResponse.error
    )
  }
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as ChatRequestBody

    const message = body.message?.trim()
    const propertySlug = body.propertySlug?.trim()
    const propertyId = body.propertyId?.trim()
    const channel = body.channel || "web"

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "message is required",
        },
        { status: 400 }
      )
    }

    if (!propertySlug && !propertyId) {
      return NextResponse.json(
        {
          success: false,
          error: "propertySlug or propertyId is required",
        },
        { status: 400 }
      )
    }

    const property = await findProperty({
      propertySlug,
      propertyId,
    })

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: "Property not found",
        },
        { status: 404 }
      )
    }

    const {
      conversationId,
    } = await findOrCreateConversation({
      conversationId: body.conversationId,
      propertyId: property.id,
      guestName: body.guestName,
      guestContact: body.guestContact,
      channel,
    })

    const history =
      await getConversationHistory(conversationId, 20)

    const escalation =
      detectEscalation(message)

    await saveConversationMessage({
      conversationId,
      propertyId: property.id,
      role: "user",
      content: message,
      channel,
      priority: escalation.priority,
      requiresHost: escalation.requires_host,
      issueDetected: escalation.issue_detected,
    })

    await updateConversationPreview({
      conversationId,
      propertyId: property.id,
      lastMessage: message,
      lastSender: "guest",
      channel,
      priority: escalation.priority,
      requiresHost: escalation.requires_host,
      issueDetected: escalation.issue_detected,
      status: escalation.requires_host
        ? "attention_required"
        : "open",
      guestName: body.guestName,
      guestContact: body.guestContact,
    })

    if (escalation.requires_host) {
      await createHostAlert({
        propertyId: property.id,
        conversationId,
        message,
        priority: escalation.priority,
        issueType: escalation.issue_type,
      })
    }

    const systemPrompt =
      buildKnowledgePrompt(property)

    const openAIHistory =
      (history as ChatHistoryMessage[])
        .filter((item) =>
          Boolean(item.content || item.message)
        )
        .map((item) => ({
          role: normalizeOpenAIRole(item.role),
          content: item.content || item.message || "",
        }))

    const completion =
      await openai.chat.completions.create({
        model:
          process.env.OPENAI_MODEL ||
          "gpt-4.1-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...openAIHistory,
          {
            role: "user",
            content: message,
          },
        ],
      })

    const reply =
      completion.choices[0]?.message?.content ||
      "I’m sorry, I’m unable to answer right now. I will notify the host."

    await saveConversationMessage({
      conversationId,
      propertyId: property.id,
      role: "assistant",
      content: reply,
      channel,
      priority: escalation.priority,
      requiresHost: false,
      issueDetected: null,
    })

    await updateConversationPreview({
      conversationId,
      propertyId: property.id,
      lastMessage: reply,
      lastSender: "assistant",
      channel,
      priority: escalation.priority,
      requiresHost: escalation.requires_host,
      issueDetected: escalation.issue_detected,
      status: escalation.requires_host
        ? "attention_required"
        : "open",
      unreadCount: escalation.requires_host ? 1 : 0,
      guestName: body.guestName,
      guestContact: body.guestContact,
    })

    return NextResponse.json({
      success: true,
      reply,
      conversationId,
      escalation,
    })
  } catch (error) {
    console.error("CHAT API ERROR:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while generating the AI reply",
      },
      { status: 500 }
    )
  }
}