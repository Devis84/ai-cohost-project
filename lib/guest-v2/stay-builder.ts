 import { createClient } from "@supabase/supabase-js";
import {
  buildGuestV2Stay,
  type GuestV2AccessState,
  type GuestV2Stay,
} from "@/lib/guest-v2/stay";

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function safeText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  const clean = value.trim();
  return clean || fallback;
}

function getFirstText(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) return "";

  for (const key of keys) {
    const value = safeText(record[key]);
    if (value) return value;
  }

  return "";
}

function formatLocation(property: Record<string, unknown> | null) {
  if (!property) return "Sliema · Malta";

  const city = safeText(property.city);
  const country = safeText(property.country);

  if (city && country) return `${city} · ${country}`;

  return safeText(property.location, "Sliema · Malta");
}

function getPropertyImageUrl(property: Record<string, unknown> | null) {
  return getFirstText(property, [
    "hero_image_url",
    "image_url",
    "cover_image_url",
    "property_image_url",
    "main_image_url",
    "photo_url",
  ]);
}

function normalizeWhatsAppNumber(value: unknown) {
  return safeText(value).replace(/[^\d]/g, "");
}

function buildWhatsappUrl({
  number,
  propertyName,
}: {
  number: string;
  propertyName: string;
}) {
  if (!number) return "#";

  const message = encodeURIComponent(
    `Hi, I need help with my stay at ${propertyName}.`
  );

  return `https://wa.me/${number}?text=${message}`;
}

function parseDate(value: unknown) {
  const text = safeText(value);
  if (!text) return null;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysBetween(from: Date, to: Date) {
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.ceil((to.getTime() - from.getTime()) / oneDay);
}

function buildStayTiming({
  checkinDate,
  checkoutDate,
  fallbackStay,
}: {
  checkinDate: unknown;
  checkoutDate: unknown;
  fallbackStay: GuestV2Stay;
}) {
  const today = startOfToday();
  const checkin = parseDate(checkinDate);
  const checkout = parseDate(checkoutDate);

  if (!checkin || !checkout) {
    return {
      statusLabel: fallbackStay.stay.statusLabel,
      checkinDate: safeText(checkinDate),
      checkoutDate: safeText(checkoutDate),
      dayLabel: fallbackStay.stay.dayLabel,
      progressLabel: fallbackStay.stay.progressLabel,
      progressPercent: fallbackStay.stay.progressPercent,
      todayTitle: fallbackStay.today.title,
      todaySubtitle: fallbackStay.today.subtitle,
      smartTip: fallbackStay.smartTip,
    };
  }

  const totalDays = Math.max(daysBetween(checkin, checkout), 1);
  const elapsedDays = Math.min(Math.max(daysBetween(checkin, today), 0), totalDays);
  const daysToCheckout = daysBetween(today, checkout);
  const progressPercent = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);

  let statusLabel = `Checkout in ${daysToCheckout} days`;
  let dayLabel = `Day ${Math.min(elapsedDays + 1, totalDays)} of ${totalDays}`;
  let todayTitle = "Enjoy your stay";
  let todaySubtitle = "Everything you need is one tap away.";
  let smartTip = {
    icon: "🌤️",
    eyebrow: "Smart stay tip",
    title: "Perfect day to explore",
    body: "Ask the AI Concierge for nearby restaurants, transport, local tips or anything about the property.",
  };

  if (today < checkin) {
    const daysToCheckin = daysBetween(today, checkin);
    statusLabel =
      daysToCheckin === 0 ? "Check-in today" : `Check-in in ${daysToCheckin} days`;
    dayLabel = "Before check-in";
    todayTitle = "Your stay is coming soon";
    todaySubtitle = "This dashboard will guide you during your stay.";
    smartTip = {
      icon: "🧳",
      eyebrow: "Before arrival",
      title: "Get ready for check-in",
      body: "Use this dashboard for house information, local tips and guest support once your stay starts.",
    };
  } else if (daysToCheckout < 0) {
    statusLabel = "Stay ended";
    dayLabel = "Stay completed";
    todayTitle = "Thanks for staying";
    todaySubtitle = "This stay has now ended.";
    smartTip = {
      icon: "❤️",
      eyebrow: "Stay completed",
      title: "Thank you for staying with us",
      body: "We hope you enjoyed your stay. For anything urgent, please contact the host directly.",
    };
  } else if (daysToCheckout === 0) {
    statusLabel = "Checkout today";
    todayTitle = "Checkout is today";
    todaySubtitle = "Check the checkout notes before leaving.";
    smartTip = {
      icon: "🧳",
      eyebrow: "Checkout reminder",
      title: "Checkout is today",
      body: "Need instructions, luggage help or late checkout information? Ask the AI Concierge or contact the host.",
    };
  } else if (daysToCheckout === 1) {
    statusLabel = "Checkout tomorrow";
    todayTitle = "Last full day";
    todaySubtitle = "Enjoy your last day and review checkout details.";
    smartTip = {
      icon: "🌅",
      eyebrow: "Last day tip",
      title: "Checkout is tomorrow",
      body: "This is a good moment to check house rules, checkout notes and anything you may need before leaving.",
    };
  }

  return {
    statusLabel,
    checkinDate: safeText(checkinDate),
    checkoutDate: safeText(checkoutDate),
    dayLabel,
    progressLabel: "Stay progress",
    progressPercent,
    todayTitle,
    todaySubtitle,
    smartTip,
  };
}

