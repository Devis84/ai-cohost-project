 import type {
  AiTraining,
  ExtraServices,
  GuestPageContent,
  GuestSupport,
  KnowledgeBase,
  LocalGuide,
  Property,
  WelcomeBook,
} from "../_types/dashboard";

export function createEmptyKnowledgeBase(): KnowledgeBase {
  return {
    guest_page: {
      hero_title: "",
      hero_intro: "",
      hero_image_url: "",
      about_title: "",
      about_intro: "",
      about_description: "",
      about_highlights: "",
    },

    guest_support: {
      whatsapp_enabled: false,
      whatsapp_number: "",
      whatsapp_label: "Host",
      whatsapp_message_template: "",
    },

    welcome_book: {
      description: "",
      amenities: "",
      house_rules: "",
      apartment_instructions: "",
      kitchen: "",
      washing_machine: "",
      ac: "",
      boiler: "",
      trash: "",
      towels_linen: "",
      beach_towels: "",
      parking: "",
      emergency: "",
      checkout_notes: "",
      extra_notes: "",
      restaurants: "",
      transport: "",
      local_guide: "",
    },

    extra_services: {
      enabled: false,
      title: "Extra Services",
      intro: "",
      services: "",
      host_note: "",
    },

    local_guide: {
      neighbourhood_overview: "",
      restaurants: "",
      breakfast_coffee: "",
      bars: "",
      beaches: "",
      things_to_visit: "",
      transport_getting_around: "",
      useful_services: "",
      host_recommendations: "",
    },

    ai_training: {
      faq: "",
      troubleshooting: "",
      guest_style: "",
      complaint_handling: "",
      escalation_rules: "",
      hidden_notes: "",
      additional_notes: "",
    },
  };
}

export function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function splitHighlights(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getPropertyIdentifier(property: Property) {
  return property.slug || property.id;
}

export function mergeKnowledgeBase(property: Property): KnowledgeBase {
  const empty = createEmptyKnowledgeBase();

  const savedGuestPage: Partial<GuestPageContent> =
    property.knowledge_base?.guest_page || {};

  const savedGuestSupport: Partial<GuestSupport> =
    property.knowledge_base?.guest_support || {};

  const savedWelcome: Partial<WelcomeBook> =
    property.knowledge_base?.welcome_book || {};

  const savedExtraServices: Partial<ExtraServices> =
    property.knowledge_base?.extra_services || {};

  const savedLocalGuide: Partial<LocalGuide> =
    property.knowledge_base?.local_guide || {};

  const savedAi: Partial<AiTraining> =
    property.knowledge_base?.ai_training || {};

  const defaultWhatsappMessage = property.property_name
    ? `Hi, I’m staying at ${property.property_name} and I need some help.`
    : "Hi, I’m staying at the property and I need some help.";

  return {
    guest_page: {
      ...empty.guest_page,
      ...savedGuestPage,
      hero_title:
        savedGuestPage.hero_title ||
        safeString(property.property_name),
      hero_intro: savedGuestPage.hero_intro || "",
      hero_image_url:
        savedGuestPage.hero_image_url || "",
      about_title:
        savedGuestPage.about_title || "About this stay",
      about_intro: savedGuestPage.about_intro || "",
      about_description:
        savedGuestPage.about_description ||
        safeString(savedWelcome.description) ||
        safeString(property.description),
      about_highlights:
        savedGuestPage.about_highlights || "",
    },

    guest_support: {
      ...empty.guest_support,
      ...savedGuestSupport,
      whatsapp_enabled: Boolean(
        savedGuestSupport.whatsapp_enabled
      ),
      whatsapp_number:
        savedGuestSupport.whatsapp_number || "",
      whatsapp_label:
        savedGuestSupport.whatsapp_label ||
        empty.guest_support.whatsapp_label,
      whatsapp_message_template:
        savedGuestSupport.whatsapp_message_template ||
        defaultWhatsappMessage,
    },

    welcome_book: {
      ...empty.welcome_book,
      ...savedWelcome,
      description:
        savedWelcome.description ||
        safeString(property.description),
      amenities:
        savedWelcome.amenities ||
        safeString(property.amenities),
      house_rules:
        savedWelcome.house_rules ||
        safeString(property.house_rules),
      parking:
        savedWelcome.parking ||
        safeString(property.parking_info),
      emergency:
        savedWelcome.emergency ||
        safeString(property.emergency_info),
    },

    extra_services: {
      ...empty.extra_services,
      ...savedExtraServices,
      enabled: Boolean(savedExtraServices.enabled),
      title:
        savedExtraServices.title ||
        empty.extra_services.title,
      intro: savedExtraServices.intro || "",
      services: savedExtraServices.services || "",
      host_note: savedExtraServices.host_note || "",
    },

    local_guide: {
      ...empty.local_guide,
      ...savedLocalGuide,
      neighbourhood_overview:
        savedLocalGuide.neighbourhood_overview ||
        safeString(property.local_info),
      restaurants:
        savedLocalGuide.restaurants ||
        safeString(savedWelcome.restaurants),
      transport_getting_around:
        savedLocalGuide.transport_getting_around ||
        safeString(savedWelcome.transport),
      host_recommendations:
        savedLocalGuide.host_recommendations ||
        safeString(savedWelcome.local_guide),
    },

    ai_training: {
      ...empty.ai_training,
      ...savedAi,
      faq: savedAi.faq || safeString(property.ai_knowledge),
    },
  };
}