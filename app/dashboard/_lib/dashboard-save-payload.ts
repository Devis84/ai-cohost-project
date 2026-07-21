import type { KnowledgeBase, Property } from "../_types/dashboard";
import { createSlug } from "./dashboard-utils";

interface BuildPropertySavePayloadArgs {
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
  whatsappEnabled: boolean;
  telegramEnabled: boolean;
  welcomebookEnabled: boolean;
  selectedSlug?: string;
  selectedProperty?: Property;
}

export interface PropertySavePayload {
  property_name: string;
  slug: string;
  city: string;
  country: string;
  address: string;
  wifi_name: string;
  wifi_password: string;
  checkin_time: string;
  checkout_time: string;
  checkin_instructions: string;
  lockbox_code: string;
  emergency_numbers: string;
  house_rules: string;
  description: string;
  amenities: string;
  parking_info: string;
  local_info: string;
  emergency_info: string;
  ai_knowledge: string;
  knowledge_base: KnowledgeBase;
  ai_enabled: boolean;
  whatsapp_enabled: boolean;
  telegram_enabled: boolean;
  welcomebook_enabled: boolean;
}

export function buildPropertySavePayload(
  args: BuildPropertySavePayloadArgs
): PropertySavePayload {
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
    whatsappEnabled,
    telegramEnabled,
    welcomebookEnabled,
    selectedSlug,
    selectedProperty,
  } = args;

  const slug =
    selectedSlug ||
    selectedProperty?.slug ||
    createSlug(propertyName);

  return {
    property_name: propertyName.trim(),
    slug,

    city,
    country,
    address,

    wifi_name: wifiName,
    wifi_password: wifiPassword,

    checkin_time: checkin,
    checkout_time: checkout,
    checkin_instructions: checkinNotes,

    lockbox_code: lockboxCode,

    emergency_numbers: emergencyNumbers,

    house_rules: knowledgeBase.welcome_book.house_rules,
    description: knowledgeBase.welcome_book.description,
    amenities: knowledgeBase.welcome_book.amenities,
    parking_info: knowledgeBase.welcome_book.parking,
    local_info:
      knowledgeBase.local_guide.neighbourhood_overview,
    emergency_info: knowledgeBase.welcome_book.emergency,
    ai_knowledge: knowledgeBase.ai_training.faq,

    knowledge_base: knowledgeBase,

    ai_enabled: aiEnabled,
    whatsapp_enabled: whatsappEnabled,
    telegram_enabled: telegramEnabled,
    welcomebook_enabled: welcomebookEnabled,
  };
}
