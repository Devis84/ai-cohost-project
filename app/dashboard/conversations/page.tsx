"use client"

import { useEffect, useState } from "react"

type Conversation = {
  id: string
  property_id: string
  role: "guest" | "assistant"
  message: string
  created_at: string
}

export default function ConversationsPage() {

  const [messages, setMessages] = useState<Conversation[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  async function loadConversations() {

    try {

      const res = await fetch("/api/conversations")
      const data = await res.json()

      if (!data.conversations) return

      setMessages(data.conversations)

      if (data.conversations.length > 0) {
        setSelectedProperty(data.conversations[0].property_id)
      }

    } catch (err) {
      console.error(err)
    }

  }

  const properties = Array.from(
    new Set(messages.map(m => m.property_id))
  )

  const conversation = messages
    .filter(m => m.property_id === selectedProperty)
    .sort((a, b) =>
      new Date(a.created_at).getTime() -
      new Date(b.created_at).getTime()
    )

  return (

    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>

      <div style={{
        width: 260,
        borderRight: "1px solid #ddd",
        padding: 20
      }}>

        <h2>Conversations</h2>

        {properties.map(property => (

          <div
            key={property}
            onClick={() => setSelectedProperty(property)}
            style={{
              padding: 12,
              cursor: "pointer",
              marginTop: 10,
              borderRadius: 6,
              background:
                selectedProperty === property
                  ? "#f2f2f2"
                  : "transparent"
            }}
          >

            Property {property.slice(0, 8)}

          </div>

        ))}

      </div>


      <div style={{
        flex: 1,
        padding: 30
      }}>

        <h2>Guest Chat</h2>

        <div style={{
          border: "1px solid #ccc",
          padding: 20,
          marginTop: 20,
          height: 500,
          overflowY: "auto",
          borderRadius: 8
        }}>

          {conversation.map(msg => (

            <div key={msg.id} style={{ marginBottom: 14 }}>

              <strong>{msg.role}:</strong> {msg.message}

            </div>

          ))}

        </div>

      </div>

    </div>

  )

}