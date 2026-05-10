import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function generateAIResponse(message: string, context: any) {
  const systemPrompt = `
You are an AI co-host for a property in Sliema, Malta.

Your job is to help guests during their stay.

RULES:
- Use ONLY the provided property information
- Be friendly, clear, and concise
- Answer like a human concierge
- Do NOT invent information
- If you don’t know, say you will check with the host

PROPERTY DATA:
${JSON.stringify(context)}
`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ]
  })

  return completion.choices[0].message.content
}