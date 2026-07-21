import {
  getLocalizedSensitiveAccessReply,
  normalizeForLanguageDetection,
} from "@/lib/ai/engine/language";

function includesAny(message: string, words: string[]) {
  return words.some((word) => message.includes(word.toLowerCase()));
}

export function isSensitiveAccessRequest(message: string) {
  const normalized = normalizeForLanguageDetection(message);

  const sensitivePatterns = [
    "lockbox code",
    "lock box code",
    "door code",
    "access code",
    "entry code",
    "key safe code",
    "keysafe code",
    "what is the code",
    "give me the code",
    "code for the door",
    "code for the lockbox",
    "pin for the door",
    "pin code",
    "unlock code",
    "codice lockbox",
    "codice porta",
    "codice accesso",
    "codice di accesso",
    "qual è il codice",
    "dammi il codice",
    "pin porta",
    "pin accesso",
    "code d'accès",
    "code de la porte",
    "code du boîtier",
    "codigo de acceso",
    "código de acceso",
    "codigo de la puerta",
    "código de la puerta",
    "codigo del lockbox",
    "código del lockbox",
    "zugangscode",
    "türcode",
    "schlusselcode",
    "schlüsselcode",
  ];

  return includesAny(normalized, sensitivePatterns);
}

export function sanitizeGuestPortalReply({
  reply,
  lockboxCode,
  originalMessage,
}: {
  reply: string;
  lockboxCode?: string | null;
  originalMessage: string;
}) {
  const cleanCode =
    typeof lockboxCode === "string" ? lockboxCode.trim() : "";

  if (cleanCode.length >= 3 && reply.includes(cleanCode)) {
    return getLocalizedSensitiveAccessReply(originalMessage);
  }

  const riskyPatterns = [
    /lockbox code is/i,
    /door code is/i,
    /access code is/i,
    /entry code is/i,
    /key safe code is/i,
    /the code is/i,
    /codice.*è/i,
    /code.*est/i,
    /c[oó]digo.*es/i,
    /zugangscode.*ist/i,
    /türcode.*ist/i,
  ];

  if (riskyPatterns.some((pattern) => pattern.test(reply))) {
    return getLocalizedSensitiveAccessReply(originalMessage);
  }

  return reply;
}