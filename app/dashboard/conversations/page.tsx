 "use client"

import { useEffect, useState } from "react"

type Conversation = {
  id: string
  property_id: string
  role: "user" | "assistant" | "guest"
  message: string
  created_at: string
}

export default function ConversationsPage() {
  const [messages, setMessages] = useState<Conversation[]>([])

  const [selectedProperty, setSelectedProperty] =
    useState<string | null>(null)

  async function loadConversations() {
    try {
      const res = await fetch("/api/conversations")

      const data = await res.json()

      const conversations = data.conversations || []

      setMessages(conversations)

      if (conversations.length > 0) {
        setSelectedProperty(
          conversations[0].property_id
        )
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  const properties = Array.from(
    new Set(
      messages.map(
        (message) => message.property_id
      )
    )
  )

  const conversation = messages
    .filter(
      (message) =>
        message.property_id ===
        selectedProperty
    )
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
    )

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">

      <div className="max-w-7xl mx-auto">

        {/* HERO */}

        <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white rounded-[32px] p-8 shadow-2xl mb-8">

          <h1 className="text-4xl font-bold mb-4">
            Conversations
          </h1>

          <p className="text-white/60">
            Review guest and AI conversation
            history.
          </p>

        </div>

        {/* CONTENT */}

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">

          {/* SIDEBAR */}

          <div className="bg-white rounded-[32px] shadow-xl border border-black/5 p-6">

            <h2 className="text-2xl font-bold mb-5">
              Properties
            </h2>

            <div className="space-y-3">

              {properties.map((property) => (

                <button
                  key={property}
                  onClick={() =>
                    setSelectedProperty(property)
                  }
                  className={`w-full text-left px-5 py-4 rounded-2xl transition ${
                    selectedProperty === property
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >

                  Property {property.slice(0, 8)}

                </button>

              ))}

              {properties.length === 0 && (

                <div className="text-gray-500">
                  No conversations found
                </div>

              )}

            </div>

          </div>

          {/* CHAT */}

          <div className="bg-white rounded-[32px] shadow-xl border border-black/5 p-6 min-h-[600px]">

            <h2 className="text-2xl font-bold mb-5">
              Guest Chat
            </h2>

            <div className="space-y-4">

              {conversation.map((message) => (

                <div
                  key={message.id}
                  className={`max-w-[75%] rounded-3xl px-5 py-4 ${
                    message.role === "user" ||
                    message.role === "guest"
                      ? "bg-gray-100 mr-auto"
                      : "bg-black text-white ml-auto"
                  }`}
                >

                  <div className="text-xs opacity-60 uppercase tracking-wide mb-2">

                    {message.role === "user" ||
                    message.role === "guest"
                      ? "Guest"
                      : "AI"}

                  </div>

                  <div className="leading-relaxed whitespace-pre-line">

                    {message.message}

                  </div>

                  <div className="text-[11px] opacity-50 mt-3">

                    {new Date(
                      message.created_at
                    ).toLocaleString()}

                  </div>

                </div>

              ))}

              {selectedProperty &&
                conversation.length === 0 && (

                  <div className="text-gray-500">
                    No messages found for this
                    property.
                  </div>

                )}

              {!selectedProperty && (

                <div className="text-gray-500">
                  Select a property to view
                  messages.
                </div>

              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}