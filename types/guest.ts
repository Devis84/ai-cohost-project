export type WelcomeBook = {
  description?: string
  amenities?: string
  house_rules?: string
  parking?: string
  trash?: string
  ac?: string
  boiler?: string
  restaurants?: string
  transport?: string
  local_guide?: string
  emergency?: string
  checkout_notes?: string
  extra_notes?: string
}

export type AiTraining = {
  faq?: string
  troubleshooting?: string
  guest_style?: string
  hidden_notes?: string
  additional_notes?: string
}

export type KnowledgeBase = {
  welcome_book?: WelcomeBook
  ai_training?: AiTraining
}

export type Property = {
  id: string
  property_name?: string | null
  name?: string | null
  slug?: string | null
  city?: string | null
  country?: string | null
  address?: string | null
  wifi_name?: string | null
  wifi_password?: string | null
  checkin_time?: string | null
  checkout_time?: string | null
  checkin_instructions?: string | null
  lockbox_code?: string | null
  emergency_numbers?: string | null
  house_rules?: string | null
  description?: string | null
  amenities?: string | null
  parking_info?: string | null
  local_info?: string | null
  emergency_info?: string | null
  image_url?: string | null
  host_phone?: string | null
  ai_enabled?: boolean | null
  welcomebook_enabled?: boolean | null
  knowledge_base?: KnowledgeBase | null
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

/**
 * Returns trimmed string or empty string for null/undefined/whitespace-only values.
 * Used across guest components to safely display property data.
 */
export function safeText(value?: string | null): string {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

/**
 * Resolves the display name for a property, falling back through
 * property_name -> name -> default.
 */
export function getPropertyName(property?: Property | null): string {
  if (!property) {
    return 'Your Stay'
  }

  return safeText(property.property_name) || safeText(property.name) || 'Your Stay'
}

/**
 * Safely extracts the welcome_book from a property's knowledge_base.
 */
export function getWelcomeBook(property?: Property | null): WelcomeBook {
  return property?.knowledge_base?.welcome_book ?? {}
}
