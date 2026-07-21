 import { getLocalizedHostAttentionReply } from "@/lib/ai/engine/language";
import { buildUnifiedKnowledgeModel } from "@/lib/ai/engine/knowledge-engine";
import { isSensitiveAccessRequest } from "@/lib/ai/engine/safety";

export type FallbackPropertyRecord = {
  property_name?: string | null;
  wifi_name?: string | null;
  wifi_password?: string | null;
  checkin_time?: string | null;
  checkout_time?: string | null;
  checkin_instructions?: string | null;
  lockbox_code?: string | null;
  emergency_numbers?: string | null;
  house_rules?: string | null;
  description?: string | null;
  amenities?: string | null;
  parking_info?: string | null;
  emergency_info?: string | null;
  ai_knowledge?: string | null;
  knowledge_base?: {
    welcome_book?: {
      description?: string | null;
      amenities?: string | null;
      house_rules?: string | null;
      parking?: string | null;
      restaurants?: string | null;
      transport?: string | null;
      emergency?: string | null;
      checkout_notes?: string | null;
    };
    ai_training?: {
      faq?: string | null;
    };
  } | null;
};

function includesAny(message: string, words: string[]) {
  const lower = message.toLowerCase();
  return words.some((word) => lower.includes(word.toLowerCase()));
}

function valueOrFallback(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function createFallbackReply({
  message,
  property,
  hideSensitiveAccessInfo,
  sensitiveAccessReply,
}: {
  message: string;
  property: FallbackPropertyRecord;
  hideSensitiveAccessInfo: boolean;
  sensitiveAccessReply: string;
}) {
  const knowledge = buildUnifiedKnowledgeModel(property);
  const propertyName = knowledge.meta.propertyName || "the property";

  if (isSensitiveAccessRequest(message)) {
    return sensitiveAccessReply;
  }

  if (
    includesAny(message, [
      "rule",
      "rules",
      "house rule",
      "house rules",
      "allowed",
      "smoking",
      "party",
      "quiet",
      "pet",
      "pets",
      "regole",
      "fumare",
      "festa",
      "animali",
    ])
  ) {
    const houseRules = valueOrFallback(
      knowledge.welcomeBook.houseRules,
      `No specific house rules have been provided yet for ${propertyName}. Please contact the host for confirmation.`
    );

    return `Here are the main house rules for ${propertyName}:\n\n${houseRules}`;
  }

  if (
    includesAny(message, [
      "wifi",
      "wi-fi",
      "internet",
      "password",
      "network",
      "wlan",
      "contraseña",
      "passwort",
    ])
  ) {
    return `The WiFi network is "${valueOrFallback(
      knowledge.stay.wifiName,
      "not available"
    )}" and the password is "${valueOrFallback(
      knowledge.stay.wifiPassword,
      "not available"
    )}".`;
  }

  if (
    includesAny(message, [
      "check in",
      "check-in",
      "arrival",
      "arrive",
      "access",
      "key",
      "door",
      "enter",
      "arrivo",
      "accesso",
      "chiavi",
    ])
  ) {
    const checkinTime = valueOrFallback(knowledge.stay.checkinTime, "not available");
    const instructions = valueOrFallback(
      knowledge.stay.checkinInstructions,
      "No check-in instructions have been provided yet."
    );

    const privateAccessNote = hideSensitiveAccessInfo
      ? " For private access codes, please check the host's private message or contact the host directly."
      : knowledge.stay.lockboxCode
        ? ` The lockbox code is ${knowledge.stay.lockboxCode}.`
        : "";

    return `Check-in is from ${checkinTime}. ${instructions}${privateAccessNote}`;
  }

  if (
    includesAny(message, [
      "checkout",
      "check out",
      "leave",
      "departure",
      "partenza",
      "uscita",
      "salida",
    ])
  ) {
    const checkoutTime = valueOrFallback(
      knowledge.stay.checkoutTime,
      "not available"
    );

    const checkoutNotes =
      knowledge.welcomeBook.checkoutNotes ||
      "Before leaving, please make sure the door is locked and the keys are left as instructed by the host.";

    return `Check-out is at ${checkoutTime}. ${checkoutNotes}`;
  }

  if (includesAny(message, ["parking", "park", "car", "garage", "parcheggio"])) {
    return (
      knowledge.welcomeBook.parking ||
      "Parking information has not been provided yet. Please contact the host if you need exact parking guidance."
    );
  }

  if (
    includesAny(message, [
      "restaurant",
      "restaurants",
      "food",
      "eat",
      "bar",
      "coffee",
      "ristorante",
      "mangiare",
    ])
  ) {
    return (
      knowledge.localGuide.restaurants ||
      knowledge.welcomeBook.restaurants ||
      "Restaurant recommendations have not been added yet. You can ask the host for personal recommendations nearby."
    );
  }

  if (
    includesAny(message, [
      "transport",
      "bus",
      "taxi",
      "ferry",
      "airport",
      "trasporto",
      "aeroporto",
    ])
  ) {
    return (
      knowledge.localGuide.transportGettingAround ||
      knowledge.welcomeBook.transport ||
      "Transport information has not been added yet. A taxi or ride-hailing app is usually the simplest option."
    );
  }

  if (
    includesAny(message, [
      "emergency",
      "urgent",
      "police",
      "hospital",
      "doctor",
      "emergenza",
      "urgente",
    ])
  ) {
    return (
      knowledge.stay.emergencyNumbers ||
      knowledge.welcomeBook.emergency ||
      "For emergencies, call the local emergency number immediately. If this is property-related, contact the host as well."
    );
  }

  if (
    includesAny(message, [
      "cockroach",
      "insect",
      "bug",
      "broken",
      "problem",
      "issue",
      "not working",
      "construction",
      "noise",
      "scarafaggio",
      "insetto",
      "problema",
      "rotto",
      "non funziona",
    ])
  ) {
    return getLocalizedHostAttentionReply(message);
  }

  const description =
    knowledge.welcomeBook.description ||
    `${propertyName} is ready for your stay.`;

  const faq = knowledge.aiTraining.faq || "";

  if (faq) {
    return `${description}\n\nUseful information: ${faq}`;
  }

  return `I can help with WiFi, check-in, parking, house rules, restaurants, transport, amenities and emergency information for ${propertyName}.`;
}