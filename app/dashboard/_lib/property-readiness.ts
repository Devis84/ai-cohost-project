import type { KnowledgeBase, Property, StoredKnowledgeBase } from "../_types/dashboard";

export type ReadinessLevel = "Ready" | "Warning" | "Missing";

export type ReadinessCategoryKey =
  | "property_setup"
  | "guest_experience"
  | "ai_knowledge"
  | "operations"
  | "safety"
  | "compliance";

export type ReadinessCategory = {
  key: ReadinessCategoryKey;
  label: string;
  percentage: number;
  status: ReadinessLevel;
  ready: number;
  warning: number;
  missing: number;
};

export type ReadinessAction = {
  id: string;
  label: string;
  category: ReadinessCategoryKey;
  priority: number;
  status: "missing" | "warning";
};

export type PropertyReadiness = {
  overallScore: number;
  overallStatus: ReadinessLevel;
  categories: ReadinessCategory[];
  nextActions: ReadinessAction[];
  signals: {
    propertySelected: boolean;
    propertyBasicsComplete: boolean;
    wifiConfigured: boolean;
    checkinConfigured: boolean;
    houseRulesConfigured: boolean;
    localGuideConfigured: boolean;
    draftContentAvailable: boolean;
    guestPagePreviewReady: boolean;
    aiConciergeReady: boolean;
    operationsConnected: boolean;
    italianProperty: boolean;
    italianComplianceEnabled: boolean;
  };
};

type ReadinessCheck = {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  actionLabel?: string;
  actionPriority?: number;
};

