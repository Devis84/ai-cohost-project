import type { KnowledgeBase } from "../_types/dashboard";

export type SaveValidationSeverity = "critical" | "recommended";

export type SaveValidationTab =
  | "general"
  | "guestpage"
  | "welcomebook"
  | "localguide"
  | "ai"
  | "extraservices";

export type SaveValidationIssue = {
  id: string;
  severity: SaveValidationSeverity;
  label: string;
  description: string;
  tab: SaveValidationTab;
};

export type SaveValidationResult = {
  isFullyReady: boolean;
  canSaveDirectly: boolean;
  criticalIssues: SaveValidationIssue[];
  recommendedIssues: SaveValidationIssue[];
  allIssues: SaveValidationIssue[];
};

export type DashboardSaveValidationInput = {
  propertyName: string;
  city: string;
  country: string;
  address: string;
  wifiName: string;
  wifiPassword: string;
  checkin: string;
  checkout: string;
  checkinNotes: string;
  lockboxCode: string;
  emergencyNumbers: string;
  knowledgeBase: KnowledgeBase;
  aiEnabled: boolean;
  welcomebookEnabled: boolean;
};

const KEY_RETURN_TERMS = [
  "lockbox",
  "key box",
  "keybox",
  "cassetta",
  "cassettina",
  "chiavi",
  "keys",
];

const CONFLICTING_KEY_INSTRUCTIONS = [
  "leave the keys on the table",
  "leave keys on the table",
  "leave the key on the table",
  "leave key on the table",
  "leave the keys inside",
  "leave keys inside",
  "leave the key inside",
  "leave key inside",
  "lasciare le chiavi sul tavolo",
  "lascia le chiavi sul tavolo",
  "lasciate le chiavi sul tavolo",
  "lasciare la chiave sul tavolo",
  "lascia la chiave sul tavolo",
  "lasciare le chiavi dentro",
  "lascia le chiavi dentro",
  "lasciate le chiavi dentro",
];

function clean(value: string | null | undefined) {
  return (value || "").trim();
}

function hasValue(value: string | null | undefined) {
  return clean(value).length > 0;
}

function includesAny(value: string, terms: string[]) {
  const normalized = value.toLowerCase();

  return terms.some((term) =>
    normalized.includes(term.toLowerCase())
  );
}

function createIssue(
  issue: SaveValidationIssue
): SaveValidationIssue {
  return issue;
}

function collectCheckoutContent(
  knowledgeBase: KnowledgeBase
) {
  return [
    knowledgeBase.welcome_book.checkout_notes,
    knowledgeBase.welcome_book.apartment_instructions,
    knowledgeBase.welcome_book.extra_notes,
    knowledgeBase.ai_training.faq,
    knowledgeBase.ai_training.troubleshooting,
    knowledgeBase.ai_training.additional_notes,
    knowledgeBase.ai_training.hidden_notes,
  ]
    .filter(Boolean)
    .join("\n");
}

function shouldRequireLockboxCode(
  checkinNotes: string,
  knowledgeBase: KnowledgeBase
) {
  const accessContent = [
    checkinNotes,
    knowledgeBase.welcome_book.apartment_instructions,
    knowledgeBase.welcome_book.extra_notes,
    knowledgeBase.ai_training.faq,
  ]
    .filter(Boolean)
    .join("\n");

  return includesAny(accessContent, [
    "lockbox",
    "key box",
    "keybox",
    "cassetta",
    "cassettina",
    "self check-in",
    "self checkin",
  ]);
}

