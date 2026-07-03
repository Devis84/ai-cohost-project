"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

type Message = {
  id: string
  conversation_id?: string | null
  role?: string | null
  message?: string | null
  content?: string | null
  created_at?: string | null
  channel?: string | null
  priority?: string | null
  requires_host?: boolean | null
  issue_detected?: string | null
}

export default function ConversationDetailPage() {
  const params = useParams()
  const conversationId = params.id as string

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [conversation, setConversation] = useState<any>(null)

  useEffect(() => {
    async function loadMessages() {
      try {
        setLoading(true)
        const res = await fetch(
          `/api/conversations?conversation_id=${conversationId}`
        )
        const data = await res.json()

        if (data.conversation) {
          setConversation(data.conversation)
        }

        const messagesList = (data.messages || data.conversations || []) as Message[]
        setMessages(messagesList)
      } catch (err) {
        console.error("Failed to load conversation:", err)
      } finally {
        setLoading(false)
      }
    }

    if (conversationId) {
      loadMessages()
    }
  }, [conversationId])

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return "—"
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getChannelIcon = (channel?: string | null) => {
    switch (channel) {
      case "whatsapp":
        return "💬"
      case "telegram":
        return "📱"
      case "guest_portal":
        return "🌐"
      case "web":
        return "💻"
      default:
        return "💬"
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link 
          href="/dashboard/conversations"
          className="inline-flex items-center gap-2 mb-6 text-black hover:text-gray-700 transition"
        >
          <span>←</span>
          <span className="font-medium">Back to Conversations</span>
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white rounded-[24px] p-6 shadow-lg mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                {conversation?.guest_name || "Conversation"}
              </h1>
              <p className="text-white/60 text-sm">
                {getChannelIcon(conversation?.channel)}{" "}
                {conversation?.channel || "web"} •{" "}
                {conversation?.property_id || "Property"}
              </p>
              {conversation?.guest_contact && (
                <p className="text-white/60 text-sm mt-1">
                  {conversation.guest_contact}
                </p>
              )}
            </div>
            {conversation?.priority && (
              <div className="text-right">
                <p className="text-xs uppercase font-semibold text-white/70 mb-1">
                  Priority
                </p>
                <p className="text-lg font-bold capitalize">
                  {conversation.priority}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-[24px] shadow-lg border border-black/5 p-8 text-center">
            <div className="inline-block mb-4">
              <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin" />
            </div>
            <p className="text-gray-600">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-[24px] shadow-lg border border-black/5 p-8 text-center">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No messages yet
            </h3>
            <p className="text-gray-600">
              Messages will appear here as the conversation progresses.
            </p>
          </div>
        ) : (
          // Messages Thread
          <div className="space-y-4">
            {messages.map((message) => {
              const isGuest =
                message.role === "user" || message.role === "guest"
              const isAssistant = message.role === "assistant"

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isGuest ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-lg rounded-[20px] p-4 shadow-sm ${
                      isGuest
                        ? "bg-gray-100 text-gray-900"
                        : isAssistant
                          ? "bg-black text-white"
                          : "bg-blue-100 text-blue-900"
                    }`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-2">
                      {message.role || "unknown"}
                    </div>
                    <p className="text-sm leading-relaxed mb-2">
                      {message.message ||
                        message.content ||
                        "—"}
                    </p>
                    <div className="text-xs opacity-60">
                      {formatTime(message.created_at)}
                    </div>

                    {/* Message Metadata */}
                    {(message.requires_host ||
                      message.issue_detected) && (
                      <div className="mt-3 pt-3 border-t border-current/20 text-xs">
                        {message.requires_host && (
                          <div>⚠️ Flagged for host review</div>
                        )}
                        {message.issue_detected && (
                          <div>
                            🏷️ Issue: {message.issue_detected}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer Info */}
        {!loading && messages.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Showing {messages.length} message
              {messages.length !== 1 ? "s" : ""} •{" "}
              {formatTime(messages[messages.length - 1]?.created_at)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}