"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function ConversationPage() {

  const params = useParams()
  const id = params.id

  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {

    async function loadMessages() {

      const res = await fetch(`/api/conversations?id=${id}`)

      const data = await res.json()

      setMessages(data)

    }

    if (id) {
      loadMessages()
    }

  }, [id])

  return (

    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif" }}>

      <h1>Conversation</h1>

      {messages.map((msg:any) => (

        <div
          key={msg.id}
          style={{
            padding: 12,
            marginBottom: 10,
            background: msg.role === "assistant" ? "#eef2ff" : "#f3f4f6",
            borderRadius: 8
          }}
        >

          <b>{msg.role}</b>

          <p>{msg.message}</p>

        </div>

      ))}

    </div>

  )

}