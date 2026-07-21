import type {
  KnowledgeBase,
  Property,
} from "../_types/dashboard";

export type PropertyQualitySeverity =
  | "critical"
  | "warning";

export type PropertyQualityStatus =
  | "ready"
  | "needs_review"
  | "blocked";

export type PropertyQualitySection =
  | "general"
  | "guestpage"
  | "welcomebook"
  | "localguide"
  | "ai"
  | "extraservices";

export type PropertyQualityIssue = {
  id: string;
  severity: PropertyQualitySeverity;
  label: string;
  description: string;
  section: PropertyQualitySection;
};

export type PropertyQualityReport = {
  propertyId: string;
  propertyIdentifier: string;
  propertyName: string;
  location: string;
  status: PropertyQualityStatus;
  score: number;
  passedChecks: number;
  totalChecks: number;
  criticalIssues: PropertyQualityIssue[];
  warnings: PropertyQualityIssue[];
  allIssues: PropertyQualityIssue[];
};

const PLACEHOLDER_TERMS = [
  "lorem ipsum",
  "coming soon",
  "to be added",
  "to be confirmed",
  "not available yet",
  "placeholder",
  "insert here",
  "add here",
  "fill this",
  "example text",
  "sample text",
  "tbd",
  "todo",
  "n/a",
];

