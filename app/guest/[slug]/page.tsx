 "use client";

import { useEffect, useState } from "react";

type KnowledgeBase = {
  welcome_book?: {
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

  ai_training?: {
    faq?: string;
    troubleshooting?: string;
    guest_style?: string;
    hidden_notes?: string;
    additional_notes?: string;
  };
};

type Property = {
  id: string;

  property_name: string;

  city?: string;
  country?: string;
  address?: string;

  wifi_name?: string;
  wifi_password?: string;

  checkin_time?: string;
  checkout_time?: string;

  checkin_instructions?: string;

  lockbox_code?: string;

  emergency_numbers?: string;

  contacts?: string[];

  knowledge_base?: KnowledgeBase;
};

export default function GuestPage({
  params,
}: {
  params: { slug: string };
}) {

  const [property, setProperty] =
    useState<Property | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [input, setInput] =
    useState("");

  const [messages, setMessages] =
    useState<
      { role: string; content: string }[]
    >([]);

  // CONVERSATION ID

  const conversationId =
    "guest_" + params.slug;

  // LOAD PROPERTY

  useEffect(() => {

    async function loadProperty() {

      try {

        const res = await fetch(
          `/api/properties/${params.slug}`
        );

        const data = await res.json();

        setProperty(data.property || null);

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);
      }
    }

    loadProperty();

  }, [params.slug]);

  // SEND MESSAGE

  async function sendMessage() {

    if (!input.trim()) return;

    const userMessage = input;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setInput("");

    try {

      const res = await fetch("/api/chat", {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({

          message: userMessage,

          propertySlug: params.slug,

          conversationId,

        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.reply ||
            "Sorry, I could not answer right now.",
        },
      ]);

    } catch (err) {

      console.error(err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, something went wrong.",
        },
      ]);
    }
  }

  // LOADING

  if (loading) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          Loading guest page...
        </div>
      </div>
    );
  }

  // NO PROPERTY

  if (!property) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          Property not found
        </div>
      </div>
    );
  }

  const welcome =
    property.knowledge_base?.welcome_book || {};

  return (

    <div className="min-h-screen bg-[#f5f5f5] pb-12">

      {/* HERO */}

      <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white px-6 py-14 shadow-2xl">

        <div className="max-w-6xl mx-auto">

          <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-4">
            AI CO-HOST EXPERIENCE
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-5">
            {property.property_name}
          </h1>

          <p className="text-white/70 text-lg leading-relaxed max-w-3xl">
            {welcome.description ||
              "Welcome to your stay. Here you can find property information, house rules, local tips and chat with the AI concierge."}
          </p>

          <div className="flex flex-wrap gap-3 mt-8">

            {property.city && (
              <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-full px-5 py-3 text-sm">
                📍 {property.city}
                {property.country
                  ? `, ${property.country}`
                  : ""}
              </div>
            )}

            {property.checkin_time && (
              <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-full px-5 py-3 text-sm">
                🔑 Check-in: {property.checkin_time}
              </div>
            )}

            {property.checkout_time && (
              <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-full px-5 py-3 text-sm">
                🚪 Check-out: {property.checkout_time}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* MAIN */}

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* QUICK INFO */}

        <div className="grid md:grid-cols-3 gap-6">

          {/* WIFI */}

          <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

            <h2 className="text-2xl font-bold mb-5">
              📶 WiFi
            </h2>

            <div className="space-y-3 text-gray-700">

              <p>
                <strong>Name:</strong>{" "}
                {property.wifi_name || "Not available"}
              </p>

              <p>
                <strong>Password:</strong>{" "}
                {property.wifi_password || "Not available"}
              </p>

            </div>

          </section>

          {/* CHECK-IN */}

          <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

            <h2 className="text-2xl font-bold mb-5">
              🔑 Check-in
            </h2>

            <div className="space-y-3 text-gray-700">

              <p>
                <strong>Check-in:</strong>{" "}
                {property.checkin_time || "N/A"}
              </p>

              <p>
                <strong>Check-out:</strong>{" "}
                {property.checkout_time || "N/A"}
              </p>

              {property.lockbox_code && (
                <p>
                  <strong>Lockbox:</strong>{" "}
                  {property.lockbox_code}
                </p>
              )}

            </div>

          </section>

          {/* EMERGENCY */}

          <section className="bg-red-50 rounded-[32px] p-7 shadow-xl border border-red-100">

            <h2 className="text-2xl font-bold mb-5">
              🚨 Emergency
            </h2>

            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {property.emergency_numbers ||
                welcome.emergency ||
                "No emergency information provided."}
            </p>

          </section>

        </div>

        {/* CHECK-IN INSTRUCTIONS */}

        {property.checkin_instructions && (

          <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

            <h2 className="text-2xl font-bold mb-5">
              🏡 Arrival Instructions
            </h2>

            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {property.checkin_instructions}
            </p>

          </section>
        )}

        {/* WELCOME BOOK */}

        <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">

          <h2 className="text-2xl font-bold mb-2">
            📘 Welcome Book
          </h2>

          <p className="text-gray-500 mb-8">
            Everything you need during your stay.
          </p>

          <div className="grid md:grid-cols-2 gap-5">

            <InfoCard
              title="✨ Amenities"
              content={welcome.amenities}
            />

            <InfoCard
              title="📋 House Rules"
              content={welcome.house_rules}
            />

            <InfoCard
              title="🚗 Parking"
              content={welcome.parking}
            />

            <InfoCard
              title="🗑️ Trash & Recycling"
              content={welcome.trash}
            />

            <InfoCard
              title="❄️ Air Conditioning"
              content={welcome.ac}
            />

            <InfoCard
              title="🚿 Boiler / Hot Water"
              content={welcome.boiler}
            />

            <InfoCard
              title="🍽️ Restaurants"
              content={welcome.restaurants}
            />

            <InfoCard
              title="🚌 Transport"
              content={welcome.transport}
            />

            <InfoCard
              title="📍 Local Guide"
              content={welcome.local_guide}
            />

            <InfoCard
              title="✅ Checkout Notes"
              content={welcome.checkout_notes}
            />

            <InfoCard
              title="📝 Extra Notes"
              content={welcome.extra_notes}
            />

          </div>

        </section>

        {/* AI CHAT */}

        <section className="bg-black text-white rounded-[32px] p-7 shadow-2xl">

          <div className="flex items-center justify-between mb-6">

            <div>

              <div className="uppercase tracking-[0.3em] text-xs text-white/40 mb-3">
                AI CONCIERGE
              </div>

              <h2 className="text-3xl font-bold mb-2">
                Need help during your stay?
              </h2>

              <p className="text-white/60">
                Ask about WiFi, parking, rules, restaurants, transport and more.
              </p>

            </div>

            <div className="text-5xl">
              🤖
            </div>

          </div>

          {/* CHAT MESSAGES */}

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 min-h-[320px] mb-5">

            {messages.length === 0 && (

              <div className="text-white/40">
                Start the conversation with the AI concierge...
              </div>
            )}

            {messages.map((msg, i) => (

              <div
                key={i}
                className={`mb-5 ${
                  msg.role === "user"
                    ? "text-right"
                    : "text-left"
                }`}
              >

                <div
                  className={`inline-block max-w-[85%] rounded-2xl px-5 py-4 ${
                    msg.role === "user"
                      ? "bg-white text-black"
                      : "bg-white/10 border border-white/10 text-white"
                  }`}
                >

                  <div className="text-xs opacity-60 mb-2">
                    {msg.role === "user"
                      ? "You"
                      : "AI Concierge"}
                  </div>

                  <p className="leading-relaxed whitespace-pre-line">
                    {msg.content}
                  </p>

                </div>

              </div>
            ))}

          </div>

          {/* INPUT */}

          <div className="flex gap-3">

            <input
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Ask anything about your stay..."
              className="flex-1 bg-white text-black rounded-2xl px-5 py-4 outline-none"
            />

            <button
              onClick={sendMessage}
              className="bg-white text-black px-6 py-4 rounded-2xl font-semibold hover:opacity-90 transition"
            >
              Send
            </button>

          </div>

        </section>

      </div>

    </div>
  );
}

function InfoCard({
  title,
  content,
}: {
  title: string;
  content?: string;
}) {

  if (!content) return null;

  return (

    <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">

      <h3 className="font-bold text-lg mb-3">
        {title}
      </h3>

      <p className="text-gray-700 whitespace-pre-line leading-relaxed">
        {content}
      </p>

    </div>
  );
}