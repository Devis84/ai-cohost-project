 export type DashboardAccess = {
  email?: string | null;
  role: string;
  isAdmin: boolean;
  isPartner: boolean;
  isViewer?: boolean;
  isActive?: boolean;
  canCreateProperty: boolean;
  canDeleteProperty: boolean;
  reason?: string;
};

export type GuestPageContent = {
  hero_title: string;
  hero_intro: string;
  hero_image_url: string;
  about_title: string;
  about_intro: string;
  about_description: string;
  about_highlights: string;
};

export type GuestSupport = {
  whatsapp_enabled: boolean;
  whatsapp_number: string;
  whatsapp_label: string;
  whatsapp_message_template: string;
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

export type ItalianCompliance = {
  enabled: boolean;
  property_registration?: {
    cin?: string;
    regional_code?: string;
    local_commune?: string;
    scia_status?: "pending" | "submitted" | "approved" | "none";
    scia_submission_date?: string;
    notes?: string;
  };
  guest_identity?: {
    collection_status?: "pending" | "collected" | "verified" | "none";
    alloggiati_web_status?: "pending" | "submitted" | "confirmed" | "none";
    submission_deadline?: string;
    last_submitted_at?: string;
    notes?: string;
  };
  tourist_tax?: {
    municipality?: string;
    rate_notes?: string;
    guest_exemption_notes?: string;
    collection_status?: "pending" | "collected" | "none";
    reporting_status?: "pending" | "reported" | "none";
    notes?: string;
  };
  istat_regional?: {
    portal_name?: string;
    reporting_status?: "pending" | "reported" | "none";
    monthly_status?: string;
    notes?: string;
  };
  safety_checklist?: {
    smoke_detector?: boolean;
    carbon_monoxide_detector?: boolean;
    gas_detector?: boolean;
    fire_extinguisher?: boolean;
    emergency_numbers_posted?: boolean;
    safety_notes?: string;
  };
  document_archive?: {
    cin_certificate_available?: boolean;
    property_documents_available?: boolean;
    guest_documents_available?: boolean;
    tax_receipts_available?: boolean;
    notes?: string;
  };
  compliance_status?: {
    completed_items?: number;
    total_items?: number;
    compliance_score?: number;
    next_deadline?: string;
    last_updated?: string;
  };
};

export type KnowledgeBase = {
  guest_page: GuestPageContent;
  guest_support: GuestSupport;
  welcome_book: WelcomeBook;
  extra_services: ExtraServices;
  local_guide: LocalGuide;
  ai_training: AiTraining;
};

export type StoredKnowledgeBase = {
  guest_page?: Partial<GuestPageContent>;
  guest_support?: Partial<GuestSupport>;
  welcome_book?: Partial<WelcomeBook>;
  extra_services?: Partial<ExtraServices>;
  local_guide?: Partial<LocalGuide>;
  ai_training?: Partial<AiTraining>;
  italian_compliance?: Partial<ItalianCompliance>;
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