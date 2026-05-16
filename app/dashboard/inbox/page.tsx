 "use client"

import { useEffect, useState } from "react"

type InboxItem = {
  propertyId: string
  propertyName: string
  city: string
  lastMessage: string | null
  role: string | null
  created_at: string | null
  priority?: string | null
  requires_host?: boolean | null
  issue_detected?: string | null
}

type ConversationMessage = {
  id: string
  role: string
  message: string
  created_at: string
  priority?: string | null
  requires_host?: boolean | null
  issue_detected?: string | null
}

function PriorityBadge({
  priority,
  requiresHost,
  issue,
}: {
  priority?: string | null
  requiresHost?: boolean | null
  issue?: string | null
}) {
  if (!priority && !requiresHost && !issue) {
    return null
  }

  if (priority === "high") {
    return (
      <div className="inline-flex items-center rounded-2xl bg-red-100 text-red-700 px-3 py-1 text-xs font-semibold">
        🔴 High priority
      </div>
    )
  }

  if (priority === "medium" || requiresHost) {
    return (
      <div className="inline-flex items-center rounded-2xl bg-orange-100 text-orange-700 px-3 py-1 text-xs font-semibold">
        ⚠️ Requires host
      </div>
    )
  }

  if (issue) {
    return (
      <div className="inline-flex items-center rounded-2xl bg-yellow-100 text-yellow-700 px-3 py-1 text-xs font-semibold">
        Issue detected
      </div>
    )
  }

  return null
}

