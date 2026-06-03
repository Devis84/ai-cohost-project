 import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase/supabase-server";

type PropertyPayload = {
  property_name?: string;
  name?: string;
  title?: string;
  slug?: string;
  city?: string;
  country?: string;
  address?: string;
  wifi_name?: string;
  wifi_password?: string;
  checkin_time?: string;
  checkout_time?: string;
  house_rules?: string;
  checkin_instructions?: string;
  description?: string;
  amenities?: string;
  ai_knowledge?: string;
  local_info?: string;
  emergency_info?: string;
  parking_info?: string;
  emergency_numbers?: string;
  lockbox_code?: string;
  knowledge_base?: unknown;
};

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function cleanPayload(body: PropertyPayload) {
  const propertyName =
    body.property_name ||
    body.name ||
    body.title ||
    "";

  const cleanPropertyName =
    propertyName.trim();

  const slug =
    body.slug?.trim() ||
    createSlug(cleanPropertyName);

  const knowledgeBase =
    typeof body.knowledge_base === "object" &&
    body.knowledge_base !== null
      ? body.knowledge_base
      : {
          welcome_book: {
            description: getString(body.description),
            amenities: getString(body.amenities),
            house_rules: getString(body.house_rules),
            parking: getString(body.parking_info),
            restaurants: "",
            transport: "",
            local_guide: getString(body.local_info),
            emergency: getString(body.emergency_info),
            checkout_notes: "",
            extra_notes: "",
          },
          ai_training: {
            faq: getString(body.ai_knowledge),
            troubleshooting: "",
            guest_style: "",
            hidden_notes: "",
            additional_notes: "",
          },
        };

  return {
    property_name: cleanPropertyName,
    slug,
    city: getString(body.city),
    country: getString(body.country),
    address: getString(body.address),
    wifi_name: getString(body.wifi_name),
    wifi_password: getString(body.wifi_password),
    checkin_time: getString(body.checkin_time),
    checkout_time: getString(body.checkout_time),
    house_rules: getString(body.house_rules),
    checkin_instructions: getString(
      body.checkin_instructions
    ),
    description: getString(body.description),
    amenities: getString(body.amenities),
    ai_knowledge: getString(body.ai_knowledge),
    local_info: getString(body.local_info),
    emergency_info: getString(body.emergency_info),
    parking_info: getString(body.parking_info),
    emergency_numbers: getString(
      body.emergency_numbers
    ),
    lockbox_code: getString(body.lockbox_code),
    knowledge_base: knowledgeBase,
  };
}

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("properties")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      properties: data || [],
    });
  } catch (error) {
    console.error("GET /api/properties error:", error);

    return NextResponse.json(
      {
        success: false,
        properties: [],
        error: "Unable to load properties",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as PropertyPayload;

    const payload = cleanPayload(body);

    if (!payload.property_name) {
      return NextResponse.json(
        {
          success: false,
          error: "property_name is required",
        },
        {
          status: 400,
        }
      );
    }

    const { data: existingBySlug } =
      await supabaseServer
        .from("properties")
        .select("id")
        .eq("slug", payload.slug)
        .maybeSingle();

    if (existingBySlug?.id) {
      const { data, error } = await supabaseServer
        .from("properties")
        .update(payload)
        .eq("id", existingBySlug.id)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        mode: "updated",
        property: data,
      });
    }

    const { data, error } = await supabaseServer
      .from("properties")
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      mode: "created",
      property: data,
    });
  } catch (error) {
    console.error("POST /api/properties error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to save property",
      },
      {
        status: 500,
      }
    );
  }
}