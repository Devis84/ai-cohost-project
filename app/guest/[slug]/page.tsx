 "use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useParams, useSearchParams } from "next/navigation";

import { GuestEventTracker } from "../_components/GuestEventTracker";

type GuestPageContent = {
  hero_title?: string;
  hero_intro?: string;
  hero_image_url?: string;
  about_title?: string;
  about_intro?: string;
  about_description?: string;
  about_highlights?: string;
};

type GuestSupport = {
  whatsapp_enabled?: boolean;
  whatsapp_number?: string;
  whatsapp_label?: string;
  whatsapp_message_template?: string;
};

type WelcomeBook = {
  description?: string;
  amenities?: string;
  house_rules?: string;
  apartment_instructions?: string;
  kitchen?: string;
  washing_machine?: string;
  towels_linen?: string;
  beach_towels?: string;
  parking?: string;
  trash?: string;
  ac?: string;
  boiler?: string;
  restaurants?: string;
  transport?: string;
  local_guide?: string;
  emergency?: string;
  checkout_notes?: string;
  extra_notes?: string;
};

type ExtraServices = {
  enabled?: boolean;
  title?: string;
  intro?: string;
  services?: string;
  host_note?: string;
};

type AiTraining = {
  faq?: string;
  troubleshooting?: string;
  guest_style?: string;
  hidden_notes?: string;
  additional_notes?: string;
};

type KnowledgeBase = {
  guest_page?: GuestPageContent;
  guest_support?: GuestSupport;
  welcome_book?: WelcomeBook;
  extra_services?: ExtraServices;
  ai_training?: AiTraining;
};

type Property = {
  id: string;
  property_name?: string | null;
  name?: string | null;
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
  image_url?: string | null;
  host_phone?: string | null;
  ai_enabled?: boolean | null;
  welcomebook_enabled?: boolean | null;
  knowledge_base?: KnowledgeBase | null;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type GuestAccessStatus = {
  checked: boolean;
  loading: boolean;
  verified: boolean;
  blocked: boolean;
  state: string;
  reason: string;
  token?: string;
};

type GuestAccessSettingsResponse = {
  success: boolean;
  settings?: {
    enabled?: boolean;
    require_token_for_guest_page?: boolean;
  };
};

type GuestAccessValidateResponse = {
  success: boolean;
  allowed: boolean;
  state: string;
  reason?: string;
  error?: string;
};

type DetailItem = {
  id: string;
  icon: string;
  title: string;
  content: ReactNode;
  defaultOpen?: boolean;
};

type ActiveView =
  | "home"
  | "essential"
  | "apartment"
  | "local"
  | "extras"
  | "ai"
  | "help";

function safeText(value?: string | null) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : "";
}

function getPropertyName(property?: Property | null) {
  if (!property) {
    return "Your Stay";
  }

  return (
    safeText(property.property_name) ||
    safeText(property.name) ||
    "Your Stay"
  );
}

function getGuestPage(property?: Property | null): GuestPageContent {
  return property?.knowledge_base?.guest_page || {};
}

function getGuestSupport(property?: Property | null): GuestSupport {
  return property?.knowledge_base?.guest_support || {};
}

function getWelcomeBook(property?: Property | null): WelcomeBook {
  return property?.knowledge_base?.welcome_book || {};
}

function getExtraServices(property?: Property | null): ExtraServices {
  return property?.knowledge_base?.extra_services || {};
}

function getPhoneHref(value?: string | null) {
  const phone = safeText(value);

  if (!phone) {
    return "";
  }

  const cleanPhone = phone.replace(/[^\d+]/g, "");

  return cleanPhone ? `tel:${cleanPhone}` : "";
}

function normalizeWhatsAppNumber(value?: string | null) {
  return safeText(value).replace(/[^\d]/g, "");
}

function getWhatsAppHref({
  number,
  message,
}: {
  number?: string | null;
  message?: string | null;
}) {
  const cleanNumber = normalizeWhatsAppNumber(number);

  if (!cleanNumber) {
    return "";
  }

  const cleanMessage = safeText(message);
  const encodedMessage = encodeURIComponent(cleanMessage);

  return encodedMessage
    ? `https://wa.me/${cleanNumber}?text=${encodedMessage}`
    : `https://wa.me/${cleanNumber}`;
}

