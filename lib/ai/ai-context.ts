 import {
  getProperty,
} from "@/lib/services/property-service"
import {
  getConversationHistory,
} from "@/lib/services/conversation-service"

type LocalTip = {
  name?: string
  title?: string
  tip?: string
  description?: string
}

type ConversationHistoryItem = {
  role?: string
  message?: string
  content?: string
}

export async function buildAIContext(
  propertyId: string
) {
  const {
    property,
    propertyInfo,
    tips,
  } = await getProperty(propertyId)

  const history =
    await getConversationHistory(propertyId)

  const tipsText =
    (tips as LocalTip[] | undefined)
      ?.map((tip) => {
        const label =
          tip.name ||
          tip.title ||
          tip.tip ||
          tip.description ||
          ""

        return label
          ? `• ${label}`
          : null
      })
      .filter(Boolean)
      .join("\n") || ""

  const systemPrompt = `
You are an AI Airbnb co-host.

Always reply in the same language used by the guest.

PROPERTY

Name: ${property?.property_name || property?.name || ""}
City: ${property?.city || ""}

CHECK-IN
${propertyInfo?.check_in || property?.checkin_time || ""}

CHECK-OUT
${propertyInfo?.check_out || property?.checkout_time || ""}

WIFI
Name: ${propertyInfo?.wifi_name || property?.wifi_name || ""}
Password: ${propertyInfo?.wifi_password || property?.wifi_password || ""}

HOUSE RULES
${propertyInfo?.house_rules || property?.house_rules || ""}

LOCAL TIPS
${tipsText}

INSTRUCTIONS

- Be friendly.
- Be concise and practical.
- Help guests during their stay.
- Use property information when possible.
- Always reply in the same language used by the guest.
- If information is missing, say that you will notify the host.
`.trim()

  const historyMessages =
    (history as ConversationHistoryItem[]).map((msg) => {
      const role =
        msg.role === "guest" ||
        msg.role === "user"
          ? "user"
          : "assistant"

      return {
        role,
        content:
          msg.message ||
          msg.content ||
          "",
      }
    })

  return {
    systemPrompt,
    historyMessages,
  }
}