function getAccessState({
  status,
  validFrom,
  validUntil,
}: {
  status: unknown;
  validFrom: unknown;
  validUntil: unknown;
}): {
  allowed: boolean;
  state: GuestV2AccessState;
  title: string;
  message: string;
} {
  const cleanStatus = safeText(status, "active");
  const now = new Date();
  const from = new Date(safeText(validFrom));
  const until = new Date(safeText(validUntil));

  if (cleanStatus === "revoked") {
    return {
      allowed: false,
      state: "revoked",
      title: "Access revoked",
      message:
        "This guest access link has been revoked by the host and is no longer available.",
    };
  }

  if (cleanStatus === "expired") {
    return {
      allowed: false,
      state: "expired",
      title: "Stay ended",
      message:
        "This stay has ended and the digital stay dashboard is no longer available.",
    };
  }

  if (Number.isNaN(from.getTime()) || Number.isNaN(until.getTime())) {
    return {
      allowed: false,
      state: "invalid_dates",
      title: "Access unavailable",
      message:
        "The access dates for this stay are not valid. Please contact your host.",
    };
  }

  if (now < from) {
    return {
      allowed: false,
      state: "not_active_yet",
      title: "Not active yet",
      message:
        "This digital stay dashboard is not active yet. It will become available closer to your check-in time.",
    };
  }

  if (now > until) {
    return {
      allowed: false,
      state: "expired",
      title: "Stay ended",
      message:
        "This stay has ended and the digital stay dashboard is no longer available.",
    };
  }

  return {
    allowed: true,
    state: "active",
    title: "Access active",
    message: "Guest access is active.",
  };
}

function enrichSections({
  stay,
  property,
  propertyInfo,
}: {
  stay: GuestV2Stay;
  property: Record<string, unknown> | null;
  propertyInfo: Record<string, unknown> | null;
}) {
  return stay.sections.map((section) => {
    if (section.slug === "wifi") {
      const wifiName = getFirstText(property, [
        "wifi_name",
        "wifi_network",
        "wifi_ssid",
      ]);

      const wifiPassword = getFirstText(property, [
        "wifi_password",
        "wifi_pass",
      ]);

      return {
        ...section,
        items: [
          {
            title: "Network",
            body: wifiName || "Wi-Fi network details are not available yet.",
            icon: "📡",
          },
          {
            title: "Password",
            body: wifiPassword || "Wi-Fi password is not available yet.",
            icon: "🔐",
          },
        ],
      };
    }

    if (section.slug === "house-guide") {
      const houseRules = getFirstText(propertyInfo, ["house_rules", "rules"]);

      const appliances = getFirstText(propertyInfo, [
        "appliances",
        "ac",
        "boiler",
      ]);

      return {
        ...section,
        items: [
          {
            title: "House rules",
            body:
              houseRules ||
              "House rules will appear here once added by the host.",
            icon: "📘",
          },
          {
            title: "Appliances",
            body:
              appliances ||
              "Appliance instructions will appear here once added by the host.",
            icon: "🧺",
          },
        ],
      };
    }

    if (section.slug === "food") {
      const restaurants = getFirstText(propertyInfo, ["restaurants", "food"]);
      const delivery = getFirstText(propertyInfo, ["delivery", "food_delivery"]);

      return {
        ...section,
        items: [
          {
            title: "Recommended restaurants",
            body:
              restaurants ||
              "Restaurant recommendations will appear here once added by the host.",
            icon: "🍝",
          },
          {
            title: "Delivery",
            body:
              delivery ||
              "Delivery options will appear here once added by the host.",
            icon: "🛵",
          },
        ],
      };
    }

    if (section.slug === "transport") {
      const transport = getFirstText(propertyInfo, ["transport", "taxi"]);
      const parking = getFirstText(propertyInfo, ["parking"]);

      return {
        ...section,
        items: [
          {
            title: "Taxi & transport",
            body:
              transport ||
              "Transport information will appear here once added by the host.",
            icon: "🚖",
          },
          {
            title: "Parking",
            body:
              parking ||
              "Parking information will appear here once added by the host.",
            icon: "🅿️",
          },
        ],
      };
    }

    if (section.slug === "local-guide") {
      const localGuide = getFirstText(propertyInfo, [
        "local_guide",
        "things_to_do",
      ]);

      const tips = getFirstText(propertyInfo, ["tips", "extra_notes"]);

      return {
        ...section,
        items: [
          {
            title: "Things to do",
            body:
              localGuide ||
              "Local recommendations will appear here once added by the host.",
            icon: "🏖️",
          },
          {
            title: "Today nearby",
            body:
              tips || "Dynamic suggestions based on the stay will appear here.",
            icon: "📍",
          },
        ],
      };
    }

    if (section.slug === "emergency") {
      const hostContact = getFirstText(property, [
        "host_phone",
        "phone",
        "contact_phone",
      ]);

      const emergency = getFirstText(propertyInfo, [
        "emergency",
        "emergency_numbers",
      ]);

      return {
        ...section,
        items: [
          {
            title: "Host contact",
            body:
              hostContact || "Host contact details will appear here once added.",
            icon: "🟢",
          },
          {
            title: "Local emergency numbers",
            body:
              emergency || "Local emergency numbers will appear here once added.",
            icon: "☎️",
          },
        ],
      };
    }

    if (section.slug === "extra-services") {
      const services = getFirstText(propertyInfo, [
        "extra_services",
        "services",
      ]);

      const checkoutNotes = getFirstText(propertyInfo, [
        "checkout_notes",
        "checkout",
      ]);

      return {
        ...section,
        items: [
          {
            title: "Extra services",
            body:
              services ||
              "Extra services will appear here once added by the host.",
            icon: "✨",
          },
          {
            title: "Checkout notes",
            body:
              checkoutNotes ||
              "Checkout instructions will appear here once added by the host.",
            icon: "🧳",
          },
        ],
      };
    }

    return section;
  });
}