export function validateDashboardSave(
  input: DashboardSaveValidationInput
): SaveValidationResult {
  const criticalIssues: SaveValidationIssue[] = [];
  const recommendedIssues: SaveValidationIssue[] = [];

  const {
    propertyName,
    city,
    country,
    address,
    wifiName,
    wifiPassword,
    checkin,
    checkout,
    checkinNotes,
    lockboxCode,
    emergencyNumbers,
    knowledgeBase,
    aiEnabled,
    welcomebookEnabled,
  } = input;

  const guestPage = knowledgeBase.guest_page;
  const welcomeBook = knowledgeBase.welcome_book;
  const localGuide = knowledgeBase.local_guide;
  const aiTraining = knowledgeBase.ai_training;
  const extraServices = knowledgeBase.extra_services;

  if (!hasValue(propertyName)) {
    criticalIssues.push(
      createIssue({
        id: "missing-property-name",
        severity: "critical",
        label: "Property name is missing",
        description:
          "Add the property name before saving.",
        tab: "general",
      })
    );
  }

  if (!hasValue(city)) {
    criticalIssues.push(
      createIssue({
        id: "missing-city",
        severity: "critical",
        label: "City is missing",
        description:
          "Guests need the correct city for location context and local recommendations.",
        tab: "general",
      })
    );
  }

  if (!hasValue(country)) {
    criticalIssues.push(
      createIssue({
        id: "missing-country",
        severity: "critical",
        label: "Country is missing",
        description:
          "Add the property country to avoid incorrect location information.",
        tab: "general",
      })
    );
  }

  if (!hasValue(address)) {
    recommendedIssues.push(
      createIssue({
        id: "missing-address",
        severity: "recommended",
        label: "Full address is missing",
        description:
          "Add the complete property address for accurate arrival support.",
        tab: "general",
      })
    );
  }

  if (!hasValue(wifiName)) {
    criticalIssues.push(
      createIssue({
        id: "missing-wifi-name",
        severity: "critical",
        label: "Wi-Fi network name is missing",
        description:
          "Add the Wi-Fi network name guests must use.",
        tab: "general",
      })
    );
  }

  if (!hasValue(wifiPassword)) {
    criticalIssues.push(
      createIssue({
        id: "missing-wifi-password",
        severity: "critical",
        label: "Wi-Fi password is missing",
        description:
          "Add the Wi-Fi password shown to guests and used by the Wi-Fi QR.",
        tab: "general",
      })
    );
  }

  if (!hasValue(checkin)) {
    criticalIssues.push(
      createIssue({
        id: "missing-checkin-time",
        severity: "critical",
        label: "Check-in time is missing",
        description:
          "Add the standard check-in time for this property.",
        tab: "general",
      })
    );
  }

  if (!hasValue(checkinNotes)) {
    criticalIssues.push(
      createIssue({
        id: "missing-checkin-instructions",
        severity: "critical",
        label: "Check-in instructions are missing",
        description:
          "Explain clearly how guests enter the property and collect the keys.",
        tab: "general",
      })
    );
  }

  if (!hasValue(checkout)) {
    criticalIssues.push(
      createIssue({
        id: "missing-checkout-time",
        severity: "critical",
        label: "Check-out time is missing",
        description:
          "Add the standard check-out time for this property.",
        tab: "general",
      })
    );
  }

  if (
    shouldRequireLockboxCode(
      checkinNotes,
      knowledgeBase
    ) &&
    !hasValue(lockboxCode)
  ) {
    criticalIssues.push(
      createIssue({
        id: "missing-lockbox-code",
        severity: "critical",
        label: "Lockbox code is missing",
        description:
          "The access instructions mention a lockbox, but no lockbox code is configured.",
        tab: "general",
      })
    );
  }

  if (!hasValue(emergencyNumbers)) {
    criticalIssues.push(
      createIssue({
        id: "missing-emergency-numbers",
        severity: "critical",
        label: "Emergency contacts are missing",
        description:
          "Add the emergency and host contact information available to guests.",
        tab: "general",
      })
    );
  }

  if (
    welcomebookEnabled &&
    !hasValue(welcomeBook.house_rules)
  ) {
    criticalIssues.push(
      createIssue({
        id: "missing-house-rules",
        severity: "critical",
        label: "House rules are missing",
        description:
          "Add clear rules covering noise, parties, visitors, smoking and property care.",
        tab: "welcomebook",
      })
    );
  }

  if (
    welcomebookEnabled &&
    !hasValue(welcomeBook.checkout_notes)
  ) {
    criticalIssues.push(
      createIssue({
        id: "missing-checkout-instructions",
        severity: "critical",
        label: "Check-out instructions are missing",
        description:
          "Add the complete departure checklist, including exactly where guests must leave the keys.",
        tab: "welcomebook",
      })
    );
  }

  const checkoutContent =
    collectCheckoutContent(knowledgeBase);

  if (
    hasValue(welcomeBook.checkout_notes) &&
    includesAny(
      checkoutContent,
      CONFLICTING_KEY_INSTRUCTIONS
    )
  ) {
    criticalIssues.push(
      createIssue({
        id: "conflicting-key-return-instructions",
        severity: "critical",
        label: "Conflicting key-return instructions detected",
        description:
          "Some content tells guests to leave the keys on a table or inside the property. Review and replace it with the correct lockbox instruction.",
        tab: "welcomebook",
      })
    );
  }

  if (
    hasValue(welcomeBook.checkout_notes) &&
    shouldRequireLockboxCode(
      checkinNotes,
      knowledgeBase
    ) &&
    !includesAny(
      welcomeBook.checkout_notes,
      KEY_RETURN_TERMS
    )
  ) {
    criticalIssues.push(
      createIssue({
        id: "checkout-key-return-not-specified",
        severity: "critical",
        label: "Key return is not clearly explained",
        description:
          "The property uses a lockbox, but the check-out instructions do not clearly tell guests to return the keys to it.",
        tab: "welcomebook",
      })
    );
  }

  if (!hasValue(guestPage.hero_title)) {
    recommendedIssues.push(
      createIssue({
        id: "missing-hero-title",
        severity: "recommended",
        label: "Guest Page title is missing",
        description:
          "Add a welcoming title for the property Guest Page.",
        tab: "guestpage",
      })
    );
  }

  if (!hasValue(guestPage.hero_intro)) {
    recommendedIssues.push(
      createIssue({
        id: "missing-hero-intro",
        severity: "recommended",
        label: "Guest Page introduction is missing",
        description:
          "Add a short and useful welcome introduction.",
        tab: "guestpage",
      })
    );
  }

  if (!hasValue(guestPage.hero_image_url)) {
    recommendedIssues.push(
      createIssue({
        id: "missing-hero-image",
        severity: "recommended",
        label: "Guest Page image is missing",
        description:
          "Add a high-quality image to improve the guest-facing experience.",
        tab: "guestpage",
      })
    );
  }

  if (!hasValue(guestPage.about_description)) {
    recommendedIssues.push(
      createIssue({
        id: "missing-property-description",
        severity: "recommended",
        label: "Property description is missing",
        description:
          "Add a clear description of the accommodation and its main advantages.",
        tab: "guestpage",
      })
    );
  }

  if (
    welcomebookEnabled &&
    !hasValue(welcomeBook.amenities)
  ) {
    recommendedIssues.push(
      createIssue({
        id: "missing-amenities",
        severity: "recommended",
        label: "Amenities are missing",
        description:
          "List the facilities and useful items available inside the property.",
        tab: "welcomebook",
      })
    );
  }

  if (
    welcomebookEnabled &&
    !hasValue(welcomeBook.parking)
  ) {
    recommendedIssues.push(
      createIssue({
        id: "missing-parking-information",
        severity: "recommended",
        label: "Parking information is missing",
        description:
          "Explain whether parking is available and where guests may park.",
        tab: "welcomebook",
      })
    );
  }

  if (
    !hasValue(localGuide.neighbourhood_overview)
  ) {
    recommendedIssues.push(
      createIssue({
        id: "missing-neighbourhood-overview",
        severity: "recommended",
        label: "Neighbourhood overview is missing",
        description:
          "Add a short introduction to the surrounding area.",
        tab: "localguide",
      })
    );
  }

  if (!hasValue(localGuide.restaurants)) {
    recommendedIssues.push(
      createIssue({
        id: "missing-restaurants",
        severity: "recommended",
        label: "Restaurant recommendations are missing",
        description:
          "Add reliable nearby food recommendations for guests.",
        tab: "localguide",
      })
    );
  }

  if (
    !hasValue(
      localGuide.transport_getting_around
    )
  ) {
    recommendedIssues.push(
      createIssue({
        id: "missing-transport-information",
        severity: "recommended",
        label: "Transport information is missing",
        description:
          "Explain public transport, taxis and the best ways to move around.",
        tab: "localguide",
      })
    );
  }

  if (
    !hasValue(localGuide.things_to_visit)
  ) {
    recommendedIssues.push(
      createIssue({
        id: "missing-things-to-visit",
        severity: "recommended",
        label: "Things to visit are missing",
        description:
          "Add a short list of useful attractions and activities.",
        tab: "localguide",
      })
    );
  }

  if (aiEnabled && !hasValue(aiTraining.faq)) {
    recommendedIssues.push(
      createIssue({
        id: "missing-ai-faq",
        severity: "recommended",
        label: "AI FAQ training is missing",
        description:
          "Add recurring guest questions so the AI can answer accurately.",
        tab: "ai",
      })
    );
  }

  if (
    aiEnabled &&
    !hasValue(aiTraining.troubleshooting)
  ) {
    recommendedIssues.push(
      createIssue({
        id: "missing-ai-troubleshooting",
        severity: "recommended",
        label: "AI troubleshooting guidance is missing",
        description:
          "Add approved solutions for common property problems.",
        tab: "ai",
      })
    );
  }

  if (
    aiEnabled &&
    !hasValue(aiTraining.escalation_rules)
  ) {
    recommendedIssues.push(
      createIssue({
        id: "missing-ai-escalation-rules",
        severity: "recommended",
        label: "AI escalation rules are missing",
        description:
          "Explain when the AI must stop and contact the host.",
        tab: "ai",
      })
    );
  }

  if (
    extraServices.enabled &&
    !hasValue(extraServices.services)
  ) {
    recommendedIssues.push(
      createIssue({
        id: "missing-extra-services-list",
        severity: "recommended",
        label: "Extra Services are enabled but empty",
        description:
          "Add the services guests can request or disable this module.",
        tab: "extraservices",
      })
    );
  }

  const allIssues = [
    ...criticalIssues,
    ...recommendedIssues,
  ];

  return {
    isFullyReady: allIssues.length === 0,
    canSaveDirectly: allIssues.length === 0,
    criticalIssues,
    recommendedIssues,
    allIssues,
  };
}