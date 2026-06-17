 export type GuestPageContent = {
  hero_title: string;
  hero_intro: string;
  hero_image_url: string;
  about_title: string;
  about_intro: string;
  about_description: string;
  about_highlights: string;
};

export type WelcomeBook = {
  description: string;
  amenities: string;
  house_rules: string;
  apartment_instructions: string;
  kitchen: string;
  washing_machine: string;
  ac: string;
  boiler: string;
  trash: string;
  towels_linen: string;
  beach_towels: string;
  parking: string;
  emergency: string;
  checkout_notes: string;
  extra_notes: string;
  restaurants: string;
  transport: string;
  local_guide: string;
};

export type ExtraServices = {
  enabled: boolean;
  title: string;
  intro: string;
  services: string;
  host_note: string;
};

export type LocalGuide = {
  neighbourhood_overview: string;
  restaurants: string;
  breakfast_coffee: string;
  bars: string;
  beaches: string;
  things_to_visit: string;
  transport_getting_around: string;
  useful_services: string;
  host_recommendations: string;
};

export type AiTraining = {
  faq: string;
  troubleshooting: string;
  guest_style: string;
  complaint_handling: string;
  escalation_rules: string;
  hidden_notes: string;
  additional_notes: string;
};

export type KnowledgeBase = {
  guest_page: GuestPageContent;
  welcome_book: WelcomeBook;
  extra_services: ExtraServices;
  local_guide: LocalGuide;
  ai_training: AiTraining;
};

export type StoredKnowledgeBase = {
  guest_page?: Partial<GuestPageContent>;
  welcome_book?: Partial<WelcomeBook>;
  extra_services?: Partial<ExtraServices>;
  local_guide?: Partial<LocalGuide>;
  ai_training?: Partial<AiTraining>;
};

export type Property = {
  id: string;
  property_name: string;
  slug?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  wifi_name?: string | null;
  wifi_password?: string | null;
  checkin_time?: string | null;
  checkout_time?: string | null;
  house_rules?: string | null;
  checkin_instructions?: string | null;
  description?: string | null;
  amenities?: string | null;
  ai_knowledge?: string | null;
  local_info?: string | null;
  emergency_info?: string | null;
  parking_info?: string | null;
  emergency_numbers?: string | null;
  lockbox_code?: string | null;
  ai_enabled?: boolean | null;
  whatsapp_enabled?: boolean | null;
  telegram_enabled?: boolean | null;
  welcomebook_enabled?: boolean | null;
  knowledge_base?: StoredKnowledgeBase | null;
};