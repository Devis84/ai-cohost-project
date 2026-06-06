 "use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function SectionCard({
  icon,
  title,
  children,
  tone = "default",
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  tone?: "default" | "dark" | "danger";
}) {
  const classes =
    tone === "dark"
      ? "bg-black text-white border-black"
      : tone === "danger"
        ? "bg-red-50 border-red-100 text-gray-950"
        : "bg-white border-black/5 text-gray-950";

  return (
    <section
      className={`rounded-[32px] border shadow-xl p-6 md:p-7 ${classes}`}
    >
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
        <span>{icon}</span>
        <span>{title}</span>
      </h2>

      <div className="leading-relaxed whitespace-pre-line">
        {children}
      </div>
    </section>
  );
}

function QuickButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <a
      href={href}
      className="bg-white text-black rounded-2xl px-5 py-4 font-bold shadow-xl border border-white/10 flex items-center justify-center gap-2 hover:scale-[1.02] transition"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </a>
  );
}

export default function GuestPage() {
  const params = useParams();
  const slug = String(params?.slug || "");

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

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

  const description =
    safeText(welcomeBook.description) ||
    safeText(property?.description) ||
    "Welcome. Everything you need for your stay is available here.";

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

    const value = `Network: ${wifiName || "Not available"} | Password: ${
      wifiPassword || "Not available"
    }`;

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

    setMessages((current) => [...current, userMessage]);
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
        "Sorry, I could not answer right now. The host has been notified if this is urgent.";

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
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-6">
        <div className="bg-white rounded-[32px] p-8 shadow-xl border border-black/5 text-center">
          <div className="text-4xl mb-4">🏡</div>
          <div className="text-2xl font-bold mb-2">
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
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-6">
        <div className="bg-white rounded-[32px] p-8 shadow-xl border border-black/5 text-center max-w-lg">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-2xl font-bold mb-2">
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
    <div className="min-h-screen bg-[#f5f5f5] text-gray-950">
      <header className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white px-5 md:px-8 py-10 md:py-14">
        <div className="max-w-6xl mx-auto">
          <div className="uppercase tracking-[0.35em] text-[11px] text-white/40 mb-5">
            AI CO-HOST EXPERIENCE
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-5">
            Welcome to {propertyName}
          </h1>

          <p className="text-white/70 text-lg md:text-xl max-w-3xl leading-relaxed mb-8">
            {description}
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <div className="bg-white/10 border border-white/10 rounded-full px-5 py-3">
              📍 {locationText}
            </div>

            {property.checkin_time && (
              <div className="bg-white/10 border border-white/10 rounded-full px-5 py-3">
                🔑 Check-in: {property.checkin_time}
              </div>
            )}

            {property.checkout_time && (
              <div className="bg-white/10 border border-white/10 rounded-full px-5 py-3">
                🚪 Check-out: {property.checkout_time}
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <QuickButton
              href="#wifi"
              icon="📶"
              label="WiFi"
            />

            <QuickButton
              href="#ai-concierge"
              icon="🤖"
              label="Ask AI"
            />

            <QuickButton
              href="#welcome-book"
              icon="📘"
              label="Welcome Book"
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8">
        <section className="grid lg:grid-cols-3 gap-6">
          <div id="wifi">
            <SectionCard icon="📶" title="WiFi">
              <div className="space-y-3">
                <p>
                  <strong>Network:</strong>{" "}
                  {property.wifi_name || "Not available"}
                </p>

                <p>
                  <strong>Password:</strong>{" "}
                  {property.wifi_password || "Not available"}
                </p>

                <button
                  onClick={copyWifi}
                  className="mt-3 bg-black text-white rounded-2xl px-5 py-3 font-semibold hover:opacity-90 transition"
                >
                  Copy WiFi
                </button>
              </div>
            </SectionCard>
          </div>

          <SectionCard icon="🔑" title="Check-in">
            <div className="space-y-3">
              <p>
                <strong>Check-in:</strong>{" "}
                {property.checkin_time || "Not available"}
              </p>

              <p>
                <strong>Check-out:</strong>{" "}
                {property.checkout_time || "Not available"}
              </p>

              {property.lockbox_code && (
                <p>
                  <strong>Lockbox:</strong>{" "}
                  {property.lockbox_code}
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard
            icon="🚨"
            title="Emergency"
            tone="danger"
          >
            {emergency ||
              "For emergencies, contact local emergency services."}
          </SectionCard>
        </section>

        {property.checkin_instructions && (
          <SectionCard
            icon="🏡"
            title="Arrival Instructions"
          >
            {property.checkin_instructions}
          </SectionCard>
        )}

        <section
          id="ai-concierge"
          className="bg-black text-white rounded-[32px] p-6 md:p-8 shadow-2xl"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
            <div>
              <div className="uppercase tracking-[0.3em] text-xs text-white/40 mb-4">
                AI CONCIERGE
              </div>

              <h2 className="text-3xl md:text-4xl font-black mb-3">
                Need help during your stay?
              </h2>

              <p className="text-white/60 text-lg max-w-2xl">
                Ask about WiFi, parking, house rules, restaurants,
                transport, check-in, checkout and more.
              </p>
            </div>

            <div className="text-5xl">🤖</div>
          </div>

          <div className="grid md:grid-cols-3 gap-3 mb-6">
            <button
              onClick={() =>
                sendMessage("What is the WiFi password?")
              }
              className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-left hover:bg-white/15 transition"
            >
              What is the WiFi password?
            </button>

            <button
              onClick={() =>
                sendMessage("How do I check in?")
              }
              className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-left hover:bg-white/15 transition"
            >
              How do I check in?
            </button>

            <button
              onClick={() =>
                sendMessage("Where can I park?")
              }
              className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-left hover:bg-white/15 transition"
            >
              Where can I park?
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[28px] overflow-hidden">
            <div
              ref={chatRef}
              className="h-[420px] overflow-y-auto p-5 md:p-6 space-y-4"
            >
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-white/40 text-center">
                  Start by asking a question about your stay.
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-3xl px-5 py-4 ${
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

            <div className="border-t border-white/10 p-4 flex gap-3">
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
                placeholder="Ask your AI Concierge..."
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
          <div>
            <div className="uppercase tracking-[0.3em] text-xs text-gray-400 mb-3">
              WELCOME BOOK
            </div>

            <h2 className="text-3xl md:text-4xl font-black">
              Useful information for your stay
            </h2>
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
      </main>
    </div>
  );
}