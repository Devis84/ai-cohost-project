 "use client";

import React, { useState } from "react";

export default function Page() {

  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<
    { role: string; content: string }[]
  >([]);

  // TEST PROPERTY

  const propertySlug = "test-apartment";

  // SIMPLE CONVERSATION ID

  const conversationId =
    "conv_" + propertySlug;

  async function sendMessage() {

    if (!input.trim()) return;

    const userMessage = input;

    // USER MESSAGE

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

          propertySlug,

          conversationId,

        }),
      });

      const data = await res.json();

      if (!data.reply) {

        console.error("No reply from API");

        return;
      }

      // AI MESSAGE

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);

    } catch (err) {

      console.error("Fetch error:", err);
    }
  }

  return (

    <div
      style={{
        padding: 40,
        maxWidth: 900,
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >

      <h1
        style={{
          fontSize: 36,
          marginBottom: 10,
        }}
      >
        AI Co-Host
      </h1>

      <p
        style={{
          color: "#666",
          marginBottom: 30,
        }}
      >
        Property:
        {" "}
        <strong>{propertySlug}</strong>
      </p>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 16,
          padding: 24,
          minHeight: 450,
          marginBottom: 20,
          background: "#fff",
        }}
      >

        {messages.length === 0 && (

          <p style={{ color: "#999" }}>
            Start a conversation...
          </p>
        )}

        {messages.map((msg, i) => (

          <div
            key={i}
            style={{
              marginBottom: 20,
            }}
          >

            <strong>
              {msg.role === "user"
                ? "You"
                : "AI"}
              :
            </strong>

            <p
              style={{
                marginTop: 8,
                lineHeight: 1.6,
              }}
            >
              {msg.content}
            </p>

          </div>
        ))}

      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
        }}
      >

        <input
          value={input}
          onChange={(e) =>
            setInput(e.target.value)
          }
          placeholder="Ask something..."
          style={{
            flex: 1,
            padding: 16,
            borderRadius: 12,
            border: "1px solid #ccc",
            fontSize: 16,
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            padding: "16px 24px",
            borderRadius: 12,
            border: "none",
            background: "black",
            color: "white",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Send
        </button>

      </div>

    </div>
  );
}