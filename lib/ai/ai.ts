 import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type AIContext =
  | Record<string, unknown>
  | string
  | null
  | undefined

export async function generateAIResponse(
  message: string,
  context: AIContext
) {
  const systemPrompt = `
You are an AI co-host for a short-term rental property.

Your job is to help guests during their stay.

RULES:
- Use ONLY the provided property information.
- Be friendly, clear, and concise.
- Answer like a human concierge.
- Do NOT invent information.
- If you do not know, say you will check with the host.
- Always reply in the same language used by the guest.

PROPERTY DATA:
${
  typeof context === "string"
    ? context
    : JSON.stringify(context || {}, null, 2)
}
`.trim()

  const completion =
    await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
    })

  return completion.choices[0]?.message?.content || ""
}