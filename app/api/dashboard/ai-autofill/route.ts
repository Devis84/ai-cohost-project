export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";

type AutofillRequest = {
  description?: string;
  property?: {
    property_name?: string;
    city?: string;
    country?: string;
    checkin_instructions?: string;
    knowledge_base?: Record<string, unknown>;
  };
};

type AutofillDraft = {
  guest_page: {
    hero_title: string;
    hero_intro: string;
    about_description: string;
    about_highlights: string;
  };
  welcome_book: {
    description: string;
    amenities: string;
    house_rules: string;
    apartment_instructions: string;
    checkout_notes: string;
    parking: string;
    extra_notes: string;
    restaurants: string;
    transport: string;
    local_guide: string;
  };
  local_guide: {
    neighbourhood_overview: string;
    restaurants: string;
    things_to_visit: string;
    transport_getting_around: string;
    host_recommendations: string;
  };
  ai_training: {
    faq: string;
    troubleshooting: string;
    guest_style: string;
    escalation_rules: string;
  };
  extra_services: {
    enabled: boolean;
    title: string;
    intro: string;
    services: string;
    host_note: string;
  };
  property_highlights: string;
  checkin_notes: string;
  parking_notes: string;
  house_rules: string;
};

function emptyDraft(): AutofillDraft {
  return {
    guest_page: {
      hero_title: "",
      hero_intro: "",
      about_description: "",
      about_highlights: "",
    },
    welcome_book: {
      description: "",
      amenities: "",
      house_rules: "",
      apartment_instructions: "",
      checkout_notes: "",
      parking: "",
      extra_notes: "",
      restaurants: "",
      transport: "",
      local_guide: "",
    },
    local_guide: {
      neighbourhood_overview: "",
      restaurants: "",
      things_to_visit: "",
      transport_getting_around: "",
      host_recommendations: "",
    },
    ai_training: {
      faq: "",
      troubleshooting: "",
      guest_style: "",
      escalation_rules: "",
    },
    extra_services: {
      enabled: false,
      title: "Extra Services",
      intro: "",
      services: "",
      host_note: "",
    },
    property_highlights: "",
    checkin_notes: "",
    parking_notes: "",
    house_rules: "",
  };
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toStringList(value: unknown) {
  if (typeof value === "string") {
    return value
      .split(/\n|•|\-|\*/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .slice(0, 8);
  }

  return [];
}

function listToMultiline(value: unknown) {
  return toStringList(value)
    .map((item) => `- ${item}`)
    .join("\n");
}

function looksLikeMention(description: string, words: string[]) {
  const lower = description.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function fallbackDraft(description: string): AutofillDraft {
  const base = emptyDraft();

  const sentences = description
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const first = sentences[0] || "";
  const second = sentences[1] || "";
  const highlights = toStringList(description);

  base.guest_page.hero_title = first.slice(0, 80);
  base.guest_page.hero_intro = [first, second].filter(Boolean).join(" ").slice(0, 220);
  base.guest_page.about_description = sentences.slice(0, 3).join(" ").slice(0, 500);
  base.guest_page.about_highlights = highlights.map((item) => `- ${item}`).join("\n");

  base.welcome_book.description = sentences.slice(0, 3).join(" ");
  base.welcome_book.amenities = listToMultiline(highlights);
  base.welcome_book.house_rules = looksLikeMention(description, ["rule", "no smoking", "quiet", "pet", "party"])
    ? "- Please respect the apartment and neighbors\n- Follow check-in and check-out times\n- Contact the host for any issue"
    : "";
  base.welcome_book.apartment_instructions = looksLikeMention(description, ["check-in", "arrival", "self check", "door", "key", "lockbox"])
    ? sentences
        .filter((item) => /check-?in|arrival|key|lockbox|door/i.test(item))
        .join(" ")
    : "";
  base.welcome_book.parking = looksLikeMention(description, ["parking", "garage", "car"]) 
    ? sentences.filter((item) => /parking|garage|car/i.test(item)).join(" ")
    : "";
  base.welcome_book.extra_notes = sentences.slice(0, 2).join(" ");

  base.local_guide.neighbourhood_overview = sentences.slice(0, 2).join(" ");
  base.local_guide.restaurants = looksLikeMention(description, ["restaurant", "food", "dinner", "lunch"])
    ? "- Add your top nearby restaurants"
    : "";
  base.local_guide.things_to_visit = looksLikeMention(description, ["museum", "beach", "park", "center", "old town"])
    ? "- Add key attractions around the property"
    : "";
  base.local_guide.transport_getting_around = looksLikeMention(description, ["bus", "train", "metro", "transport", "airport"])
    ? "- Add nearest public transport options and airport connection"
    : "";
  base.local_guide.host_recommendations = "- Add your personal local tips for guests";

  base.ai_training.faq = "Q: How do I connect to Wi-Fi?\nA: Share the Wi-Fi details from the dashboard.\n\nQ: How do I check in?\nA: Follow the check-in instructions shared by the host.";
  base.ai_training.troubleshooting = "- If Wi-Fi does not work, ask guest to restart router and confirm network name\n- If access fails, escalate to host immediately";
  base.ai_training.guest_style = "Friendly, concise, and practical. Use short steps and confirm when guest problems are solved.";
  base.ai_training.escalation_rules = "Escalate to host for safety concerns, lock/access failures, payment disputes, or unresolved issues.";

  if (looksLikeMention(description, ["service", "tour", "transfer", "rental", "massage", "chef", "breakfast"])) {
    base.extra_services.enabled = true;
    base.extra_services.title = "Extra Services";
    base.extra_services.intro = "Optional services available during your stay.";
    base.extra_services.services = "- Airport transfer\n- Local tour\n- Late check-out (subject to availability)";
    base.extra_services.host_note = "Review pricing and partner contacts before publishing to guests.";
  }

  base.property_highlights = base.guest_page.about_highlights;
  base.checkin_notes = base.welcome_book.apartment_instructions;
  base.parking_notes = base.welcome_book.parking;
  base.house_rules = base.welcome_book.house_rules;

  return base;
}

function normalizeDraft(raw: unknown): AutofillDraft {
  const source = typeof raw === "object" && raw ? (raw as Record<string, unknown>) : {};

  const guestPage = (source.guest_page || {}) as Record<string, unknown>;
  const welcomeBook = (source.welcome_book || {}) as Record<string, unknown>;
  const localGuide = (source.local_guide || {}) as Record<string, unknown>;
  const aiTraining = (source.ai_training || {}) as Record<string, unknown>;
  const extraServices = (source.extra_services || {}) as Record<string, unknown>;

  return {
    guest_page: {
      hero_title: normalizeText(guestPage.hero_title),
      hero_intro: normalizeText(guestPage.hero_intro),
      about_description: normalizeText(guestPage.about_description),
      about_highlights:
        normalizeText(guestPage.about_highlights) || listToMultiline(guestPage.about_highlights_list),
    },
    welcome_book: {
      description: normalizeText(welcomeBook.description),
      amenities: normalizeText(welcomeBook.amenities),
      house_rules:
        normalizeText(welcomeBook.house_rules) || listToMultiline(welcomeBook.house_rules_list),
      apartment_instructions: normalizeText(welcomeBook.apartment_instructions),
      checkout_notes: normalizeText(welcomeBook.checkout_notes),
      parking: normalizeText(welcomeBook.parking),
      extra_notes: normalizeText(welcomeBook.extra_notes),
      restaurants: normalizeText(welcomeBook.restaurants),
      transport: normalizeText(welcomeBook.transport),
      local_guide: normalizeText(welcomeBook.local_guide),
    },
    local_guide: {
      neighbourhood_overview: normalizeText(localGuide.neighbourhood_overview),
      restaurants: normalizeText(localGuide.restaurants),
      things_to_visit: normalizeText(localGuide.things_to_visit),
      transport_getting_around: normalizeText(localGuide.transport_getting_around),
      host_recommendations: normalizeText(localGuide.host_recommendations),
    },
    ai_training: {
      faq: normalizeText(aiTraining.faq),
      troubleshooting: normalizeText(aiTraining.troubleshooting),
      guest_style: normalizeText(aiTraining.guest_style),
      escalation_rules: normalizeText(aiTraining.escalation_rules),
    },
    extra_services: {
      enabled: extraServices.enabled === true,
      title: normalizeText(extraServices.title) || "Extra Services",
      intro: normalizeText(extraServices.intro),
      services: normalizeText(extraServices.services),
      host_note: normalizeText(extraServices.host_note),
    },
    property_highlights:
      normalizeText(source.property_highlights) ||
      normalizeText(guestPage.about_highlights),
    checkin_notes:
      normalizeText(source.checkin_notes) ||
      normalizeText(welcomeBook.apartment_instructions),
    parking_notes:
      normalizeText(source.parking_notes) ||
      normalizeText(welcomeBook.parking),
    house_rules:
      normalizeText(source.house_rules) ||
      normalizeText(welcomeBook.house_rules),
  };
}

function buildPrompt(description: string, property?: AutofillRequest["property"]) {
  const propertyContext = {
    property_name: normalizeText(property?.property_name),
    city: normalizeText(property?.city),
    country: normalizeText(property?.country),
    checkin_instructions: normalizeText(property?.checkin_instructions),
  };

  return [
    "Create concise draft property setup content for an Airbnb host dashboard.",
    "Return ONLY valid JSON with this exact top-level shape:",
    "{ guest_page, welcome_book, local_guide, ai_training, extra_services, property_highlights, checkin_notes, parking_notes, house_rules }",
    "Keep each text useful and short. If detail is missing, leave empty string.",
    "Only enable extra_services if clearly mentioned.",
    "house_rules should be clear bullet-style lines separated by newline.",
    `Property context: ${JSON.stringify(propertyContext)}`,
    `Host description: ${description}`,
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AutofillRequest;
    const description = normalizeText(body.description);

    if (!description) {
      return NextResponse.json(
        {
          success: false,
          error: "Property description is required",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === "missing-key") {
      const draft = fallbackDraft(description);
      return NextResponse.json({
        success: true,
        source: "fallback",
        draft,
      });
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.2,
      max_tokens: 1100,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You generate structured Airbnb setup drafts for hosts. Return only compact JSON. No markdown.",
        },
        {
          role: "user",
          content: buildPrompt(description, body.property),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || "{}";

    let parsed: unknown = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    const draft = normalizeDraft(parsed);

    return NextResponse.json({
      success: true,
      source: "openai",
      draft,
    });
  } catch (error) {
    console.error("AI AUTOFILL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to generate draft content",
      },
      { status: 500 }
    );
  }
}