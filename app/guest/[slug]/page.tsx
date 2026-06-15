 "use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useParams } from "next/navigation";

type WelcomeBook = {
  description?: string;
  amenities?: string;
  house_rules?: string;
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

type AiTraining = {
  faq?: string;
  troubleshooting?: string;
  guest_style?: string;
  hidden_notes?: string;
  additional_notes?: string;
};

type KnowledgeBase = {
  welcome_book?: WelcomeBook;
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

function getWelcomeBook(property?: Property | null): WelcomeBook {
  return property?.knowledge_base?.welcome_book || {};
}

function getPhoneHref(value?: string | null) {
  const phone = safeText(value);

  if (!phone) {
    return "";
  }

  const cleanPhone = phone.replace(/[^\d+]/g, "");

  return cleanPhone ? `tel:${cleanPhone}` : "";
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
  const imageUrl = safeText(property?.image_url);

  if (imageUrl) {
    return imageUrl;
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

function getHeroDescription(
  property?: Property | null,
  welcomeBook?: WelcomeBook
) {
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

function getAboutThisStayCopy(
  property?: Property | null,
  welcomeBook?: WelcomeBook
) {
  const propertyName = getPropertyName(property).toLowerCase();
  const city = safeText(property?.city).toLowerCase();

  if (
    propertyName.includes("maltese maisonette") ||
    city === "sliema"
  ) {
    return {
      title: "About this stay",
      intro:
        "This private one-bedroom maisonette gives you the feeling of a traditional Maltese home, with the comfort and independence of having the entire place to yourself.",
      body:
        "Inside, you’ll find a queen-size bedroom with A/C, a living area with sofa, a fully equipped kitchen, a bathroom with shower and washing machine, high-speed WiFi, a desk for work or study, and a small outdoor space. The apartment is set on a quiet Maltese street in central Sliema, close to the promenade, cafés, shops, public transport, Balluta Bay and St Julian’s nightlife.",
      highlights: [
        "Private one-bedroom maisonette",
        "Central Sliema location",
        "High-speed WiFi and desk",
        "Kitchen and washing machine",
      ],
    };
  }

  const description =
    safeText(welcomeBook?.description) ||
    safeText(property?.description) ||
    "This private stay includes the essential comforts you need for a smooth visit, with practical information, local tips and guest support available from this page.";

  return {
    title: "About this stay",
    intro:
      "A private stay designed to make your visit simple, comfortable and easy to manage.",
    body: description,
    highlights: [
      "Private guest space",
      "Useful stay information",
      "AI Concierge support",
      "Local tips and essentials",
    ],
  };
}

function SectionCard({
  icon,
  title,
  children,
  tone = "default",
}: {
  icon: string;
  title: string;
  children: ReactNode;
  tone?: "default" | "dark" | "danger" | "soft";
}) {
  const classes =
    tone === "dark"
      ? "bg-black text-white border-black"
      : tone === "danger"
        ? "bg-red-50 border-red-100 text-gray-950"
        : tone === "soft"
          ? "bg-zinc-50 border-zinc-100 text-gray-950"
          : "bg-white border-black/5 text-gray-950";

  return (
    <section
      className={`rounded-[32px] border shadow-xl p-5 md:p-7 ${classes}`}
    >
      <h2 className="text-xl md:text-2xl font-black mb-4 flex items-center gap-3">
        <span>{icon}</span>
        <span>{title}</span>
      </h2>

      <div className="leading-relaxed whitespace-pre-line text-[15px] md:text-base">
        {children}
      </div>
    </section>
  );
}

function QuickAction({
  href,
  icon,
  title,
  subtitle,
  dark = false,
}: {
  href: string;
  icon: string;
  title: string;
  subtitle: string;
  dark?: boolean;
}) {
  return (
    <a
      href={href}
      className={`rounded-[28px] p-5 border shadow-xl hover:scale-[1.015] transition ${
        dark
          ? "bg-black text-white border-black"
          : "bg-white text-black border-black/5"
      }`}
    >
      <div className="text-3xl mb-4">{icon}</div>

      <div className="font-black text-lg mb-1">
        {title}
      </div>

      <div
        className={`text-sm leading-relaxed ${
          dark ? "text-white/60" : "text-gray-500"
        }`}
      >
        {subtitle}
      </div>
    </a>
  );
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

function MiniInfoCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-[28px] p-5 shadow-xl border border-black/5">
      <div className="text-3xl mb-3">{icon}</div>

      <div className="text-xs uppercase tracking-[0.22em] text-gray-400 mb-2">
        {label}
      </div>

      <div className="font-black text-lg break-words">
        {value || "Not available"}
      </div>
    </div>
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
      className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-left hover:bg-white/15 transition text-sm md:text-base"
    >
      {children}
    </button>
  );
}

export default function GuestPage() {
  const params = useParams();
  const slug = String(params?.slug || "");

  const [property, setProperty] =
    useState<Property | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [chatInput, setChatInput] =
    useState("");

  const [chatLoading, setChatLoading] =
    useState(false);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const chatRef = useRef<HTMLDivElement | null>(null);

  const welcomeBook = useMemo(() => {
    return getWelcomeBook(property);
  }, [property]);

  const propertyName = useMemo(() => {
    return getPropertyName(property);
  }, [property]);

  const locationText = useMemo(() => {
    const city = safeText(property?.city);
    const country = safeText(property?.country);

    if (city && country) {
      return `${city}, ${country}`;
    }

    return city || country || "Location";
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

  const restaurants =
    safeText(welcomeBook.restaurants);

  const transport =
    safeText(welcomeBook.transport);

  const checkoutNotes =
    safeText(welcomeBook.checkout_notes);

  const extraNotes =
    safeText(welcomeBook.extra_notes);

  const trash =
    safeText(welcomeBook.trash);

  const ac =
    safeText(welcomeBook.ac);

  const boiler =
    safeText(welcomeBook.boiler);

  useEffect(() => {
    loadProperty();
  }, [slug]);

  useEffect(() => {
    if (!chatRef.current) {
      return;
    }

    chatRef.current.scrollTop =
      chatRef.current.scrollHeight;
  }, [messages, chatLoading]);

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

  if (loading) {
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

  if (loadError || !property) {
    return (
      <div className="min-h-screen bg-[#f4f1eb] flex items-center justify-center p-6">
        <div className="bg-white rounded-[36px] p-8 shadow-xl border border-black/5 text-center max-w-lg">
          <div className="text-5xl mb-4">⚠️</div>

          <div className="text-2xl font-black mb-2">
            Guest page unavailable
          </div>

          <div className="text-gray-500">
            {loadError ||
              "We could not find this property."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1eb] text-gray-950 pb-28 md:pb-0">
      <header className="relative overflow-hidden px-4 md:px-8 pt-5 md:pt-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-[40px] md:rounded-[56px] bg-black text-white shadow-2xl min-h-[620px] md:min-h-[660px]">
            {heroImageUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-100"
                style={{
                  backgroundImage: `url(${heroImageUrl})`,
                }}
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/5" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(255,255,255,0.16),transparent_32%)]" />

            <div className="relative p-6 md:p-12 lg:p-14 min-h-[620px] md:min-h-[660px] flex flex-col justify-between">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-2 text-xs md:text-sm text-white/90 mb-5 backdrop-blur-md shadow-lg">
                  <span>✨</span>
                  <span>Your digital stay guide</span>
                </div>

                <div className="uppercase tracking-[0.32em] text-[10px] md:text-[11px] text-white/60 mb-4">
                  AI CO-HOST EXPERIENCE
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-5 leading-[0.95] max-w-4xl drop-shadow-2xl">
                  Welcome to {propertyName}
                </h1>

                <p className="text-white/90 text-base md:text-xl max-w-2xl leading-relaxed drop-shadow-xl">
                  {heroDescription}
                </p>
              </div>

              <div className="mt-10">
                <div className="flex flex-wrap gap-3">
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
                    icon="🌍"
                    label="Multilingual assistance"
                  />
                </div>
              </div>
            </div>
          </div>

          <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 -mt-8 relative z-10 px-3 md:px-8">
            <QuickAction
              href="#wifi"
              icon="📶"
              title="WiFi"
              subtitle="Network and password"
            />

            <QuickAction
              href="#ai-concierge"
              icon="🤖"
              title="Ask AI"
              subtitle="Help in your language"
            />

            <QuickAction
              href="#welcome-book"
              icon="📘"
              title="Stay Guide"
              subtitle="Rules, tips and services"
            />

            <QuickAction
              href="#help"
              icon="🚨"
              title="Need Help"
              subtitle="Emergency and host support"
            />
          </section>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-7 md:space-y-8">
        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <MiniInfoCard
            icon="📍"
            label="Location"
            value={locationText}
          />

          <MiniInfoCard
            icon="🔑"
            label="Check-in"
            value={property.checkin_time || "Not available"}
          />

          <MiniInfoCard
            icon="🚪"
            label="Check-out"
            value={property.checkout_time || "Not available"}
          />

          <MiniInfoCard
            icon="💬"
            label="Support"
            value={
              property.host_phone
                ? "Host contact available"
                : "AI Concierge available"
            }
          />
        </section>

        <section className="bg-white rounded-[40px] p-6 md:p-8 shadow-xl border border-black/5">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
            <div>
              <div className="uppercase tracking-[0.3em] text-xs text-gray-400 mb-4">
                THE APARTMENT
              </div>

              <h2 className="text-3xl md:text-5xl font-black mb-5 leading-tight">
                {aboutThisStay.title}
              </h2>

              <p className="text-lg md:text-xl leading-relaxed text-gray-800 mb-5">
                {aboutThisStay.intro}
              </p>

              <p className="text-gray-500 leading-relaxed text-base md:text-lg">
                {aboutThisStay.body}
              </p>
            </div>

            <div className="bg-[#f4f1eb] rounded-[32px] p-5 md:p-6 border border-black/5">
              <div className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-5">
                Highlights
              </div>

              <div className="space-y-3">
                {aboutThisStay.highlights.map((item) => (
                  <div
                    key={item}
                    className="bg-white rounded-2xl px-4 py-4 font-bold shadow-sm border border-black/5 flex items-center gap-3"
                  >
                    <span>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="wifi"
          className="relative overflow-hidden bg-white rounded-[40px] p-6 md:p-8 shadow-xl border border-black/5"
        >
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-black/5 blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="uppercase tracking-[0.3em] text-xs text-gray-400 mb-4">
                QUICK ACCESS
              </div>

              <h2 className="text-3xl md:text-5xl font-black mb-3">
                Connect to WiFi
              </h2>

              <p className="text-gray-500 leading-relaxed max-w-2xl">
                Tap copy and paste the network details into your
                phone settings if needed.
              </p>
            </div>

            <button
              onClick={copyWifi}
              className="bg-black text-white rounded-2xl px-6 py-4 font-bold hover:opacity-90 transition"
            >
              Copy WiFi
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-7">
            <div className="bg-[#f4f1eb] border border-black/5 rounded-[28px] p-5">
              <div className="text-gray-400 text-xs uppercase tracking-[0.2em] mb-2">
                Network
              </div>

              <div className="text-2xl md:text-3xl font-black break-words">
                {property.wifi_name || "Not available"}
              </div>
            </div>

            <div className="bg-black text-white border border-black rounded-[28px] p-5">
              <div className="text-white/40 text-xs uppercase tracking-[0.2em] mb-2">
                Password
              </div>

              <div className="text-2xl md:text-3xl font-black break-words">
                {property.wifi_password || "Not available"}
              </div>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <SectionCard icon="🏡" title="Arrival">
            <div className="space-y-3">
              <p>
                <strong>Check-in:</strong>{" "}
                {property.checkin_time || "Not available"}
              </p>

              <p>
                <strong>Check-out:</strong>{" "}
                {property.checkout_time || "Not available"}
              </p>

              {property.address && (
                <p>
                  <strong>Address:</strong>{" "}
                  {property.address}
                </p>
              )}

              <p className="text-sm text-gray-500 pt-2">
                For security reasons, private access codes are shared
                only through the host’s private message, not on this
                public guest page.
              </p>

              {mapsHref && (
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex bg-black text-white rounded-2xl px-5 py-3 font-semibold mt-2"
                >
                  Open in Maps
                </a>
              )}
            </div>
          </SectionCard>

          <SectionCard
            icon="🚨"
            title="Emergency"
            tone="danger"
          >
            <div id="help">
              {emergency ||
                "For emergencies, contact local emergency services."}
            </div>
          </SectionCard>

          <SectionCard icon="💬" title="Need help?">
            <div className="space-y-4">
              <p>
                Ask the AI Concierge for quick help about WiFi,
                check-in, checkout, parking, house rules, appliances,
                restaurants, transport and local tips.
              </p>

              <p className="text-sm text-gray-500">
                The AI Concierge replies in the guest’s language and
                is limited to questions related to the stay.
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href="#ai-concierge"
                  className="inline-flex bg-black text-white rounded-2xl px-5 py-3 font-semibold"
                >
                  Ask AI
                </a>

                {hostPhoneHref && (
                  <a
                    href={hostPhoneHref}
                    className="inline-flex bg-white border border-gray-200 text-black rounded-2xl px-5 py-3 font-semibold"
                  >
                    Contact Host
                  </a>
                )}
              </div>
            </div>
          </SectionCard>
        </section>

        {property.checkin_instructions && (
          <SectionCard
            icon="🔑"
            title="Arrival Instructions"
          >
            <div className="space-y-4">
              <p>{property.checkin_instructions}</p>

              <p className="text-sm text-gray-500">
                Private access codes are not displayed on this public
                guest page. Please check the host’s private message if
                an access code is required.
              </p>
            </div>
          </SectionCard>
        )}

        <section
          id="ai-concierge"
          className="relative overflow-hidden bg-black text-white rounded-[40px] p-5 md:p-8 shadow-2xl"
        >
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
            <div>
              <div className="uppercase tracking-[0.3em] text-xs text-white/40 mb-4">
                AI CONCIERGE
              </div>

              <h2 className="text-3xl md:text-5xl font-black mb-3 leading-tight">
                Ask anything about your stay
              </h2>

              <p className="text-white/60 text-base md:text-lg max-w-2xl">
                WiFi, check-in, checkout, parking, house rules,
                appliances, restaurants, transport and local tips.
              </p>

              <div className="mt-4 grid md:grid-cols-2 gap-3">
                <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white/70">
                  Replies in your language.
                </div>

                <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white/70">
                  Stay-related questions only.
                </div>
              </div>
            </div>

            <div className="text-6xl">🤖</div>
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

          <div className="relative bg-white/5 border border-white/10 rounded-[32px] overflow-hidden">
            <div
              ref={chatRef}
              className="h-[400px] md:h-[460px] overflow-y-auto p-4 md:p-6 space-y-4"
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
                className="flex-1 bg-white text-black rounded-2xl px-5 py-4 outline-none"
              />

              <button
                onClick={() => sendMessage()}
                disabled={chatLoading || !chatInput.trim()}
                className="bg-white text-black rounded-2xl px-6 py-4 font-bold hover:opacity-90 transition disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        </section>

        <section id="welcome-book" className="space-y-6">
          <div className="bg-white rounded-[40px] p-6 md:p-8 shadow-xl border border-black/5">
            <div className="uppercase tracking-[0.3em] text-xs text-gray-400 mb-3">
              WELCOME BOOK
            </div>

            <h2 className="text-3xl md:text-5xl font-black">
              Everything useful in one place
            </h2>

            <p className="text-gray-500 mt-3 max-w-2xl">
              House rules, practical notes, local recommendations and
              checkout information for a smooth stay.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {amenities && (
              <SectionCard icon="🧺" title="Amenities">
                {amenities}
              </SectionCard>
            )}

            {houseRules && (
              <SectionCard icon="📋" title="House Rules">
                {houseRules}
              </SectionCard>
            )}

            {parking && (
              <SectionCard icon="🅿️" title="Parking">
                {parking}
              </SectionCard>
            )}

            {trash && (
              <SectionCard icon="♻️" title="Trash & Recycling">
                {trash}
              </SectionCard>
            )}

            {ac && (
              <SectionCard icon="❄️" title="Air Conditioning">
                {ac}
              </SectionCard>
            )}

            {boiler && (
              <SectionCard icon="🚿" title="Hot Water / Boiler">
                {boiler}
              </SectionCard>
            )}

            {restaurants && (
              <SectionCard icon="🍽️" title="Restaurants & Bars">
                {restaurants}
              </SectionCard>
            )}

            {transport && (
              <SectionCard icon="🚌" title="Transport">
                {transport}
              </SectionCard>
            )}

            {localGuide && (
              <SectionCard icon="📍" title="Local Guide">
                {localGuide}
              </SectionCard>
            )}

            {checkoutNotes && (
              <SectionCard icon="🚪" title="Checkout Notes">
                {checkoutNotes}
              </SectionCard>
            )}

            {extraNotes && (
              <SectionCard icon="✨" title="Extra Services & Notes">
                {extraNotes}
              </SectionCard>
            )}
          </div>
        </section>

        <section className="bg-black text-white rounded-[40px] p-6 md:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <h2 className="text-2xl md:text-4xl font-black mb-2">
                Still need help?
              </h2>

              <p className="text-white/60 leading-relaxed max-w-2xl">
                Ask the AI Concierge for stay-related questions, or
                contact the host directly for urgent matters.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="#ai-concierge"
                className="bg-white text-black rounded-2xl px-5 py-3 font-semibold"
              >
                Ask AI
              </a>

              {hostPhoneHref && (
                <a
                  href={hostPhoneHref}
                  className="bg-white/10 border border-white/10 text-white rounded-2xl px-5 py-3 font-semibold"
                >
                  Contact Host
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
        <div className="bg-black text-white rounded-[28px] shadow-2xl p-3 grid grid-cols-3 gap-2 border border-white/10">
          <a
            href="#wifi"
            className="bg-white/10 rounded-2xl py-3 text-center text-sm font-semibold"
          >
            WiFi
          </a>

          <a
            href="#ai-concierge"
            className="bg-white rounded-2xl py-3 text-center text-sm font-semibold text-black"
          >
            Ask AI
          </a>

          <a
            href="#welcome-book"
            className="bg-white/10 rounded-2xl py-3 text-center text-sm font-semibold"
          >
            Guide
          </a>
        </div>
      </div>
    </div>
  );
}