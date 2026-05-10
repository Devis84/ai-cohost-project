import OpenAI from "openai"
import { supabase } from "@/lib/supabase"
import { detectIntent } from "@/lib/ai/intent-router"
import { createIssue } from "@/lib/issue-service"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function generateAIReply({
  propertyId,
  message
}: {
  propertyId: string
  message: string
}) {

  // INTENT DETECTION
  const intent = detectIntent(message)

  if (intent === "complaint") {

    await createIssue({
      propertyId,
      message,
      severity: "high"
    })

  }

  const { data: propertyInfo } = await supabase
    .from("property_info")
    .select("*")
    .eq("property_id", propertyId)
    .single()

  const wifi = propertyInfo?.wifi ?? ""
  const checkin = propertyInfo?.checkin ?? ""
  const checkout = propertyInfo?.checkout ?? ""

  const { data: history } = await supabase
    .from("conversations")
    .select("role,message")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(10)

  const historyMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
    history?.reverse().map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.message
    })) ?? []

  const systemPrompt = `
You are an AI assistant for an Airbnb host.

Use the property information below to answer guest questions.

PROPERTY INFORMATION

Wifi:
${wifi}

Check-in:
${checkin}

Checkout:
${checkout}
`

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: systemPrompt
    },
    ...historyMessages,
    {
      role: "user",
      content: message
    }
  ]

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages
  })

  return completion.choices[0]?.message?.content ?? "Sorry, I couldn't answer that."
}