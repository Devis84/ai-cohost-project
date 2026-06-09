 "use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/Card"
import { DashboardHeader } from "@/components/organisms/DashboardHeader"

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
    <div className="min-h-screen bg-background p-6">

      <div className="max-w-7xl mx-auto">

        <DashboardHeader
          title="Conversations"
          description="Review guest and AI conversation history."
          className="mb-8"
        />

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">

          {/* SIDEBAR */}

          <Card variant="white" border padding="p-6">

            <h2 className="text-2xl font-bold text-on-surface mb-5">
              Properties
            </h2>

            <div className="space-y-3">

              {properties.map((property) => (

                <button
                  key={property}
                  onClick={() =>
                    setSelectedProperty(property)
                  }
                  className={`w-full text-left px-5 py-4 rounded-2xl transition font-medium ${
                    selectedProperty === property
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                >

                  Property {property.slice(0, 8)}

                </button>

              ))}

              {properties.length === 0 && (

                <div className="text-outline">
                  No conversations found
                </div>

              )}

            </div>

          </Card>

          {/* CHAT */}

          <Card variant="white" border padding="p-6" className="min-h-[600px]">

            <h2 className="text-2xl font-bold text-on-surface mb-5">
              Guest Chat
            </h2>

            <div className="space-y-4">

              {conversation.map((message) => (

                <div
                  key={message.id}
                  className={`max-w-[75%] rounded-3xl px-5 py-4 ${
                    message.role === "user" ||
                    message.role === "guest"
                      ? "bg-surface-container text-on-surface mr-auto"
                      : "bg-accent text-on-accent ml-auto"
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

                  <div className="text-outline">
                    No messages found for this
                    property.
                  </div>

                )}

              {!selectedProperty && (

                <div className="text-outline">
                  Select a property to view
                  messages.
                </div>

              )}

            </div>

          </Card>

        </div>

      </div>

    </div>
  )
}
