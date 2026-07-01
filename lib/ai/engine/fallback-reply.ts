 import { getLocalizedHostAttentionReply } from "@/lib/ai/engine/language";
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
  const welcome = property.knowledge_base?.welcome_book || {};
  const aiTraining = property.knowledge_base?.ai_training || {};
  const propertyName = property.property_name || "the property";

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
      welcome.house_rules || property.house_rules,
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
      property.wifi_name,
      "not available"
    )}" and the password is "${valueOrFallback(
      property.wifi_password,
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
    const checkinTime = valueOrFallback(property.checkin_time, "not available");
    const instructions = valueOrFallback(
      property.checkin_instructions,
      "No check-in instructions have been provided yet."
    );

    const privateAccessNote = hideSensitiveAccessInfo
      ? " For private access codes, please check the host's private message or contact the host directly."
      : property.lockbox_code
        ? ` The lockbox code is ${property.lockbox_code}.`
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
      property.checkout_time,
      "not available"
    );

    const checkoutNotes =
      welcome.checkout_notes ||
      "Before leaving, please make sure the door is locked and the keys are left as instructed by the host.";

    return `Check-out is at ${checkoutTime}. ${checkoutNotes}`;
  }

  if (includesAny(message, ["parking", "park", "car", "garage", "parcheggio"])) {
    return (
      welcome.parking ||
      property.parking_info ||
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
      welcome.restaurants ||
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
      welcome.transport ||
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
      property.emergency_numbers ||
      welcome.emergency ||
      property.emergency_info ||
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
    welcome.description ||
    property.description ||
    `${propertyName} is ready for your stay.`;

  const faq = aiTraining.faq || property.ai_knowledge || "";

  if (faq) {
    return `${description}\n\nUseful information: ${faq}`;
  }

  return `I can help with WiFi, check-in, parking, house rules, restaurants, transport, amenities and emergency information for ${propertyName}.`;
}