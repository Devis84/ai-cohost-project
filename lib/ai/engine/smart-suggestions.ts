import type { ChatPropertyRecord } from "@/lib/ai/engine/property";

function safeText(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const clean = value.trim();
  return clean || fallback;
}

function getHourOfDay() {
  return new Date().getHours();
}

export function buildSmartSuggestion({
  property,
}: {
  property: ChatPropertyRecord;
}) {
  const hour = getHourOfDay();
  const propertyName = safeText(property.property_name, "your stay");

  if (hour >= 6 && hour < 11) {
    return {
      title: "Good morning",
      message: `Need breakfast ideas, transport tips or local plans near ${propertyName}?`,
      prompts: [
        "Where can I have breakfast nearby?",
        "What should I do today?",
        "How do I get around?",
      ],
    };
  }

  if (hour >= 11 && hour < 16) {
    return {
      title: "Afternoon concierge",
      message: "Ask me for restaurants, beaches, transport or anything about the property.",
      prompts: [
        "Where should I eat nearby?",
        "What are the house rules?",
        "How does checkout work?",
      ],
    };
  }

  if (hour >= 16 && hour < 22) {
    return {
      title: "Evening tips",
      message: "Looking for dinner, sunset spots or a quiet place nearby?",
      prompts: [
        "Recommend dinner nearby",
        "Where can I watch the sunset?",
        "How do I contact the host?",
      ],
    };
  }

  return {
    title: "Need anything?",
    message: "I can help with WiFi, checkout, access guidance, house rules and guest support.",
    prompts: [
      "What is the WiFi?",
      "What time is checkout?",
      "I need help with the apartment",
    ],
  };
}