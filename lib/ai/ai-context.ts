 import {
  getProperty,
} from "@/lib/services/property-service"
import {
  getConversationHistory,
} from "@/lib/services/conversation-service"
import {
  buildPromptReadyKnowledge,
  buildUnifiedKnowledgeModel,
} from "@/lib/ai/engine/knowledge-engine"

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

  const model = buildUnifiedKnowledgeModel({
    ...property,
    checkin_time:
      property?.checkin_time ||
      propertyInfo?.check_in,
    checkout_time:
      property?.checkout_time ||
      propertyInfo?.check_out,
    wifi_name:
      property?.wifi_name ||
      propertyInfo?.wifi_name,
    wifi_password:
      property?.wifi_password ||
      propertyInfo?.wifi_password,
    house_rules:
      property?.house_rules ||
      propertyInfo?.house_rules,
    knowledge_base: {
      ...(property?.knowledge_base || {}),
      local_guide: {
        ...(property?.knowledge_base?.local_guide || {}),
        host_recommendations: tipsText,
      },
    },
  })

  const promptKnowledge =
    buildPromptReadyKnowledge(model)

  const systemPrompt = `
You are an AI Airbnb co-host.

Always reply in the same language used by the guest.

PROPERTY

Name: ${model.meta.propertyName}
City: ${model.meta.city}

CHECK-IN
${model.stay.checkinTime}

CHECK-OUT
${model.stay.checkoutTime}

WIFI
Name: ${model.stay.wifiName}
Password: ${model.stay.wifiPassword}

HOUSE RULES
${model.welcomeBook.houseRules}

KNOWLEDGE
${promptKnowledge.compactContext}

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