import { supabaseServer } from "@/lib/supabase/supabase-server";

export type ChatPropertyRecord = {
  id: string;
  property_name?: string | null;
  slug?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  wifi_name?: string | null;
  wifi_password?: string | null;
  checkin_time?: string | null;
  checkout_time?: string | null;
  checkin_instructions?: string | null;
  lockbox_code?: string | null;
  emergency_numbers?: string | null;
  house_rules?: string | null;
  description?: string | null;
  amenities?: string | null;
  parking_info?: string | null;
  local_info?: string | null;
  emergency_info?: string | null;
  ai_knowledge?: string | null;
  knowledge_base?: {
    welcome_book?: Record<string, string | null | undefined>;
    ai_training?: Record<string, string | null | undefined>;
  } | null;
};

export async function findChatProperty({
  propertySlug,
  propertyId,
}: {
  propertySlug?: string;
  propertyId?: string;
}) {
  if (propertyId) {
    const { data } = await supabaseServer
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .maybeSingle();

    if (data) {
      return data as ChatPropertyRecord;
    }
  }

  if (propertySlug) {
    const cleanSlug = decodeURIComponent(propertySlug).trim();

    const { data: bySlug } = await supabaseServer
      .from("properties")
      .select("*")
      .eq("slug", cleanSlug)
      .maybeSingle();

    if (bySlug) {
      return bySlug as ChatPropertyRecord;
    }

    const { data: byName } = await supabaseServer
      .from("properties")
      .select("*")
      .eq("property_name", cleanSlug)
      .maybeSingle();

    if (byName) {
      return byName as ChatPropertyRecord;
    }
  }

  return null;
}

export function isGuestPortalChannel(channel: string) {
  return channel === "guest_portal";
}