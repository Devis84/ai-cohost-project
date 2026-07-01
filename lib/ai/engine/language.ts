export type GuestLanguage = "en" | "it" | "fr" | "es" | "de";

export function normalizeForLanguageDetection(message: string) {
  return message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(message: string, words: string[]) {
  return words.some((word) => message.includes(word.toLowerCase()));
}

export function detectGuestLanguage(message: string): GuestLanguage {
  const normalized = normalizeForLanguageDetection(message);

  const scores: Record<GuestLanguage, number> = {
    en: 0,
    it: includesAny(normalized, [
      "ciao",
      "grazie",
      "dove",
      "come",
      "quando",
      "posso",
      "appartamento",
      "parcheggio",
      "ristorante",
      "spazzatura",
      "regole",
      "chiavi",
      "porta",
      "doccia",
      "acqua calda",
      "lavatrice",
    ])
      ? 1
      : 0,
    fr: includesAny(normalized, [
      "bonjour",
      "merci",
      "où",
      "comment",
      "quand",
      "puis-je",
      "mot de passe",
      "appartement",
      "règles",
      "départ",
      "arrivée",
      "clés",
      "porte",
      "douche",
      "eau chaude",
    ])
      ? 1
      : 0,
    es: includesAny(normalized, [
      "hola",
      "gracias",
      "dónde",
      "cómo",
      "cuándo",
      "puedo",
      "contraseña",
      "aparcamiento",
      "apartamento",
      "reglas",
      "salida",
      "llegada",
      "llaves",
      "puerta",
      "ducha",
      "agua caliente",
    ])
      ? 1
      : 0,
    de: includesAny(normalized, [
      "hallo",
      "danke",
      "wo",
      "wie",
      "wann",
      "kann ich",
      "wlan",
      "passwort",
      "parken",
      "wohnung",
      "regeln",
      "abreise",
      "ankunft",
      "schlüssel",
      "tür",
      "dusche",
    ])
      ? 1
      : 0,
  };

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0] as [
    GuestLanguage,
    number,
  ];

  return best?.[1] > 0 ? best[0] : "en";
}

export function getGuestLanguageInstruction(message: string) {
  const language = detectGuestLanguage(message);

  switch (language) {
    case "it":
      return "The guest appears to be writing in Italian. Reply in Italian.";
    case "fr":
      return "The guest appears to be writing in French. Reply in French.";
    case "es":
      return "The guest appears to be writing in Spanish. Reply in Spanish.";
    case "de":
      return "The guest appears to be writing in German. Reply in German.";
    default:
      return "Reply in English unless the guest clearly writes in another language.";
  }
}

export function getLocalizedOutOfScopeReply(message: string) {
  const language = detectGuestLanguage(message);

  switch (language) {
    case "it":
      return "Posso aiutarti solo con domande relative al tuo soggiorno, all’appartamento, check-in, checkout, WiFi, regole della casa, zona locale, trasporti, ristoranti, emergenze e supporto ospiti. Per qualsiasi altra cosa, contatta direttamente l’host.";
    case "fr":
      return "Je peux uniquement aider avec les questions liées à votre séjour, à l’appartement, au check-in, au checkout, au WiFi, aux règles de la maison, au quartier, aux transports, aux restaurants, aux urgences et à l’assistance voyageur.";
    case "es":
      return "Solo puedo ayudar con preguntas relacionadas con tu estancia, el apartamento, el check-in, el checkout, el WiFi, las normas de la casa, la zona local, el transporte, los restaurantes, emergencias y soporte para huéspedes.";
    case "de":
      return "Ich kann nur bei Fragen zu deinem Aufenthalt, der Wohnung, Check-in, Checkout, WLAN, Hausregeln, Umgebung, Transport, Restaurants, Notfällen und Gästesupport helfen.";
    default:
      return "I can only help with questions related to your stay, the apartment, check-in, checkout, WiFi, house rules, local area, transport, restaurants, emergencies and guest support.";
  }
}

export function getLocalizedSensitiveAccessReply(message: string) {
  const language = detectGuestLanguage(message);

  switch (language) {
    case "it":
      return "Per motivi di sicurezza, non posso mostrare codici di accesso, lockbox o codici porta su questa pagina. Controlla il messaggio privato ricevuto dall’host o contatta direttamente l’host.";
    case "fr":
      return "Pour des raisons de sécurité, je ne peux pas afficher les codes d’accès, de lockbox ou de porte sur cette page. Veuillez vérifier le message privé envoyé par l’hôte ou contacter directement l’hôte.";
    case "es":
      return "Por motivos de seguridad, no puedo mostrar códigos de acceso, lockbox o puerta en esta página. Revisa el mensaje privado enviado por el anfitrión o contacta directamente con el anfitrión.";
    case "de":
      return "Aus Sicherheitsgründen kann ich auf dieser Seite keine Zugangscodes, Lockbox-Codes oder Türcodes anzeigen. Bitte prüfe die private Nachricht des Gastgebers oder kontaktiere den Gastgeber direkt.";
    default:
      return "For security reasons, I cannot show lockbox codes, door codes or private access codes on this page. Please check the private message from the host or contact the host directly.";
  }
}

export function getLocalizedHostAttentionReply(message: string) {
  const language = detectGuestLanguage(message);

  switch (language) {
    case "it":
      return "Mi dispiace per il problema. Ho segnalato la situazione all’host perché potrebbe richiedere attenzione diretta. Se puoi, invia qualche dettaglio in più o una foto.";
    case "fr":
      return "Je suis désolé pour ce problème. J’ai signalé la situation à l’hôte car elle pourrait nécessiter une intervention directe. Si possible, envoyez quelques détails supplémentaires ou une photo.";
    case "es":
      return "Siento el problema. He avisado al anfitrión porque puede requerir atención directa. Si puedes, envía más detalles o una foto.";
    case "de":
      return "Es tut mir leid wegen des Problems. Ich habe den Gastgeber informiert, da dies möglicherweise direkte Aufmerksamkeit erfordert. Wenn möglich, sende bitte weitere Details oder ein Foto.";
    default:
      return "I’m sorry about that. I’ve flagged this to the host because it may need direct attention. If possible, please share a few more details or a photo.";
  }
}