const CONFLICTING_KEY_TERMS = [
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

const LOCKBOX_TERMS = [
  "lockbox",
  "key box",
  "keybox",
  "cassetta",
  "cassettina",
  "self check-in",
  "self checkin",
];

const KEY_RETURN_TERMS = [
  "lockbox",
  "key box",
  "keybox",
  "cassetta",
  "cassettina",
  "keys",
  "key",
  "chiavi",
  "chiave",
];

const TOTAL_QUALITY_CHECKS = 24;

function clean(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function hasValue(value: unknown) {
  return clean(value).length > 0;
}

function includesAny(
  value: string,
  terms: string[]
) {
  const normalized = value.toLowerCase();

  return terms.some((term) =>
    normalized.includes(term.toLowerCase())
  );
}

function containsPlaceholder(value: string) {
  if (!value.trim()) {
    return false;
  }

  const normalized = value
    .trim()
    .toLowerCase();

  return PLACEHOLDER_TERMS.some((term) => {
    if (term === "n/a") {
      return normalized === term;
    }

    return normalized.includes(term);
  });
}

function issue(
  value: PropertyQualityIssue
): PropertyQualityIssue {
  return value;
}

function getPropertyIdentifier(
  property: Property
) {
  return (
    property.slug ||
    property.id ||
    ""
  );
}

function getLocation(property: Property) {
  return [
    clean(property.city),
    clean(property.country),
  ]
    .filter(Boolean)
    .join(", ");
}

function getKnowledgeBaseText(
  knowledgeBase: KnowledgeBase
) {
  return [
    knowledgeBase.guest_page.hero_title,
    knowledgeBase.guest_page.hero_intro,
    knowledgeBase.guest_page.about_title,
    knowledgeBase.guest_page.about_intro,
    knowledgeBase.guest_page.about_description,
    knowledgeBase.guest_page.about_highlights,

    knowledgeBase.welcome_book.description,
    knowledgeBase.welcome_book.amenities,
    knowledgeBase.welcome_book.house_rules,
    knowledgeBase.welcome_book.apartment_instructions,
    knowledgeBase.welcome_book.kitchen,
    knowledgeBase.welcome_book.washing_machine,
    knowledgeBase.welcome_book.ac,
    knowledgeBase.welcome_book.boiler,
    knowledgeBase.welcome_book.trash,
    knowledgeBase.welcome_book.towels_linen,
    knowledgeBase.welcome_book.beach_towels,
    knowledgeBase.welcome_book.parking,
    knowledgeBase.welcome_book.emergency,
    knowledgeBase.welcome_book.checkout_notes,
    knowledgeBase.welcome_book.extra_notes,
    knowledgeBase.welcome_book.restaurants,
    knowledgeBase.welcome_book.transport,
    knowledgeBase.welcome_book.local_guide,

    knowledgeBase.local_guide.neighbourhood_overview,
    knowledgeBase.local_guide.restaurants,
    knowledgeBase.local_guide.breakfast_coffee,
    knowledgeBase.local_guide.bars,
    knowledgeBase.local_guide.beaches,
    knowledgeBase.local_guide.things_to_visit,
    knowledgeBase.local_guide.transport_getting_around,
    knowledgeBase.local_guide.useful_services,
    knowledgeBase.local_guide.host_recommendations,

    knowledgeBase.ai_training.faq,
    knowledgeBase.ai_training.troubleshooting,
    knowledgeBase.ai_training.guest_style,
    knowledgeBase.ai_training.complaint_handling,
    knowledgeBase.ai_training.escalation_rules,
    knowledgeBase.ai_training.hidden_notes,
    knowledgeBase.ai_training.additional_notes,

    knowledgeBase.extra_services.title,
    knowledgeBase.extra_services.intro,
    knowledgeBase.extra_services.services,
    knowledgeBase.extra_services.host_note,
  ]
    .filter(Boolean)
    .join("\n");
}

function getCheckoutText(
  knowledgeBase: KnowledgeBase
) {
  return [
    knowledgeBase.welcome_book.checkout_notes,
    knowledgeBase.welcome_book.apartment_instructions,
    knowledgeBase.welcome_book.extra_notes,
    knowledgeBase.ai_training.faq,
    knowledgeBase.ai_training.troubleshooting,
    knowledgeBase.ai_training.hidden_notes,
    knowledgeBase.ai_training.additional_notes,
  ]
    .filter(Boolean)
    .join("\n");
}

function propertyUsesLockbox(
  property: Property,
  knowledgeBase: KnowledgeBase
) {
  const accessText = [
    clean(property.checkin_instructions),
    knowledgeBase.welcome_book.apartment_instructions,
    knowledgeBase.welcome_book.extra_notes,
    knowledgeBase.ai_training.faq,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    hasValue(property.lockbox_code) ||
    includesAny(
      accessText,
      LOCKBOX_TERMS
    )
  );
}

function addMissingFieldIssue({
  issues,
  id,
  value,
  label,
  description,
  section,
  severity,
}: {
  issues: PropertyQualityIssue[];
  id: string;
  value: unknown;
  label: string;
  description: string;
  section: PropertyQualitySection;
  severity: PropertyQualitySeverity;
}) {
  if (hasValue(value)) {
    return;
  }

  issues.push(
    issue({
      id,
      severity,
      label,
      description,
      section,
    })
  );
}

export function buildPropertyQualityReport({
  property,
  knowledgeBase,
}: {
  property: Property;
  knowledgeBase: KnowledgeBase;
}): PropertyQualityReport {
  const criticalIssues: PropertyQualityIssue[] =
    [];
  const warnings: PropertyQualityIssue[] = [];

  addMissingFieldIssue({
    issues: criticalIssues,
    id: "property-name",
    value: property.property_name,
    label: "Property name is missing",
    description:
      "The property must have a clear and recognizable name.",
    section: "general",
    severity: "critical",
  });

  addMissingFieldIssue({
    issues: criticalIssues,
    id: "city",
    value: property.city,
    label: "City is missing",
    description:
      "City information is required for accurate guest and AI location context.",
    section: "general",
    severity: "critical",
  });

  addMissingFieldIssue({
    issues: criticalIssues,
    id: "country",
    value: property.country,
    label: "Country is missing",
    description:
      "Country information is required for accurate guest and AI location context.",
    section: "general",
    severity: "critical",
  });

  addMissingFieldIssue({
    issues: warnings,
    id: "address",
    value: property.address,
    label: "Full address is missing",
    description:
      "Add the complete property address for arrival and emergency support.",
    section: "general",
    severity: "warning",
  });

  addMissingFieldIssue({
    issues: criticalIssues,
    id: "wifi-name",
    value: property.wifi_name,
    label: "Wi-Fi network is missing",
    description:
      "Guests cannot receive reliable Wi-Fi instructions without the network name.",
    section: "general",
    severity: "critical",
  });

  addMissingFieldIssue({
    issues: criticalIssues,
    id: "wifi-password",
    value: property.wifi_password,
    label: "Wi-Fi password is missing",
    description:
      "Guests and the Wi-Fi QR require the correct password.",
    section: "general",
    severity: "critical",
  });

  addMissingFieldIssue({
    issues: criticalIssues,
    id: "checkin-time",
    value: property.checkin_time,
    label: "Check-in time is missing",
    description:
      "The standard arrival time must be clearly configured.",
    section: "general",
    severity: "critical",
  });

  addMissingFieldIssue({
    issues: criticalIssues,
    id: "checkout-time",
    value: property.checkout_time,
    label: "Check-out time is missing",
    description:
      "The standard departure time must be clearly configured.",
    section: "general",
    severity: "critical",
  });

  addMissingFieldIssue({
    issues: criticalIssues,
    id: "checkin-instructions",
    value: property.checkin_instructions,
    label: "Check-in instructions are missing",
    description:
      "Guests need exact instructions for entering the property and collecting keys.",
    section: "general",
    severity: "critical",
  });

  addMissingFieldIssue({
    issues: criticalIssues,
    id: "emergency-numbers",
    value: property.emergency_numbers,
    label: "Emergency contacts are missing",
    description:
      "Add emergency and host contact information available to guests.",
    section: "general",
    severity: "critical",
  });

  addMissingFieldIssue({
    issues: criticalIssues,
    id: "house-rules",
    value:
      knowledgeBase.welcome_book
        .house_rules,
    label: "House rules are missing",
    description:
      "Guests need clear rules covering noise, parties, visitors, smoking and property care.",
    section: "welcomebook",
    severity: "critical",
  });

  addMissingFieldIssue({
    issues: criticalIssues,
    id: "checkout-instructions",
    value:
      knowledgeBase.welcome_book
        .checkout_notes,
    label: "Check-out instructions are missing",
    description:
      "Add the full departure checklist and explain exactly where keys must be returned.",
    section: "welcomebook",
    severity: "critical",
  });

  addMissingFieldIssue({
    issues: warnings,
    id: "description",
    value:
      knowledgeBase.guest_page
        .about_description,
    label: "Property description is missing",
    description:
      "Add a clear description of the accommodation and its main advantages.",
    section: "guestpage",
    severity: "warning",
  });

  addMissingFieldIssue({
    issues: warnings,
    id: "hero-title",
    value:
      knowledgeBase.guest_page.hero_title,
    label: "Guest Page title is missing",
    description:
      "Add a clear and welcoming title for the guest experience.",
    section: "guestpage",
    severity: "warning",
  });

  addMissingFieldIssue({
    issues: warnings,
    id: "hero-intro",
    value:
      knowledgeBase.guest_page.hero_intro,
    label: "Guest Page introduction is missing",
    description:
      "Add a short introduction for arriving guests.",
    section: "guestpage",
    severity: "warning",
  });

  addMissingFieldIssue({
    issues: warnings,
    id: "hero-image",
    value:
      knowledgeBase.guest_page
        .hero_image_url,
    label: "Guest Page image is missing",
    description:
      "Add a high-quality property image.",
    section: "guestpage",
    severity: "warning",
  });

  addMissingFieldIssue({
    issues: warnings,
    id: "amenities",
    value:
      knowledgeBase.welcome_book
        .amenities,
    label: "Amenities are missing",
    description:
      "List the facilities and useful items available inside the property.",
    section: "welcomebook",
    severity: "warning",
  });

  addMissingFieldIssue({
    issues: warnings,
    id: "parking",
    value:
      knowledgeBase.welcome_book.parking,
    label: "Parking information is missing",
    description:
      "Explain whether parking is available and where guests may park.",
    section: "welcomebook",
    severity: "warning",
  });

  addMissingFieldIssue({
    issues: warnings,
    id: "neighbourhood",
    value:
      knowledgeBase.local_guide
        .neighbourhood_overview,
    label: "Neighbourhood overview is missing",
    description:
      "Add an introduction to the surrounding area.",
    section: "localguide",
    severity: "warning",
  });

  addMissingFieldIssue({
    issues: warnings,
    id: "restaurants",
    value:
      knowledgeBase.local_guide
        .restaurants,
    label: "Restaurant recommendations are missing",
    description:
      "Add reliable nearby food recommendations.",
    section: "localguide",
    severity: "warning",
  });

  addMissingFieldIssue({
    issues: warnings,
    id: "transport",
    value:
      knowledgeBase.local_guide
        .transport_getting_around,
    label: "Transport information is missing",
    description:
      "Explain public transport, taxis and how guests should move around.",
    section: "localguide",
    severity: "warning",
  });

  addMissingFieldIssue({
    issues: warnings,
    id: "things-to-visit",
    value:
      knowledgeBase.local_guide
        .things_to_visit,
    label: "Things to visit are missing",
    description:
      "Add useful attractions and activities.",
    section: "localguide",
    severity: "warning",
  });

  if (
    property.ai_enabled !== false &&
    !hasValue(
      knowledgeBase.ai_training.faq
    )
  ) {
    warnings.push(
      issue({
        id: "ai-faq",
        severity: "warning",
        label: "AI FAQ training is missing",
        description:
          "Add recurring guest questions so the AI can answer reliably.",
        section: "ai",
      })
    );
  }

  if (
    property.ai_enabled !== false &&
    !hasValue(
      knowledgeBase.ai_training
        .troubleshooting
    )
  ) {
    warnings.push(
      issue({
        id: "ai-troubleshooting",
        severity: "warning",
        label:
          "AI troubleshooting guidance is missing",
        description:
          "Add approved solutions for common guest and property problems.",
        section: "ai",
      })
    );
  }

  if (
    property.ai_enabled !== false &&
    !hasValue(
      knowledgeBase.ai_training
        .escalation_rules
    )
  ) {
    warnings.push(
      issue({
        id: "ai-escalation",
        severity: "warning",
        label: "AI escalation rules are missing",
        description:
          "Define when the AI must stop and contact the host.",
        section: "ai",
      })
    );
  }

  if (
    knowledgeBase.extra_services.enabled &&
    !hasValue(
      knowledgeBase.extra_services
        .services
    )
  ) {
    warnings.push(
      issue({
        id: "extra-services-empty",
        severity: "warning",
        label:
          "Extra Services are enabled but empty",
        description:
          "Add the available services or disable the module.",
        section: "extraservices",
      })
    );
  }

  const fullKnowledgeText =
    getKnowledgeBaseText(knowledgeBase);

  if (
    containsPlaceholder(fullKnowledgeText)
  ) {
    criticalIssues.push(
      issue({
        id: "placeholder-content",
        severity: "critical",
        label:
          "Placeholder or unfinished content detected",
        description:
          "One or more fields contain placeholder text such as TBD, coming soon or sample content.",
        section: "general",
      })
    );
  }

  const checkoutText =
    getCheckoutText(knowledgeBase);

  if (
    includesAny(
      checkoutText,
      CONFLICTING_KEY_TERMS
    )
  ) {
    criticalIssues.push(
      issue({
        id: "conflicting-key-return",
        severity: "critical",
        label:
          "Conflicting key-return instructions detected",
        description:
          "Some content tells guests to leave keys on a table or inside the property. Review every check-out and AI instruction.",
        section: "welcomebook",
      })
    );
  }

  const usesLockbox = propertyUsesLockbox(
    property,
    knowledgeBase
  );

  if (
    usesLockbox &&
    !hasValue(property.lockbox_code)
  ) {
    criticalIssues.push(
      issue({
        id: "lockbox-code",
        severity: "critical",
        label: "Lockbox code is missing",
        description:
          "The property appears to use a lockbox, but no lockbox code is configured.",
        section: "general",
      })
    );
  }

  if (
    usesLockbox &&
    hasValue(
      knowledgeBase.welcome_book
        .checkout_notes
    ) &&
    !includesAny(
      knowledgeBase.welcome_book
        .checkout_notes,
      KEY_RETURN_TERMS
    )
  ) {
    criticalIssues.push(
      issue({
        id: "lockbox-return-missing",
        severity: "critical",
        label:
          "Lockbox return instruction is missing",
        description:
          "The property uses a lockbox, but the check-out instructions do not clearly explain key return.",
        section: "welcomebook",
      })
    );
  }

  const allIssues = [
    ...criticalIssues,
    ...warnings,
  ];

  const passedChecks = Math.max(
    0,
    TOTAL_QUALITY_CHECKS -
      allIssues.length
  );

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (passedChecks /
          TOTAL_QUALITY_CHECKS) *
          100
      )
    )
  );

  const status: PropertyQualityStatus =
    criticalIssues.length > 0
      ? "blocked"
      : warnings.length > 0
        ? "needs_review"
        : "ready";

  return {
    propertyId: property.id,
    propertyIdentifier:
      getPropertyIdentifier(property),
    propertyName:
      clean(property.property_name) ||
      "Unnamed property",
    location:
      getLocation(property) ||
      "Location not set",
    status,
    score,
    passedChecks,
    totalChecks: TOTAL_QUALITY_CHECKS,
    criticalIssues,
    warnings,
    allIssues,
  };
}