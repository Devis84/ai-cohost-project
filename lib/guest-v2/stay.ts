 export type GuestV2SectionSlug =
  | "wifi"
  | "house-guide"
  | "food"
  | "transport"
  | "local-guide"
  | "emergency"
  | "extra-services";

export type GuestV2AccessState =
  | "demo"
  | "active"
  | "not_active_yet"
  | "expired"
  | "revoked"
  | "invalid_dates"
  | "not_found"
  | "server_error";

export type GuestV2Section = {
  title: string;
  icon: string;
  slug: GuestV2SectionSlug;
  eyebrow: string;
  intro: string;
  primaryAction: string;
  items: {
    title: string;
    body: string;
    icon: string;
  }[];
};

export type GuestV2Stay = {
  token: string;
  access: {
    allowed: boolean;
    state: GuestV2AccessState;
    title: string;
    message: string;
  };
  guest: {
    name: string;
  };
  property: {
    name: string;
    location: string;
    imageUrl: string;
  };
  host: {
    whatsappNumber: string;
    whatsappUrl: string;
  };
  stay: {
    statusLabel: string;
    checkoutTime: string;
    checkinDate: string;
    checkoutDate: string;
    dayLabel: string;
    progressLabel: string;
    progressPercent: number;
  };
  weather: {
    label: string;
  };
  smartTip: {
    icon: string;
    eyebrow: string;
    title: string;
    body: string;
  };
  today: {
    title: string;
    subtitle: string;
    items: {
      icon: string;
      label: string;
    }[];
  };
  sections: GuestV2Section[];
};

export function buildGuestV2Stay(token: string): GuestV2Stay {
  const propertyName = "Maltese Maisonette";
  const hostWhatsappNumber = "";

  const whatsappMessage = encodeURIComponent(
    `Hi, I need help with my stay at ${propertyName}.`
  );

  const hostWhatsappUrl = hostWhatsappNumber
    ? `https://wa.me/${hostWhatsappNumber}?text=${whatsappMessage}`
    : "#";

  const sections: GuestV2Section[] = [
    {
      title: "Wi-Fi",
      icon: "📶",
      slug: "wifi",
      eyebrow: "Stay connected",
      intro: "Quick access to the internet details for your stay.",
      primaryAction: "Ask AI about Wi-Fi",
      items: [
        {
          title: "Network",
          body: "Wi-Fi network details will appear here once connected to the property data.",
          icon: "📡",
        },
        {
          title: "Password",
          body: "The Wi-Fi password will appear here once connected to the property data.",
          icon: "🔐",
        },
      ],
    },
    {
      title: "House Guide",
      icon: "🏡",
      slug: "house-guide",
      eyebrow: "Feel at home",
      intro: "Essential house information, rules and useful appliance notes.",
      primaryAction: "Ask AI about the house",
      items: [
        {
          title: "House rules",
          body: "Quiet hours, smoking policy, visitors and other house rules will appear here.",
          icon: "📘",
        },
        {
          title: "Appliances",
          body: "Instructions for air conditioning, boiler, washing machine and other appliances will appear here.",
          icon: "🧺",
        },
      ],
    },
    {
      title: "Food",
      icon: "🍽️",
      slug: "food",
      eyebrow: "Eat like a local",
      intro: "Restaurants, cafés, delivery options and local food tips.",
      primaryAction: "Ask AI for food tips",
      items: [
        {
          title: "Recommended restaurants",
          body: "The host's favourite restaurants will appear here.",
          icon: "🍝",
        },
        {
          title: "Delivery",
          body: "Food delivery options and useful notes will appear here.",
          icon: "🛵",
        },
      ],
    },
    {
      title: "Transport",
      icon: "🚕",
      slug: "transport",
      eyebrow: "Move around easily",
      intro: "Taxi, scooter rental, parking and local transport information.",
      primaryAction: "Ask AI for transport help",
      items: [
        {
          title: "Taxi",
          body: "Taxi apps, private drivers and useful transport contacts will appear here.",
          icon: "🚖",
        },
        {
          title: "Parking",
          body: "Parking information and local advice will appear here.",
          icon: "🅿️",
        },
      ],
    },
    {
      title: "Local Guide",
      icon: "🌊",
      slug: "local-guide",
      eyebrow: "Explore nearby",
      intro: "Beaches, markets, attractions and experiences around the property.",
      primaryAction: "Ask AI what to do today",
      items: [
        {
          title: "Things to do",
          body: "Recommended beaches, markets, museums and activities will appear here.",
          icon: "🏖️",
        },
        {
          title: "Today nearby",
          body: "Dynamic suggestions based on weather and day of stay will appear here.",
          icon: "📍",
        },
      ],
    },
    {
      title: "Emergency",
      icon: "🚨",
      slug: "emergency",
      eyebrow: "Important support",
      intro: "Important contacts and urgent support information.",
      primaryAction: "Contact host on WhatsApp",
      items: [
        {
          title: "Host contact",
          body: "The host emergency contact will appear here.",
          icon: "🟢",
        },
        {
          title: "Local emergency numbers",
          body: "Police, ambulance, fire brigade and local emergency numbers will appear here.",
          icon: "☎️",
        },
      ],
    },
    {
      title: "Extra Services",
      icon: "✨",
      slug: "extra-services",
      eyebrow: "Make your stay easier",
      intro: "Optional services available during the stay.",
      primaryAction: "Ask AI about extra services",
      items: [
        {
          title: "Late checkout",
          body: "Late checkout availability and instructions will appear here.",
          icon: "🧳",
        },
        {
          title: "Extra cleaning",
          body: "Extra cleaning and other add-on services will appear here.",
          icon: "🧼",
        },
      ],
    },
  ];

  return {
    token,
    access: {
      allowed: true,
      state: "demo",
      title: "Demo access",
      message: "This is a demo stay dashboard.",
    },
    guest: {
      name: "Guest",
    },
    property: {
      name: propertyName,
      location: "Sliema · Malta",
      imageUrl: "",
    },
    host: {
      whatsappNumber: hostWhatsappNumber,
      whatsappUrl: hostWhatsappUrl,
    },
    stay: {
      statusLabel: "Checkout in 3 days",
      checkoutTime: "10:00",
      checkinDate: "",
      checkoutDate: "",
      dayLabel: "Demo stay",
      progressLabel: "Stay progress",
      progressPercent: 45,
    },
    weather: {
      label: "Sunny · 29°C",
    },
    smartTip: {
      icon: "🌤️",
      eyebrow: "Smart stay tip",
      title: "Perfect day to explore",
      body: "Great weather today. Ask the AI Concierge for nearby beaches, restaurants or sunset spots.",
    },
    today: {
      title: "Enjoy your stay",
      subtitle: "Everything you need is one tap away.",
      items: [
        {
          icon: "✅",
          label: "Guest access active",
        },
        {
          icon: "🌤️",
          label: "Sunny · 29°C",
        },
        {
          icon: "🧳",
          label: "Checkout in 3 days",
        },
      ],
    },
    sections,
  };
}

export function findGuestV2Section(
  stay: GuestV2Stay,
  slug: string
): GuestV2Section | undefined {
  return stay.sections.find((section) => section.slug === slug);
}