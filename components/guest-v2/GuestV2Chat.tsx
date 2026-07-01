"use client";

import { useMemo, useState } from "react";

type ChatMessage = {
  id: string;
  role: "guest" | "assistant";
  content: string;
};

type GuestV2ChatProps = {
  token: string;
  propertyName: string;
  guestName: string;
};

export function GuestV2Chat({
  token,
  propertyName,
  guestName,
}: GuestV2ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi ${guestName || "there"} 👋 I’m your AI Concierge for ${propertyName}. Ask me anything about your stay.`,
    },
  ]);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const canSend = useMemo(() => {
    return input.trim().length > 0 && !isSending;
  }, [input, isSending]);

  async function sendMessage() {
    const message = input.trim();

    if (!message || isSending) {
      return;
    }

    const guestMessage: ChatMessage = {
      id: `guest-${Date.now()}`,
      role: "guest",
      content: message,
    };

    setMessages((current) => [...current, guestMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/guest-v2-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          message,
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          data?.reply ||
          data?.error ||
          "Sorry, I could not generate a reply right now. Please try again or contact the host.",
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            "Sorry, something went wrong. Please try again or contact the host.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-9rem)] flex-col">
      <div className="flex-1 space-y-3 pb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "guest" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[82%] rounded-[1.5rem] px-4 py-3 text-sm leading-6 shadow-sm ${
                message.role === "guest"
                  ? "bg-black text-white"
                  : "bg-white text-black ring-1 ring-black/5"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isSending ? (
          <div className="flex justify-start">
            <div className="rounded-[1.5rem] bg-white px-4 py-3 text-sm font-medium text-black/50 shadow-sm ring-1 ring-black/5">
              AI Concierge is typing…
            </div>
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 border-t border-black/5 bg-[#f6f1e8]/95 pb-4 pt-3 backdrop-blur">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Ask about Wi-Fi, checkout, food, transport..."
            className="min-h-12 flex-1 resize-none rounded-[1.5rem] border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          />

          <button
            type="button"
            disabled={!canSend}
            onClick={() => void sendMessage()}
            className="h-12 rounded-full bg-black px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}