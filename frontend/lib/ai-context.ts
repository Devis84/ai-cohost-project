import { getProperty } from "@/lib/property-service"
import { getConversationHistory } from "@/lib/conversation-service"

export async function buildAIContext(propertyId: string) {

  const { property, propertyInfo, tips } =
    await getProperty(propertyId)

  const history =
    await getConversationHistory(propertyId)

  const tipsText =
    tips?.map((t: any) => `• ${t.tip}`).join("\n") || ""

  const systemPrompt = `
You are an AI Airbnb co-host.

Always reply in the same language used by the guest.

PROPERTY

Name: ${property?.property_name || ""}
City: ${property?.city || ""}

CHECK-IN
${propertyInfo?.check_in || ""}

CHECK-OUT
${propertyInfo?.check_out || ""}

WIFI
Name: ${propertyInfo?.wifi_name || ""}
Password: ${propertyInfo?.wifi_password || ""}

HOUSE RULES
${propertyInfo?.house_rules || ""}

LOCAL TIPS
${tipsText}

INSTRUCTIONS

- Be friendly
- Help guests during their stay
- Use property information when possible
- If information is missing say you will notify the host
`

  const historyMessages =
    history.map((msg: any) => {

      const role =
        msg.role === "guest"
          ? "user"
          : "assistant"

      return {
        role,
        content: msg.message
      }

    })

  return {
    systemPrompt,
    historyMessages
  }

}