export type ReadinessOperationsSnapshot = {
  bookingsConfigured: boolean;
  hasUpcomingOrActiveStays: boolean;
  cleaningConfigured: boolean;
  hasPropertyAnalytics: boolean;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function bool(value: unknown) {
  return value === true;
}

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toStatus(percentage: number): ReadinessLevel {
  if (percentage >= 80) {
    return "Ready";
  }

  if (percentage >= 40) {
    return "Warning";
  }

  return "Missing";
}

function check(label: string, value: unknown, params?: { id?: string; actionLabel?: string; actionPriority?: number }): ReadinessCheck {
  const hasValue = typeof value === "boolean" ? value : Boolean(text(value));

  return {
    id: params?.id || label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    label,
    score: hasValue ? 1 : 0,
    maxScore: 1,
    actionLabel: params?.actionLabel,
    actionPriority: params?.actionPriority,
  };
}

function toCategory(
  key: ReadinessCategoryKey,
  label: string,
  checks: ReadinessCheck[],
  actions: ReadinessAction[]
): ReadinessCategory {
  let totalScore = 0;
  let totalMax = 0;
  let ready = 0;
  let warning = 0;
  let missing = 0;

  checks.forEach((current) => {
    totalScore += current.score;
    totalMax += current.maxScore;

    if (current.score >= current.maxScore) {
      ready += 1;
      return;
    }

    if (current.score > 0) {
      warning += 1;

      if (current.actionLabel) {
        actions.push({
          id: current.id,
          label: current.actionLabel,
          category: key,
          priority: current.actionPriority || 60,
          status: "warning",
        });
      }

      return;
    }

    missing += 1;

    if (current.actionLabel) {
      actions.push({
        id: current.id,
        label: current.actionLabel,
        category: key,
        priority: current.actionPriority || 80,
        status: "missing",
      });
    }
  });

  const percentage = totalMax > 0 ? clampPercentage((totalScore / totalMax) * 100) : 0;

  return {
    key,
    label,
    percentage,
    status: toStatus(percentage),
    ready,
    warning,
    missing,
  };
}

function isItalianProperty(property: Property | undefined) {
  const country = text(property?.country).toLowerCase();
  return country.includes("italy") || country.includes("italia");
}

function getItalianCompliance(knowledgeBase: StoredKnowledgeBase | null | undefined) {
  return knowledgeBase?.italian_compliance;
}

export function buildPropertyReadiness({
  property,
  propertyName,
  city,
  country,
  address,
  wifiName,
  wifiPassword,
  checkin,
  checkout,
  checkinNotes,
  emergencyNumbers,
  lockboxCode,
  knowledgeBase,
  aiEnabled,
  welcomebookEnabled,
  operations,
}: {
  property?: Property;
  propertyName: string;
  city: string;
  country: string;
  address: string;
  wifiName: string;
  wifiPassword: string;
  checkin: string;
  checkout: string;
  checkinNotes: string;
  emergencyNumbers: string;
  lockboxCode: string;
  knowledgeBase: KnowledgeBase;
  aiEnabled: boolean;
  welcomebookEnabled: boolean;
  operations: ReadinessOperationsSnapshot;
}): PropertyReadiness {
  const actions: ReadinessAction[] = [];
  const hasPropertyName = Boolean(text(propertyName));
  const hasPropertyBasics =
    Boolean(text(city)) &&
    Boolean(text(country)) &&
    Boolean(text(address));
  const hasWifi =
    Boolean(text(wifiName)) &&
    Boolean(text(wifiPassword));
  const hasCheckinNotes = Boolean(text(checkinNotes));
  const hasHouseRules = Boolean(text(knowledgeBase.welcome_book.house_rules));
  const hasLocalGuide =
    Boolean(text(knowledgeBase.local_guide.neighbourhood_overview)) ||
    Boolean(text(knowledgeBase.local_guide.restaurants));
  const hasDraftContent =
    Boolean(text(knowledgeBase.guest_page.hero_title)) ||
    Boolean(text(knowledgeBase.guest_page.about_description)) ||
    Boolean(text(knowledgeBase.welcome_book.description)) ||
    Boolean(text(knowledgeBase.ai_training.faq));
  const hasGuestPagePreview =
    Boolean(text(knowledgeBase.guest_page.hero_title)) &&
    Boolean(
      text(knowledgeBase.guest_page.about_description) ||
        text(knowledgeBase.welcome_book.description)
    );
  const hasAiConciergeReadiness =
    aiEnabled &&
    (Boolean(text(knowledgeBase.ai_training.faq)) ||
      Boolean(text(knowledgeBase.ai_training.troubleshooting)) ||
      Boolean(text(knowledgeBase.ai_training.escalation_rules)));

  const propertySetup = toCategory(
    "property_setup",
    "Property Setup",
    [
      check("Property name", propertyName, {
        actionLabel: "Set property name",
        actionPriority: 100,
      }),
      check("City", city, {
        actionLabel: "Set property city",
        actionPriority: 70,
      }),
      check("Country", country, {
        actionLabel: "Set property country",
        actionPriority: 70,
      }),
      check("Address", address, {
        actionLabel: "Add property address",
        actionPriority: 70,
      }),
      check("WiFi name", wifiName, {
        id: "missing_wifi_name",
        actionLabel: "Missing WiFi",
        actionPriority: 100,
      }),
      check("WiFi password", wifiPassword, {
        id: "missing_wifi_password",
        actionLabel: "Missing WiFi password",
        actionPriority: 95,
      }),
      check("Check-in instructions", checkinNotes, {
        id: "missing_checkin_instructions",
        actionLabel: "Missing Check-in instructions",
        actionPriority: 100,
      }),
      check("Check-in time", checkin, {
        actionLabel: "Set check-in time",
        actionPriority: 80,
      }),
      check("Check-out time", checkout, {
        actionLabel: "Set check-out time",
        actionPriority: 80,
      }),
    ],
    actions
  );

  const guestExperience = toCategory(
    "guest_experience",
    "Guest Experience",
    [
      check("Guest page hero title", knowledgeBase.guest_page.hero_title, {
        id: "guest_page_incomplete",
        actionLabel: "Guest Page incomplete",
        actionPriority: 95,
      }),
      check(
        "Guest page about description",
        knowledgeBase.guest_page.about_description || knowledgeBase.welcome_book.description,
        {
          id: "guest_page_about_incomplete",
          actionLabel: "Complete Guest Page description",
          actionPriority: 85,
        }
      ),
      check("Welcome book enabled", welcomebookEnabled, {
        actionLabel: "Enable Welcome Book",
        actionPriority: 75,
      }),
      check("House rules", knowledgeBase.welcome_book.house_rules, {
        actionLabel: "Add house rules",
        actionPriority: 80,
      }),
      check("Local guide content", knowledgeBase.local_guide.neighbourhood_overview || knowledgeBase.local_guide.restaurants, {
        actionLabel: "Complete Local Guide",
        actionPriority: 78,
      }),
      check("Extra services title", knowledgeBase.extra_services.title, {
        actionLabel: "Review Extra Services",
        actionPriority: 50,
      }),
    ],
    actions
  );

  const aiKnowledge = toCategory(
    "ai_knowledge",
    "AI Knowledge",
    [
      check("AI Concierge enabled", aiEnabled, {
        actionLabel: "Enable AI Concierge",
        actionPriority: 80,
      }),
      check("AI FAQ", knowledgeBase.ai_training.faq, {
        id: "missing_ai_faq",
        actionLabel: "AI FAQ incomplete",
        actionPriority: 95,
      }),
      check("AI troubleshooting", knowledgeBase.ai_training.troubleshooting, {
        actionLabel: "Complete AI troubleshooting",
        actionPriority: 70,
      }),
      check("AI escalation rules", knowledgeBase.ai_training.escalation_rules, {
        actionLabel: "Define AI escalation rules",
        actionPriority: 80,
      }),
      check("Guest communication style", knowledgeBase.ai_training.guest_style, {
        actionLabel: "Set AI guest communication style",
        actionPriority: 60,
      }),
    ],
    actions
  );

  const operationsCategory = toCategory(
    "operations",
    "Operations",
    [
      check("Bookings connected", operations.bookingsConfigured, {
        actionLabel: "Connect booking management data",
        actionPriority: 70,
      }),
      check("Active/upcoming stay detected", operations.hasUpcomingOrActiveStays, {
        actionLabel: "Review upcoming and active stays",
        actionPriority: 45,
      }),
      check("Cleaning configured", operations.cleaningConfigured, {
        id: "cleaning_not_configured",
        actionLabel: "Cleaning not configured",
        actionPriority: 95,
      }),
      check("Analytics available", operations.hasPropertyAnalytics, {
        actionLabel: "Open analytics and verify tracking",
        actionPriority: 55,
      }),
    ],
    actions
  );

  const safety = toCategory(
    "safety",
    "Safety",
    [
      check("Emergency numbers", emergencyNumbers || knowledgeBase.welcome_book.emergency, {
        actionLabel: "Add emergency numbers",
        actionPriority: 90,
      }),
      check("Check-in instructions", checkinNotes, {
        actionLabel: "Complete arrival instructions",
        actionPriority: 85,
      }),
      check("House rules", knowledgeBase.welcome_book.house_rules, {
        actionLabel: "Add safety-oriented house rules",
        actionPriority: 70,
      }),
      check("Lockbox/access code available", lockboxCode, {
        actionLabel: "Set private access code details",
        actionPriority: 60,
      }),
    ],
    actions
  );

  const isItalian = isItalianProperty(property);
  const italianCompliance = getItalianCompliance(property?.knowledge_base);
  const complianceChecks: ReadinessCheck[] = [
    check("Country configured", country, {
      actionLabel: "Set property country for compliance",
      actionPriority: 50,
    }),
  ];

  if (!isItalian) {
    complianceChecks.push(
      check("Italian compliance required", true, {
        actionLabel: "Compliance not required for non-Italian property",
        actionPriority: 10,
      })
    );
  } else {
    complianceChecks.push(
      check("Italian compliance module enabled", bool(italianCompliance?.enabled), {
        id: "italian_compliance_inactive",
        actionLabel: "Italian Compliance inactive",
        actionPriority: 90,
      }),
      check(
        "Italian compliance score",
        Number(italianCompliance?.compliance_status?.compliance_score || 0) >= 60,
        {
          actionLabel: "Complete Italian compliance checklist",
          actionPriority: 70,
        }
      )
    );
  }

  const compliance = toCategory(
    "compliance",
    "Compliance",
    complianceChecks,
    actions
  );

  const categories = [
    propertySetup,
    guestExperience,
    aiKnowledge,
    operationsCategory,
    safety,
    compliance,
  ];

  const overallScore = clampPercentage(
    categories.reduce((sum, category) => sum + category.percentage, 0) / categories.length
  );

  const uniqueActions = actions
    .sort((a, b) => b.priority - a.priority)
    .filter((current, index, array) => {
      const first = array.findIndex((candidate) => candidate.label === current.label);
      return first === index;
    })
    .slice(0, 6);

  return {
    overallScore,
    overallStatus: toStatus(overallScore),
    categories,
    nextActions: uniqueActions,
    signals: {
      propertySelected: hasPropertyName,
      propertyBasicsComplete: hasPropertyBasics,
      wifiConfigured: hasWifi,
      checkinConfigured: hasCheckinNotes,
      houseRulesConfigured: hasHouseRules,
      localGuideConfigured: hasLocalGuide,
      draftContentAvailable: hasDraftContent,
      guestPagePreviewReady: hasGuestPagePreview,
      aiConciergeReady: hasAiConciergeReadiness,
      operationsConnected:
        operations.bookingsConfigured ||
        operations.hasUpcomingOrActiveStays,
      italianProperty: isItalian,
      italianComplianceEnabled: bool(italianCompliance?.enabled),
    },
  };
}