function getMapsHref(property?: Property | null) {
  const address = safeText(property?.address);
  const city = safeText(property?.city);
  const country = safeText(property?.country);

  const query = [address, city, country]
    .filter(Boolean)
    .join(", ");

  if (!query) {
    return "";
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;
}

function getHeroImageUrl(
  property?: Property | null,
  slug?: string
) {
  const guestPage = getGuestPage(property);

  const configuredHeroImage =
    safeText(guestPage.hero_image_url) ||
    safeText(property?.image_url);

  if (configuredHeroImage) {
    return configuredHeroImage;
  }

  const cleanSlug = safeText(slug).toLowerCase();
  const propertyName = getPropertyName(property).toLowerCase();

  if (
    cleanSlug.includes("maltese-maisonette") ||
    propertyName.includes("maltese maisonette")
  ) {
    return "/guest-images/maltese-maisonette-hero-bedroom.jpg";
  }

  return "";
}

function getHeroTitle(property?: Property | null) {
  const guestPage = getGuestPage(property);
  const configuredTitle = safeText(guestPage.hero_title);

  if (configuredTitle) {
    return configuredTitle;
  }

  return `Welcome to ${getPropertyName(property)}`;
}

function getHeroDescription(
  property?: Property | null,
  welcomeBook?: WelcomeBook
) {
  const guestPage = getGuestPage(property);
  const configuredIntro = safeText(guestPage.hero_intro);

  if (configuredIntro) {
    return configuredIntro;
  }

  const propertyName = getPropertyName(property).toLowerCase();
  const city = safeText(property?.city).toLowerCase();

  if (
    propertyName.includes("maltese maisonette") ||
    city === "sliema"
  ) {
    return "A cozy Maltese maisonette in central Sliema, designed for a simple, comfortable and authentic stay by the sea.";
  }

  const rawDescription =
    safeText(welcomeBook?.description) ||
    safeText(property?.description);

  if (!rawDescription) {
    return "A comfortable private stay with everything you need in one place.";
  }

  const punctuationIndex = rawDescription.search(/[.!?]/);

  if (punctuationIndex > 40 && punctuationIndex < 180) {
    return rawDescription.slice(0, punctuationIndex + 1);
  }

  if (rawDescription.length > 180) {
    return `${rawDescription.slice(0, 177).trim()}...`;
  }

  return rawDescription;
}

function splitLines(value?: string | null) {
  return safeText(value)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAboutThisStayCopy(
  property?: Property | null,
  welcomeBook?: WelcomeBook
) {
  const guestPage = getGuestPage(property);

  const configuredHighlights = splitLines(
    guestPage.about_highlights
  );

  const propertyName = getPropertyName(property).toLowerCase();
  const city = safeText(property?.city).toLowerCase();

  const fallbackForMalteseMaisonette =
    propertyName.includes("maltese maisonette") ||
    city === "sliema";

  const fallbackIntro = fallbackForMalteseMaisonette
    ? "This private one-bedroom maisonette gives you the feeling of a traditional Maltese home, with the comfort and independence of having the entire place to yourself."
    : "A private stay designed to make your visit simple, comfortable and easy to manage.";

  const fallbackDescription = fallbackForMalteseMaisonette
    ? "Inside, you’ll find a queen-size bedroom with A/C, a living area with sofa, a fully equipped kitchen, a bathroom with shower and washing machine, high-speed WiFi, a desk for work or study, and a small outdoor space. The apartment is set on a quiet Maltese street in central Sliema, close to the promenade, cafés, shops, public transport, Balluta Bay and St Julian’s nightlife."
    : safeText(welcomeBook?.description) ||
      safeText(property?.description) ||
      "This private stay includes the essential comforts you need for a smooth visit, with practical information, local tips and guest support available from this page.";

  const fallbackHighlights = fallbackForMalteseMaisonette
    ? [
        "Private one-bedroom maisonette",
        "Central Sliema location",
        "High-speed WiFi and desk",
        "Kitchen and washing machine",
      ]
    : [
        "Private guest space",
        "Useful stay information",
        "AI Concierge support",
        "Local tips and essentials",
      ];

  return {
    title: safeText(guestPage.about_title) || "About this stay",
    intro: safeText(guestPage.about_intro) || fallbackIntro,
    body:
      safeText(guestPage.about_description) ||
      fallbackDescription,
    highlights:
      configuredHighlights.length > 0
        ? configuredHighlights
        : fallbackHighlights,
  };
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#f4f1eb] flex items-center justify-center p-6">
      <div className="bg-white rounded-[36px] p-8 shadow-xl border border-black/5 text-center">
        <div className="text-5xl mb-4">🏡</div>

        <div className="text-2xl font-black mb-2">
          Loading your stay guide
        </div>

        <div className="text-gray-500">
          Please wait a moment.
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({
  title,
  message,
  icon = "⚠️",
}: {
  title: string;
  message: string;
  icon?: string;
}) {
  return (
    <div className="min-h-screen bg-[#f4f1eb] flex items-center justify-center p-6">
      <div className="bg-white rounded-[36px] p-8 shadow-xl border border-black/5 text-center max-w-lg">
        <div className="text-5xl mb-4">{icon}</div>

        <div className="text-2xl font-black mb-2">
          {title}
        </div>

        <div className="text-gray-500 leading-relaxed">
          {message}
        </div>
      </div>
    </div>
  );
}

function getGuestAccessBlockedCopy(state: string) {
  if (state === "missing_token") {
    return {
      icon: "🔑",
      title: "Personal stay link required",
      message:
        "This guest page requires a valid personal stay access link. Please open the link provided by the host.",
    };
  }

  if (state === "not_active_yet") {
    return {
      icon: "⏳",
      title: "Access not active yet",
      message:
        "This guest access is not active yet. Please check your check-in details or contact the host.",
    };
  }

  if (state === "expired") {
    return {
      icon: "🔒",
      title: "Access expired",
      message:
        "This guest access has expired because the stay has ended.",
    };
  }

  if (state === "revoked") {
    return {
      icon: "🚫",
      title: "Access revoked",
      message:
        "This guest access is no longer available. Please contact the host if you need assistance.",
    };
  }

  return {
    icon: "❌",
    title: "Invalid access link",
    message:
      "This guest access link could not be verified.",
  };
}

function InfoPill({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <div className="bg-white/15 border border-white/20 rounded-full px-4 py-3 text-sm md:text-base backdrop-blur-md shadow-lg">
      <span className="mr-2">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function HomeHubCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-[30px] p-5 md:p-6 border shadow-xl hover:scale-[1.015] transition bg-white text-black border-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
    >
      <div className="text-4xl mb-5">{icon}</div>

      <div className="font-black text-xl mb-2">
        {title}
      </div>

      <div className="text-sm leading-relaxed text-gray-500 mb-4">
        {description}
      </div>

      <div className="inline-flex items-center gap-2 text-sm font-black">
        <span>Open section</span>
        <span>→</span>
      </div>
    </button>
  );
}

function WhatsAppContactCard({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  if (!href) {
    return null;
  }

  return (
    <section className="bg-emerald-600 text-white rounded-[36px] p-6 md:p-8 shadow-xl border border-emerald-700/20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="uppercase tracking-[0.3em] text-xs text-white/60 mb-3">
            DIRECT SUPPORT
          </div>

          <h2 className="text-2xl md:text-4xl font-black mb-2">
            Need help from {label}?
          </h2>

          <p className="text-white/80 leading-relaxed max-w-2xl">
            Contact the host, villa team or property manager directly on
            WhatsApp for property-related support during your stay.
          </p>
        </div>

        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl bg-white px-5 py-4 text-center font-black text-emerald-700 shadow-lg hover:opacity-90 transition"
        >
          Message on WhatsApp
        </a>
      </div>
    </section>
  );
}

function PromptButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-left hover:bg-white/15 transition text-sm md:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      {children}
    </button>
  );
}

function DetailAccordion({
  items,
}: {
  items: DetailItem[];
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {items.map((item) => (
        <details
          key={item.id}
          open={item.defaultOpen}
          className="group bg-white rounded-[28px] border border-black/5 shadow-xl overflow-hidden"
        >
          <summary className="cursor-pointer list-none p-5 md:p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl">{item.icon}</div>

              <div className="font-black text-lg md:text-xl">
                {item.title}
              </div>
            </div>

            <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center text-xl font-black group-open:rotate-45 transition shrink-0">
              +
            </div>
          </summary>

          <div className="px-5 md:px-6 pb-6 text-gray-600 leading-relaxed whitespace-pre-line">
            {item.content}
          </div>
        </details>
      ))}
    </div>
  );
}

function ChatPanel({
  chatRef,
  messages,
  chatLoading,
  chatInput,
  setChatInput,
  sendMessage,
}: {
  chatRef: React.RefObject<HTMLDivElement | null>;
  messages: ChatMessage[];
  chatLoading: boolean;
  chatInput: string;
  setChatInput: (value: string) => void;
  sendMessage: (messageOverride?: string) => void;
}) {
  return (
    <div className="relative bg-white/5 border border-white/10 rounded-[32px] overflow-hidden">
      <div
        ref={chatRef}
        className="h-[360px] md:h-[430px] overflow-y-auto p-4 md:p-6 space-y-4"
      >
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-white/40 text-center px-4">
            Start by asking a question about your stay.
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[88%] md:max-w-[85%] rounded-3xl px-5 py-4 ${
              message.role === "user"
                ? "bg-white text-black ml-auto"
                : "bg-zinc-800 border border-white/10 text-white mr-auto"
            }`}
          >
            <div className="text-xs opacity-50 mb-2 uppercase tracking-wide">
              {message.role === "user"
                ? "You"
                : "AI Concierge"}
            </div>

            <div className="leading-relaxed whitespace-pre-line">
              {message.content}
            </div>
          </div>
        ))}

        {chatLoading && (
          <div className="bg-zinc-800 border border-white/10 text-white mr-auto max-w-[85%] rounded-3xl px-5 py-4">
            AI Concierge is typing...
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-3 md:p-4 flex flex-col sm:flex-row gap-3">
        <input
          value={chatInput}
          onChange={(event) =>
            setChatInput(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              sendMessage();
            }
          }}
          placeholder="Ask about your stay..."
          className="flex-1 bg-white text-black rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-white/40"
        />

        <button
          onClick={() => sendMessage()}
          disabled={chatLoading || !chatInput.trim()}
          className="bg-white text-black rounded-2xl px-6 py-4 font-bold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}

function ViewHeader({
  icon,
  title,
  description,
  onBack,
}: {
  icon: string;
  title: string;
  description: string;
  onBack: () => void;
}) {
  return (
    <div className="bg-white rounded-[36px] p-6 md:p-8 shadow-xl border border-black/5">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-2xl bg-[#f4f1eb] px-4 py-3 text-sm font-black hover:bg-zinc-200 transition"
      >
        <span>←</span>
        <span>Back to guide</span>
      </button>

      <div className="text-5xl mb-5">{icon}</div>

      <h1 className="text-3xl md:text-5xl font-black mb-3 leading-tight">
        {title}
      </h1>

      <p className="text-gray-500 leading-relaxed max-w-3xl">
        {description}
      </p>
    </div>
  );
}

function AskAiCta({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <section className="bg-black text-white rounded-[36px] p-6 md:p-8 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <h2 className="text-2xl md:text-4xl font-black mb-2">
            Still unsure?
          </h2>

          <p className="text-white/60 leading-relaxed max-w-2xl">
            Ask the AI Concierge for instant stay-related help in your language.
          </p>
        </div>

        <button
          type="button"
          onClick={onClick}
          className="bg-white text-black rounded-2xl px-5 py-3 font-black hover:opacity-90 transition w-full md:w-auto"
        >
          Ask AI
        </button>
      </div>
    </section>
  );
}

export default function GuestPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const slug = String(params?.slug || "");
  const guestAccessToken = safeText(
    searchParams.get("guest_access_token")
  );

  const [property, setProperty] =
    useState<Property | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [activeView, setActiveView] =
    useState<ActiveView>("home");

  const [chatInput, setChatInput] =
    useState("");

  const [chatLoading, setChatLoading] =
    useState(false);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [guestAccessStatus, setGuestAccessStatus] =
    useState<GuestAccessStatus>({
      checked: false,
      loading: true,
      verified: false,
      blocked: false,
      state: "checking",
      reason: "",
    });

  const chatRef = useRef<HTMLDivElement | null>(null);

  const welcomeBook = useMemo(() => {
    return getWelcomeBook(property);
  }, [property]);

  const guestSupport = useMemo(() => {
    return getGuestSupport(property);
  }, [property]);

  const extraServices = useMemo(() => {
    return getExtraServices(property);
  }, [property]);

  const locationText = useMemo(() => {
    const city = safeText(property?.city);
    const country = safeText(property?.country);

    if (city && country) {
      return `${city}, ${country}`;
    }

    return city || country || "Location";
  }, [property]);

  const heroTitle = useMemo(() => {
    return getHeroTitle(property);
  }, [property]);

  const heroImageUrl = useMemo(() => {
    return getHeroImageUrl(property, slug);
  }, [property, slug]);

  const heroDescription = useMemo(() => {
    return getHeroDescription(property, welcomeBook);
  }, [property, welcomeBook]);

  const aboutThisStay = useMemo(() => {
    return getAboutThisStayCopy(property, welcomeBook);
  }, [property, welcomeBook]);

  const hostPhoneHref = useMemo(() => {
    return getPhoneHref(property?.host_phone);
  }, [property]);

  const mapsHref = useMemo(() => {
    return getMapsHref(property);
  }, [property]);

  const whatsappLabel =
    safeText(guestSupport.whatsapp_label) || "the host";

  const whatsappDefaultMessage = `Hi, I’m staying at ${getPropertyName(
    property
  )} and I need some help.`;

  const whatsappMessage =
    safeText(guestSupport.whatsapp_message_template) ||
    whatsappDefaultMessage;

  const whatsappHref = getWhatsAppHref({
    number: guestSupport.whatsapp_number,
    message: whatsappMessage,
  });

  const showWhatsAppContact = Boolean(
    guestSupport.whatsapp_enabled && whatsappHref
  );

  const houseRules =
    safeText(welcomeBook.house_rules) ||
    safeText(property?.house_rules);

  const parking =
    safeText(welcomeBook.parking) ||
    safeText(property?.parking_info);

  const amenities =
    safeText(welcomeBook.amenities) ||
    safeText(property?.amenities);

  const localGuide =
    safeText(welcomeBook.local_guide) ||
    safeText(property?.local_info);

  const emergency =
    safeText(welcomeBook.emergency) ||
    safeText(property?.emergency_info) ||
    safeText(property?.emergency_numbers);

  const restaurants = safeText(welcomeBook.restaurants);
  const transport = safeText(welcomeBook.transport);
  const checkoutNotes = safeText(welcomeBook.checkout_notes);
  const extraNotes = safeText(welcomeBook.extra_notes);
  const trash = safeText(welcomeBook.trash);
  const ac = safeText(welcomeBook.ac);
  const boiler = safeText(welcomeBook.boiler);
  const apartmentInstructions =
    safeText(welcomeBook.apartment_instructions);
  const kitchen = safeText(welcomeBook.kitchen);
  const washingMachine =
    safeText(welcomeBook.washing_machine);
  const towelsLinen =
    safeText(welcomeBook.towels_linen);
  const beachTowels =
    safeText(welcomeBook.beach_towels);

  const extraServicesTitle =
    safeText(extraServices.title) || "Extra Services";

  const extraServicesIntro =
    safeText(extraServices.intro);

  const extraServicesHostNote =
    safeText(extraServices.host_note);

  const extraServiceItems = splitLines(
    safeText(extraServices.services)
  );

  useEffect(() => {
    loadProperty();
    setActiveView("home");
  }, [slug]);

  useEffect(() => {
    validateGuestPageAccess();
  }, [slug, guestAccessToken]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [activeView]);

  useEffect(() => {
    if (!chatRef.current) {
      return;
    }

    chatRef.current.scrollTop =
      chatRef.current.scrollHeight;
  }, [messages, chatLoading]);

  function openView(view: ActiveView) {
    setActiveView(view);
  }

  async function validateGuestPageAccess() {
    if (!slug) {
      setGuestAccessStatus({
        checked: true,
        loading: false,
        verified: false,
        blocked: false,
        state: "no_slug",
        reason: "",
      });

      return;
    }

    try {
      setGuestAccessStatus((current) => ({
        ...current,
        loading: true,
        state: "checking",
      }));

      const settingsResponse = await fetch(
        `/api/guest-access/settings?property_slug=${encodeURIComponent(slug)}`,
        {
          cache: "no-store",
        }
      );

      const settingsData =
        (await settingsResponse.json()) as GuestAccessSettingsResponse;

      const moduleEnabled =
        settingsData.success &&
        settingsData.settings?.enabled === true;

      const requireTokenForGuestPage =
        settingsData.success &&
        settingsData.settings?.require_token_for_guest_page === true;

      if (!moduleEnabled || !requireTokenForGuestPage) {
        setGuestAccessStatus({
          checked: true,
          loading: false,
          verified: false,
          blocked: false,
          state: "not_required",
          reason: "Guest page access token is not required",
          token: guestAccessToken || undefined,
        });

        return;
      }

      if (!guestAccessToken) {
        setGuestAccessStatus({
          checked: true,
          loading: false,
          verified: false,
          blocked: true,
          state: "missing_token",
          reason: "Guest access token is required",
        });

        return;
      }

      const validateResponse = await fetch("/api/guest-access/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          token: guestAccessToken,
          property_slug: slug,
          mark_used: true,
        }),
      });

      const validateData =
        (await validateResponse.json()) as GuestAccessValidateResponse;

      if (!validateData.success || !validateData.allowed) {
        setGuestAccessStatus({
          checked: true,
          loading: false,
          verified: false,
          blocked: true,
          state: validateData.state || "invalid",
          reason:
            validateData.reason ||
            validateData.error ||
            "Guest access token is not valid",
          token: guestAccessToken,
        });

        return;
      }

      setGuestAccessStatus({
        checked: true,
        loading: false,
        verified: true,
        blocked: false,
        state: "active",
        reason: "Guest access token is active",
        token: guestAccessToken,
      });
    } catch (error) {
      console.error("VALIDATE GUEST PAGE ACCESS ERROR:", error);

      setGuestAccessStatus({
        checked: true,
        loading: false,
        verified: false,
        blocked: false,
        state: "validation_failed_open",
        reason:
          "Guest access validation failed, but page remains available because enforcement is fail-open.",
        token: guestAccessToken || undefined,
      });
    }
  }

  async function loadProperty() {
    if (!slug) {
      return;
    }

    try {
      setLoading(true);
      setLoadError("");

      const response = await fetch(
        `/api/properties/${encodeURIComponent(slug)}`
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Unable to load property"
        );
      }

      setProperty(data.property);
    } catch (error) {
      console.error("LOAD GUEST PROPERTY ERROR:", error);
      setLoadError("Unable to load this guest page.");
    } finally {
      setLoading(false);
    }
  }

  async function copyWifi() {
    const wifiName = safeText(property?.wifi_name);
    const wifiPassword = safeText(property?.wifi_password);

    const value = `Network: ${
      wifiName || "Not available"
    } | Password: ${wifiPassword || "Not available"}`;

    try {
      await navigator.clipboard.writeText(value);
      alert("WiFi copied");
    } catch (error) {
      console.error("COPY WIFI ERROR:", error);
      alert("Unable to copy WiFi");
    }
  }

  async function sendMessage(messageOverride?: string) {
    const message = (messageOverride || chatInput).trim();

    if (!message || !property) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          propertySlug: slug,
          propertyId: property.id,
          conversationId: `guest_${slug}`,
          channel: "guest_portal",
          guestAccessToken: guestAccessToken || undefined,
        }),
      });

      const data = await response.json();

      const reply =
        data.reply ||
        "Sorry, I could not answer right now. Please contact the host if this is urgent.";

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: reply,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("CHAT ERROR:", error);

      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            "Sorry, I could not answer right now. Please contact the host if this is urgent.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  const essentialItems: DetailItem[] = [
    {
      id: "arrival",
      icon: "🔑",
      title: "Check-in, checkout and arrival",
      defaultOpen: true,
      content: (
        <div className="space-y-3">
          <p>
            <strong>Check-in:</strong>{" "}
            {property?.checkin_time || "Not available"}
          </p>

          <p>
            <strong>Check-out:</strong>{" "}
            {property?.checkout_time || "Not available"}
          </p>

          {property?.address && (
            <p>
              <strong>Address:</strong>{" "}
              {property.address}
            </p>
          )}

          {property?.checkin_instructions && (
            <p>{property.checkin_instructions}</p>
          )}

          <p className="text-sm text-gray-500 pt-2">
            Private access codes are shared only through the host’s private
            message, not on this public guest page.
          </p>

          {mapsHref && (
            <a
              href={mapsHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-2xl bg-black px-5 py-3 font-semibold text-white"
            >
              Open in Maps
            </a>
          )}
        </div>
      ),
    },
    {
      id: "wifi",
      icon: "📶",
      title: "WiFi",
      content: (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-3xl bg-[#f4f1eb] p-4 border border-black/5">
              <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">
                Network
              </div>

              <div className="font-black text-xl break-words">
                {property?.wifi_name || "Not available"}
              </div>
            </div>

            <div className="rounded-3xl bg-black text-white p-4 border border-black">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
                Password
              </div>

              <div className="font-black text-xl break-words">
                {property?.wifi_password || "Not available"}
              </div>
            </div>
          </div>

          <button
            onClick={copyWifi}
            className="rounded-2xl bg-black px-5 py-3 font-bold text-white"
          >
            Copy WiFi
          </button>
        </div>
      ),
    },
    {
      id: "house-rules",
      icon: "📋",
      title: "House rules",
      content:
        houseRules ||
        "House rules have not been added yet. Please respect the apartment, neighbours and quiet hours.",
    },
    {
      id: "checkout",
      icon: "🚪",
      title: "Checkout notes",
      content:
        checkoutNotes ||
        "Before leaving, please make sure the door is locked and follow the checkout instructions shared by the host.",
    },
    {
      id: "security-note",
      icon: "🔐",
      title: "Access and security note",
      content:
        "For security reasons, private lockbox codes, door codes and access codes are not displayed on this public guest page. Please check the private message sent by the host.",
    },
  ];

  const apartmentItems: DetailItem[] = [
    {
      id: "about",
      icon: "🏡",
      title: aboutThisStay.title,
      defaultOpen: true,
      content: (
        <div className="space-y-4">
          <p className="font-semibold text-gray-900">
            {aboutThisStay.intro}
          </p>

          <p>{aboutThisStay.body}</p>

          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            {aboutThisStay.highlights.map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-[#f4f1eb] px-4 py-3 font-bold text-gray-900"
              >
                ✓ {item}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "amenities",
      icon: "🧺",
      title: "Amenities",
      content:
        amenities ||
        "Amenities information will be added here soon.",
    },
    {
      id: "apartment-instructions",
      icon: "🏠",
      title: "Apartment instructions",
      content:
        apartmentInstructions ||
        "Apartment instructions will be added here soon.",
    },
    {
      id: "kitchen",
      icon: "🍳",
      title: "Kitchen",
      content:
        kitchen ||
        "Kitchen instructions will be added here soon.",
    },
    {
      id: "washing-machine",
      icon: "🧼",
      title: "Washing machine",
      content:
        washingMachine ||
        "Washing machine instructions will be added here soon.",
    },
    {
      id: "towels-linen",
      icon: "🛏️",
      title: "Towels and linen",
      content:
        towelsLinen ||
        "Towels and linen information will be added here soon.",
    },
    {
      id: "beach-towels",
      icon: "🏖️",
      title: "Beach towels",
      content:
        beachTowels ||
        "Beach towel information will be added here soon.",
    },
    {
      id: "ac",
      icon: "❄️",
      title: "Air conditioning",
      content:
        ac ||
        "Air conditioning instructions will be added here soon.",
    },
    {
      id: "boiler",
      icon: "🚿",
      title: "Hot water / boiler",
      content:
        boiler ||
        "Hot water and boiler information will be added here soon.",
    },
    {
      id: "trash",
      icon: "♻️",
      title: "Trash and recycling",
      content:
        trash ||
        "Trash and recycling information will be added here soon.",
    },
    {
      id: "extra-notes",
      icon: "✨",
      title: "Extra notes",
      content:
        extraNotes ||
        "No extra notes have been added yet.",
    },
  ];

  const localItems: DetailItem[] = [
    {
      id: "parking",
      icon: "🅿️",
      title: "Parking",
      defaultOpen: Boolean(parking),
      content:
        parking ||
        "Parking information has not been added yet. Please contact the host if you need exact guidance.",
    },
    {
      id: "restaurants",
      icon: "🍽️",
      title: "Restaurants and bars",
      content:
        restaurants ||
        "Restaurant recommendations will be added here soon.",
    },
    {
      id: "transport",
      icon: "🚌",
      title: "Transport",
      content:
        transport ||
        "Transport information will be added here soon.",
    },
    {
      id: "local-guide",
      icon: "📍",
      title: "Local guide",
      content:
        localGuide ||
        "Local recommendations will be added here soon.",
    },
  ];

  const extraItems: DetailItem[] = [
    {
      id: "available-extra-services",
      icon: "🛎️",
      title: extraServicesTitle,
      defaultOpen: true,
      content: (
        <div className="space-y-4">
          <p>
            {extraServicesIntro ||
              "Optional stay upgrades and extra services may be available on request."}
          </p>

          {extraServiceItems.length > 0 ? (
            <div className="space-y-3">
              {extraServiceItems.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-[#f4f1eb] p-4 font-semibold text-gray-900"
                >
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              Extra services will be added here soon. You can ask the AI
              Concierge or contact the host for availability.
            </p>
          )}
        </div>
      ),
    },
    {
      id: "host-note",
      icon: "📝",
      title: "Host note",
      content:
        extraServicesHostNote ||
        "Please confirm availability, timing and price with the host before booking any extra service.",
    },
    {
      id: "request-extra-service",
      icon: "💬",
      title: "Request information",
      content: (
        <div className="space-y-4">
          <p>
            Ask the AI Concierge or contact the host to confirm availability,
            price and booking details.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openView("ai")}
              className="rounded-2xl bg-black px-5 py-3 font-semibold text-white"
            >
              Ask AI
            </button>

            {showWhatsAppContact && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white"
              >
                Message on WhatsApp
              </a>
            )}

            {hostPhoneHref && (
              <a
                href={hostPhoneHref}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-3 font-semibold text-black"
              >
                Contact Host
              </a>
            )}
          </div>
        </div>
      ),
    },
  ];

  const helpItems: DetailItem[] = [
    {
      id: "ai-help",
      icon: "🤖",
      title: "AI Concierge",
      defaultOpen: true,
      content:
        "Use the AI Concierge for stay-related questions about WiFi, check-in, checkout, parking, appliances, restaurants, transport and local tips. It replies in the guest’s language.",
    },
    {
      id: "emergency",
      icon: "🚨",
      title: "Emergency information",
      defaultOpen: Boolean(emergency),
      content:
        emergency ||
        "For emergencies, contact local emergency services immediately. For property-related issues, contact the host as well.",
    },
    {
      id: "contact-host-whatsapp",
      icon: "💬",
      title: showWhatsAppContact
        ? `Contact ${whatsappLabel} on WhatsApp`
        : "Contact host",
      defaultOpen: showWhatsAppContact,
      content: (
        <div className="space-y-4">
          <p>
            For urgent property-related matters, contact the host, villa team
            or property manager directly when available.
          </p>

          <div className="flex flex-wrap gap-3">
            {showWhatsAppContact && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white"
              >
                Message on WhatsApp
              </a>
            )}

            {hostPhoneHref && (
              <a
                href={hostPhoneHref}
                className="inline-flex rounded-2xl bg-black px-5 py-3 font-semibold text-white"
              >
                Call Host
              </a>
            )}
          </div>

          {!showWhatsAppContact && !hostPhoneHref && (
            <p className="text-gray-500">
              Host contact details are not currently displayed on this page.
              Please use the contact details shared in your booking platform.
            </p>
          )}
        </div>
      ),
    },
    {
      id: "access-security",
      icon: "🔐",
      title: "Access and security note",
      content:
        "For security reasons, private lockbox codes, door codes and access codes are not displayed on this public guest page. Please check the private message sent by the host.",
    },
  ];

  if (loading || guestAccessStatus.loading) {
    return <LoadingScreen />;
  }

  if (loadError || !property) {
    return (
      <ErrorScreen
        title="Guest page unavailable"
        message={
          loadError || "We could not find this property."
        }
      />
    );
  }

  if (guestAccessStatus.blocked) {
    const blockedCopy = getGuestAccessBlockedCopy(
      guestAccessStatus.state
    );

    return (
      <ErrorScreen
        icon={blockedCopy.icon}
        title={blockedCopy.title}
        message={blockedCopy.message}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1eb] text-gray-950 pb-28 md:pb-0">
      <GuestEventTracker
        propertySlug={slug}
        eventType="guest_page_opened"
        eventSource="guest_page"
        eventLabel="Guest page opened"
        eventMetadata={{
          property_name: getPropertyName(property),
          page: "guest_page",
          layout: "guest_hub_detail_views",
          guest_access_state: guestAccessStatus.state,
          guest_access_verified: guestAccessStatus.verified,
        }}
      />

      {guestAccessStatus.verified && (
        <div className="px-4 md:px-8 pt-4">
          <div className="max-w-6xl mx-auto rounded-[28px] border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-sm">
            ✅ Verified stay access active for this guest link.
          </div>
        </div>
      )}

      {activeView === "home" && (
        <header className="relative overflow-hidden px-4 md:px-8 pt-5 md:pt-8">
          <div className="max-w-6xl mx-auto">
            <div className="relative overflow-hidden rounded-[40px] md:rounded-[48px] bg-black text-white shadow-2xl min-h-[390px] md:min-h-[470px]">
              {heroImageUrl && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-100"
                  style={{
                    backgroundImage: `url(${heroImageUrl})`,
                  }}
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/10" />

              <div className="relative p-6 md:p-10 lg:p-12 min-h-[390px] md:min-h-[470px] flex flex-col justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-2 text-xs md:text-sm text-white/90 mb-5 backdrop-blur-md shadow-lg">
                    <span>✨</span>
                    <span>Your digital stay guide</span>
                  </div>

                  <div className="uppercase tracking-[0.32em] text-[10px] md:text-[11px] text-white/60 mb-4">
                    AI CO-HOST EXPERIENCE
                  </div>

                  <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-5 leading-[0.95] max-w-3xl drop-shadow-2xl">
                    {heroTitle}
                  </h1>

                  <p className="text-white/90 text-base md:text-xl max-w-2xl leading-relaxed drop-shadow-xl">
                    {heroDescription}
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => openView("ai")}
                      className="bg-white text-black rounded-2xl px-5 py-4 font-black shadow-xl hover:scale-[1.015] transition"
                    >
                      Ask AI Concierge
                    </button>

                    <button
                      type="button"
                      onClick={() => openView("essential")}
                      className="bg-white/15 border border-white/20 text-white rounded-2xl px-5 py-4 font-bold backdrop-blur-md hover:bg-white/20 transition"
                    >
                      Open Stay Guide
                    </button>

                    {showWhatsAppContact && (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-500 text-white rounded-2xl px-5 py-4 font-black shadow-xl hover:bg-emerald-600 transition"
                      >
                        WhatsApp {whatsappLabel}
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <InfoPill icon="📍" label={locationText} />

                  {property.checkin_time && (
                    <InfoPill
                      icon="🔑"
                      label={`Check-in: ${property.checkin_time}`}
                    />
                  )}

                  {property.checkout_time && (
                    <InfoPill
                      icon="🚪"
                      label={`Check-out: ${property.checkout_time}`}
                    />
                  )}

                  <InfoPill
                    icon="🤖"
                    label="AI help available"
                  />

                  {showWhatsAppContact && (
                    <InfoPill
                      icon="💬"
                      label={`WhatsApp ${whatsappLabel}`}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-7">
        {activeView === "home" && (
          <>
            <section className="relative overflow-hidden bg-black text-white rounded-[40px] p-6 md:p-8 shadow-2xl">
              <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />

              <div className="relative grid lg:grid-cols-[1.2fr_0.8fr] gap-6 items-center">
                <div>
                  <div className="uppercase tracking-[0.3em] text-xs text-white/40 mb-4">
                    AI CONCIERGE
                  </div>

                  <h2 className="text-3xl md:text-5xl font-black mb-3 leading-tight">
                    Need anything? Ask AI first.
                  </h2>

                  <p className="text-white/65 text-base md:text-lg max-w-2xl leading-relaxed">
                    Get instant help about WiFi, check-in, checkout, parking,
                    appliances, restaurants, transport and local tips.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openView("ai")}
                  className="bg-white text-black rounded-[30px] p-6 text-left shadow-xl hover:scale-[1.015] transition"
                >
                  <div className="text-5xl mb-4">🤖</div>

                  <div className="text-2xl font-black mb-2">
                    Open AI Concierge
                  </div>

                  <div className="text-gray-500 leading-relaxed">
                    Ask in your language. Stay-related questions only.
                  </div>
                </button>
              </div>
            </section>

            {showWhatsAppContact && (
              <WhatsAppContactCard
                label={whatsappLabel}
                href={whatsappHref}
              />
            )}

            <section
              id="wifi-home"
              className="bg-white rounded-[36px] p-6 md:p-8 shadow-xl border border-black/5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
                <div>
                  <div className="uppercase tracking-[0.3em] text-xs text-gray-400 mb-3">
                    QUICK WIFI
                  </div>

                  <h2 className="text-3xl md:text-4xl font-black mb-2">
                    Connect to WiFi
                  </h2>

                  <p className="text-gray-500">
                    Network and password are kept visible here for fast access.
                  </p>
                </div>

                <button
                  onClick={copyWifi}
                  className="bg-black text-white rounded-2xl px-6 py-4 font-bold hover:opacity-90 transition"
                >
                  Copy WiFi
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-[28px] bg-[#f4f1eb] p-5 border border-black/5">
                  <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">
                    Network
                  </div>

                  <div className="text-2xl md:text-3xl font-black break-words">
                    {property.wifi_name || "Not available"}
                  </div>
                </div>

                <div className="rounded-[28px] bg-black text-white p-5 border border-black">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
                    Password
                  </div>

                  <div className="text-2xl md:text-3xl font-black break-words">
                    {property.wifi_password || "Not available"}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <HomeHubCard
                icon="🔑"
                title="Essential Info"
                description="Check-in, checkout, address, house rules and security notes."
                onClick={() => openView("essential")}
              />

              <HomeHubCard
                icon="🏡"
                title="Apartment Guide"
                description="About the stay, amenities, kitchen, AC, hot water, laundry and towels."
                onClick={() => openView("apartment")}
              />

              <HomeHubCard
                icon="📍"
                title="Local Guide"
                description="Parking, restaurants, transport and useful local recommendations."
                onClick={() => openView("local")}
              />

              <HomeHubCard
                icon="🛎️"
                title="Extra Services"
                description="Optional services, upgrades and host-supported extras."
                onClick={() => openView("extras")}
              />
            </section>

            <section className="bg-white rounded-[36px] p-6 md:p-8 shadow-xl border border-black/5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div>
                  <h2 className="text-2xl md:text-4xl font-black mb-2">
                    Need urgent help?
                  </h2>

                  <p className="text-gray-500 leading-relaxed max-w-2xl">
                    Emergency information and host contact options are grouped
                    under Help.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openView("help")}
                  className="rounded-2xl bg-black px-5 py-3 font-black text-white"
                >
                  Open Help
                </button>
              </div>
            </section>
          </>
        )}

        {activeView === "essential" && (
          <>
            <ViewHeader
              icon="🔑"
              title="Essential Info"
              description="Important details for your stay: check-in, checkout, WiFi, house rules, address and access security."
              onBack={() => openView("home")}
            />

            <DetailAccordion items={essentialItems} />

            <AskAiCta onClick={() => openView("ai")} />
          </>
        )}

        {activeView === "apartment" && (
          <>
            <ViewHeader
              icon="🏡"
              title="Apartment Guide"
              description="Everything related to the home itself: amenities, appliances, kitchen, laundry, towels, AC, hot water and practical notes."
              onBack={() => openView("home")}
            />

            <DetailAccordion items={apartmentItems} />

            <AskAiCta onClick={() => openView("ai")} />
          </>
        )}

        {activeView === "local" && (
          <>
            <ViewHeader
              icon="📍"
              title="Local Guide"
              description="Useful local information for parking, restaurants, transport and exploring the area."
              onBack={() => openView("home")}
            />

            <DetailAccordion items={localItems} />

            <AskAiCta onClick={() => openView("ai")} />
          </>
        )}

        {activeView === "extras" && (
          <>
            <ViewHeader
              icon="🛎️"
              title="Extra Services"
              description="Optional services, local upgrades and additional support that may be available during the stay."
              onBack={() => openView("home")}
            />

            <DetailAccordion items={extraItems} />

            <AskAiCta onClick={() => openView("ai")} />
          </>
        )}

        {activeView === "help" && (
          <>
            <ViewHeader
              icon="🚨"
              title="Help & Support"
              description="Emergency information, AI help, host contact and access security notes."
              onBack={() => openView("home")}
            />

            <DetailAccordion items={helpItems} />

            <AskAiCta onClick={() => openView("ai")} />
          </>
        )}

        {activeView === "ai" && (
          <>
            <ViewHeader
              icon="🤖"
              title="AI Concierge"
              description="Ask anything about your stay: WiFi, check-in, checkout, parking, house rules, appliances, restaurants, transport and local tips."
              onBack={() => openView("home")}
            />

            <section className="relative overflow-hidden bg-black text-white rounded-[40px] p-5 md:p-8 shadow-2xl">
              <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />

              <div className="relative mb-6">
                <div className="uppercase tracking-[0.3em] text-xs text-white/40 mb-4">
                  AI CONCIERGE
                </div>

                <h2 className="text-3xl md:text-5xl font-black mb-3 leading-tight">
                  Ask anything about your stay
                </h2>

                <p className="text-white/60 text-base md:text-lg max-w-2xl">
                  Replies in your language. Stay-related questions only.
                </p>
              </div>

              <div className="relative grid md:grid-cols-3 gap-3 mb-6">
                <PromptButton
                  onClick={() =>
                    sendMessage("What is the WiFi password?")
                  }
                >
                  What is the WiFi password?
                </PromptButton>

                <PromptButton
                  onClick={() =>
                    sendMessage("What time is checkout?")
                  }
                >
                  What time is checkout?
                </PromptButton>

                <PromptButton
                  onClick={() =>
                    sendMessage("Where can I park?")
                  }
                >
                  Where can I park?
                </PromptButton>

                <PromptButton
                  onClick={() =>
                    sendMessage("Any restaurants nearby?")
                  }
                >
                  Any restaurants nearby?
                </PromptButton>

                <PromptButton
                  onClick={() =>
                    sendMessage("How do I use the air conditioning?")
                  }
                >
                  How do I use the air conditioning?
                </PromptButton>

                <PromptButton
                  onClick={() =>
                    sendMessage("I need help with check-in.")
                  }
                >
                  I need help with check-in.
                </PromptButton>
              </div>

              <ChatPanel
                chatRef={chatRef}
                messages={messages}
                chatLoading={chatLoading}
                chatInput={chatInput}
                setChatInput={setChatInput}
                sendMessage={sendMessage}
              />
            </section>
          </>
        )}
      </main>

      <div className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
        <div className="bg-black text-white rounded-[28px] shadow-2xl p-3 grid grid-cols-4 gap-2 border border-white/10">
          <button
            type="button"
            onClick={() => openView("home")}
            className={`rounded-2xl py-3 text-center text-xs font-semibold ${
              activeView === "home"
                ? "bg-white text-black"
                : "bg-white/10 text-white"
            }`}
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => openView("ai")}
            className={`rounded-2xl py-3 text-center text-xs font-semibold ${
              activeView === "ai"
                ? "bg-white text-black"
                : "bg-white/10 text-white"
            }`}
          >
            Ask AI
          </button>

          <button
            type="button"
            onClick={() => openView("essential")}
            className={`rounded-2xl py-3 text-center text-xs font-semibold ${
              activeView === "essential"
                ? "bg-white text-black"
                : "bg-white/10 text-white"
            }`}
          >
            WiFi
          </button>

          <button
            type="button"
            onClick={() => openView("help")}
            className={`rounded-2xl py-3 text-center text-xs font-semibold ${
              activeView === "help"
                ? "bg-white text-black"
                : "bg-white/10 text-white"
            }`}
          >
            Help
          </button>
        </div>
      </div>
    </div>
  );
}