export async function buildGuestV2StayFromToken(
  token: string
): Promise<GuestV2Stay> {
  const fallbackStay = buildGuestV2Stay(token);
  const supabase = getSupabaseAdminClient();

  if (!supabase) return fallbackStay;

  const { data: accessToken, error: tokenError } = await supabase
    .from("guest_access_tokens")
    .select("*")
    .eq("token", token)
    .limit(1)
    .single();

  if (tokenError || !accessToken) {
    return {
      ...fallbackStay,
      access: {
        allowed: false,
        state: "not_found",
        title: "Access not found",
        message:
          "This guest access link was not found. Please check the link or contact your host.",
      },
    };
  }

  const accessRecord = accessToken as Record<string, unknown>;
  const propertyId = accessRecord.property_id;

  const { data: property } = propertyId
    ? await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .limit(1)
        .single()
    : { data: null };

  const { data: propertyInfo } = propertyId
    ? await supabase
        .from("property_info")
        .select("*")
        .eq("property_id", propertyId)
        .limit(1)
        .single()
    : { data: null };

  const propertyRecord = property as Record<string, unknown> | null;
  const propertyInfoRecord = propertyInfo as Record<string, unknown> | null;

  const propertyName =
    safeText(propertyRecord?.property_name) ||
    safeText(propertyRecord?.name) ||
    safeText(accessRecord.property_name) ||
    fallbackStay.property.name;

  const guestName =
    safeText(accessRecord.guest_name) ||
    safeText(accessRecord.guest_full_name) ||
    fallbackStay.guest.name;

  const whatsappNumber =
    normalizeWhatsAppNumber(propertyRecord?.host_whatsapp) ||
    normalizeWhatsAppNumber(propertyRecord?.whatsapp) ||
    normalizeWhatsAppNumber(propertyRecord?.phone) ||
    "";

  const checkoutTime =
    safeText(propertyRecord?.checkout_time) ||
    safeText(propertyRecord?.check_out_time) ||
    fallbackStay.stay.checkoutTime;

  const timing = buildStayTiming({
    checkinDate: accessRecord.checkin_date,
    checkoutDate: accessRecord.checkout_date,
    fallbackStay,
  });

  const access = getAccessState({
    status: accessRecord.status,
    validFrom: accessRecord.valid_from,
    validUntil: accessRecord.valid_until,
  });

  const sections = enrichSections({
    stay: fallbackStay,
    property: propertyRecord,
    propertyInfo: propertyInfoRecord,
  });

  return {
    ...fallbackStay,
    access,
    guest: {
      ...fallbackStay.guest,
      name: guestName,
    },
    property: {
      ...fallbackStay.property,
      name: propertyName,
      location: formatLocation(propertyRecord),
      imageUrl: getPropertyImageUrl(propertyRecord),
    },
    host: {
      whatsappNumber,
      whatsappUrl: buildWhatsappUrl({
        number: whatsappNumber,
        propertyName,
      }),
    },
    stay: {
      ...fallbackStay.stay,
      statusLabel: timing.statusLabel,
      checkoutTime,
      checkinDate: timing.checkinDate,
      checkoutDate: timing.checkoutDate,
      dayLabel: timing.dayLabel,
      progressLabel: timing.progressLabel,
      progressPercent: timing.progressPercent,
    },
    smartTip: timing.smartTip,
    today: {
      title: timing.todayTitle,
      subtitle: timing.todaySubtitle,
      items: [
        {
          icon: access.allowed ? "✅" : "🔒",
          label: access.allowed ? timing.dayLabel : access.title,
        },
        {
          icon: "🌤️",
          label: fallbackStay.weather.label,
        },
        {
          icon: "🧳",
          label: timing.statusLabel,
        },
      ],
    },
    sections,
  };
}