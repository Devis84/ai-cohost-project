 "use client";

import React, { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Page() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);

  const propertySlug = "test-apartment";
  const conversationId = "conv_" + propertySlug;

  async function sendMessage() {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setInput("");
    setSending(true);

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

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.reply ||
            "Sorry, I could not generate a reply right now.",
        },
      ]);
    } catch (err) {
      console.error("Fetch error:", err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black text-white rounded-[32px] p-8 mb-6 shadow-2xl">
          <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-4">
            AI CO-HOST TEST CHAT
          </div>

          <h1 className="text-4xl font-bold mb-3">
            AI Co-Host
          </h1>

          <p className="text-white/60">
            Property: <strong>{propertySlug}</strong>
          </p>
        </div>

        <div className="bg-white rounded-[32px] shadow-xl border border-black/5 p-6 min-h-[450px] mb-5">
          {messages.length === 0 && (
            <p className="text-gray-400">
              Start a conversation...
            </p>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`mb-5 ${
                msg.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block max-w-[85%] rounded-2xl px-5 py-4 ${
                  msg.role === "user"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-black"
                }`}
              >
                <div className="text-xs opacity-60 mb-2">
                  {msg.role === "user" ? "You" : "AI"}
                </div>

                <p className="leading-relaxed whitespace-pre-line">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}

          {sending && (
            <p className="text-gray-400">
              AI is typing...
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            placeholder="Ask something..."
            className="flex-1 border border-gray-200 rounded-2xl px-5 py-4 outline-none"
          />

          <button
            onClick={sendMessage}
            disabled={sending}
            className="bg-black text-white px-6 py-4 rounded-2xl font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}