function formatIssue(issue?: string | null) {
  if (!issue) return ""

  return issue
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function InboxPage() {
  const [loading, setLoading] = useState(true)

  const [inbox, setInbox] = useState<InboxItem[]>([])

  const [messages, setMessages] = useState<
    ConversationMessage[]
  >([])

  const [selectedPropertyId, setSelectedPropertyId] =
    useState<string | null>(null)

  const [selectedPropertyName, setSelectedPropertyName] =
    useState("")

  async function fetchInbox() {
    try {
      setLoading(true)

      const res = await fetch(
        "/api/all-conversations"
      )

      const data = await res.json()

      if (data.success) {
        setInbox(data.inbox || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function openConversation(
    propertyId: string,
    propertyName: string
  ) {
    try {
      setSelectedPropertyId(propertyId)
      setSelectedPropertyName(propertyName)

      const res = await fetch(
        `/api/conversations?property_id=${propertyId}`
      )

      const data = await res.json()

      if (data.success) {
        setMessages(data.conversations || [])
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchInbox()
  }, [])

  const priorityCount = inbox.filter(
    (item) =>
      item.priority === "high" ||
      item.requires_host
  ).length

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">

      <div className="max-w-7xl mx-auto">

        {/* HERO */}

        <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white rounded-[32px] p-8 shadow-2xl mb-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            <div>

              <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-4">
                AI CO-HOST
              </div>

              <h1 className="text-4xl font-bold mb-4">
                Host Inbox
              </h1>

              <p className="text-white/60 max-w-2xl">
                Monitor guest conversations,
                review AI interactions and detect
                issues that may need host attention.
              </p>

            </div>

            <div className="grid grid-cols-2 gap-4 min-w-[320px]">

              <div className="bg-white/10 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">

                <div className="text-white/50 text-sm mb-2">
                  Conversations
                </div>

                <div className="text-4xl font-bold">
                  {inbox.length}
                </div>

              </div>

              <div className="bg-white/10 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">

                <div className="text-white/50 text-sm mb-2">
                  Needs Attention
                </div>

                <div className="text-4xl font-bold">
                  {priorityCount}
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* CONTENT */}

        <div className="grid lg:grid-cols-[400px_1fr] gap-6">

          {/* LEFT SIDEBAR */}

          <div className="bg-white rounded-[32px] shadow-xl border border-black/5 overflow-hidden">

            <div className="p-6 border-b border-gray-100 flex items-center justify-between">

              <h2 className="text-2xl font-bold">
                Conversations
              </h2>

              <button
                onClick={fetchInbox}
                className="bg-black text-white rounded-2xl px-4 py-2 text-sm font-semibold"
              >
                Refresh
              </button>

            </div>

            <div className="max-h-[700px] overflow-y-auto">

              {loading && (

                <div className="p-6 text-gray-500">
                  Loading inbox...
                </div>

              )}

              {!loading &&
                inbox.length === 0 && (

                  <div className="p-6 text-gray-500">
                    No conversations found
                  </div>

                )}

              {!loading &&
                inbox.map((item) => (

                  <button
                    key={item.propertyId}
                    onClick={() =>
                      openConversation(
                        item.propertyId,
                        item.propertyName
                      )
                    }
                    className={`w-full text-left p-5 border-b border-gray-100 hover:bg-gray-50 transition ${
                      selectedPropertyId ===
                      item.propertyId
                        ? "bg-black text-white"
                        : ""
                    }`}
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex-1">

                        <div className="font-bold text-lg mb-1">
                          {item.propertyName}
                        </div>

                        <div
                          className={`text-sm mb-3 ${
                            selectedPropertyId ===
                            item.propertyId
                              ? "text-white/60"
                              : "text-gray-500"
                          }`}
                        >
                          {item.city}
                        </div>

                        <div className="mb-3">
                          <PriorityBadge
                            priority={item.priority}
                            requiresHost={item.requires_host}
                            issue={item.issue_detected}
                          />
                        </div>

                        <div
                          className={`text-sm line-clamp-2 ${
                            selectedPropertyId ===
                            item.propertyId
                              ? "text-white/80"
                              : "text-gray-600"
                          }`}
                        >
                          {item.lastMessage ||
                            "No messages"}
                        </div>

                        {item.created_at && (
                          <div
                            className={`text-xs mt-3 ${
                              selectedPropertyId ===
                              item.propertyId
                                ? "text-white/40"
                                : "text-gray-400"
                            }`}
                          >
                            {new Date(
                              item.created_at
                            ).toLocaleString()}
                          </div>
                        )}

                      </div>

                    </div>

                  </button>

                ))}

            </div>

          </div>

          {/* RIGHT CHAT */}

          <div className="bg-white rounded-[32px] shadow-xl border border-black/5 flex flex-col min-h-[700px]">

            {/* HEADER */}

            <div className="border-b border-gray-100 p-6">

              <h2 className="text-2xl font-bold">
                {selectedPropertyName ||
                  "Select a conversation"}
              </h2>

            </div>

            {/* MESSAGES */}

            <div className="flex-1 p-6 overflow-y-auto space-y-5">

              {!selectedPropertyId && (

                <div className="h-full flex items-center justify-center text-gray-400">

                  Select a property conversation
                  from the inbox

                </div>

              )}

              {selectedPropertyId &&
                messages.length === 0 && (

                  <div className="text-gray-500">
                    No messages found
                  </div>

                )}

              {messages.map((message) => (

                <div
                  key={message.id}
                  className={`max-w-[75%] rounded-3xl px-5 py-4 ${
                    message.role === "user"
                      ? "bg-gray-100 mr-auto"
                      : "bg-black text-white ml-auto"
                  }`}
                >

                  <div className="flex items-center justify-between gap-3 mb-2">

                    <div className="text-xs opacity-60 uppercase tracking-wide">
                      {message.role === "user"
                        ? "Guest"
                        : "AI"}
                    </div>

                    <PriorityBadge
                      priority={message.priority}
                      requiresHost={message.requires_host}
                      issue={message.issue_detected}
                    />

                  </div>

                  {message.issue_detected && (
                    <div className="mb-3 text-xs rounded-2xl bg-red-50 text-red-700 px-3 py-2">
                      Issue: {formatIssue(message.issue_detected)}
                    </div>
                  )}

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

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}