 "use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase/supabase"

type InboxItem = {
  propertyId: string
  propertyName: string
  city?: string | null
  conversationId?: string | null
  conversation_id?: string | null
  lastMessage?: string | null
  role?: string | null
  created_at?: string | null
  priority?: string | null
  requires_host?: boolean | null
  issue_detected?: string | null
  unread_count?: number | null
  conversation_count?: number | null
  message_count?: number | null
  status?: string | null
}

type ConversationMessage = {
  id: string
  conversation_id?: string | null
  property_id?: string | null
  role?: string | null
  message?: string | null
  content?: string | null
  created_at?: string | null
  priority?: string | null
  requires_host?: boolean | null
  issue_detected?: string | null
}

function formatIssue(issue?: string | null) {
  if (!issue) return ""

  return issue
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatDate(value?: string | null) {
  if (!value) return ""

  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function getMessageText(message: ConversationMessage) {
  return message.content || message.message || ""
}

function getRoleLabel(role?: string | null) {
  if (role === "assistant" || role === "ai") {
    return "AI"
  }

  if (role === "host") {
    return "Host"
  }

  return "Guest"
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
  if (priority === "high") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-bold">
        High priority
      </span>
    )
  }

  if (requiresHost || priority === "medium") {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-xs font-bold">
        Needs host
      </span>
    )
  }

  if (issue) {
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-700 px-3 py-1 text-xs font-bold">
        Issue
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs font-bold">
      Normal
    </span>
  )
}

export default function InboxPage() {
  const [loading, setLoading] = useState(true)
  const [inbox, setInbox] = useState<InboxItem[]>([])
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [selectedPropertyName, setSelectedPropertyName] = useState("")
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [loadingMessages, setLoadingMessages] = useState(false)

  const unreadCount = useMemo(() => {
    return inbox.reduce((total, item) => {
      return total + (item.unread_count || 0)
    }, 0)
  }, [inbox])

  const priorityCount = useMemo(() => {
    return inbox.filter((item) => {
      return item.priority === "high" || item.requires_host
    }).length
  }, [inbox])

  async function fetchInbox() {
    try {
      setLoading(true)

      const res = await fetch("/api/all-conversations")
      const data = await res.json()

      if (data.success) {
        setInbox(data.inbox || [])
      }
    } catch (error) {
      console.error("FETCH INBOX ERROR:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchConversation({
    propertyId,
    conversationId,
  }: {
    propertyId: string
    conversationId?: string | null
  }) {
    try {
      setLoadingMessages(true)

      const params = new URLSearchParams()

      if (conversationId) {
        params.set("conversation_id", conversationId)
      } else {
        params.set("property_id", propertyId)
      }

      const res = await fetch(`/api/conversations?${params.toString()}`)
      const data = await res.json()

      if (!data.success) {
        setMessages([])
        return
      }

      if (Array.isArray(data.messages)) {
        setMessages(data.messages)
        return
      }

      if (Array.isArray(data.conversations)) {
        setMessages(data.conversations)
        return
      }

      setMessages([])
    } catch (error) {
      console.error("FETCH CONVERSATION ERROR:", error)
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  async function markConversationAsRead(conversationId?: string | null) {
    if (!conversationId) return

    try {
      await fetch("/api/conversations/read", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: conversationId,
        }),
      })

      setInbox((current) =>
        current.map((item) => {
          const itemConversationId =
            item.conversationId || item.conversation_id

          if (itemConversationId === conversationId) {
            return {
              ...item,
              unread_count: 0,
            }
          }

          return item
        })
      )
    } catch (error) {
      console.error("MARK READ ERROR:", error)
    }
  }

  async function openConversation(item: InboxItem) {
    const conversationId =
      item.conversationId || item.conversation_id || null

    setSelectedPropertyId(item.propertyId)
    setSelectedPropertyName(item.propertyName)
    setSelectedConversationId(conversationId)

    await markConversationAsRead(conversationId)

    await fetchConversation({
      propertyId: item.propertyId,
      conversationId,
    })
  }

  useEffect(() => {
    fetchInbox()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel("inbox-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        async () => {
          await fetchInbox()

          if (selectedPropertyId) {
            await fetchConversation({
              propertyId: selectedPropertyId,
              conversationId: selectedConversationId,
            })
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        async () => {
          await fetchInbox()

          if (selectedPropertyId) {
            await fetchConversation({
              propertyId: selectedPropertyId,
              conversationId: selectedConversationId,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedPropertyId, selectedConversationId])

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-5 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white rounded-[32px] p-7 md:p-8 shadow-2xl mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-4">
                AI CO-HOST
              </div>

              <h1 className="text-4xl font-bold mb-4">
                Host Inbox
              </h1>

              <p className="text-white/60 max-w-2xl leading-relaxed">
                Monitor guest conversations, review AI interactions and detect issues that may need host attention.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 lg:min-w-[480px]">
              <div className="bg-white/10 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
                <div className="text-white/50 text-sm mb-2">
                  Properties
                </div>

                <div className="text-4xl font-bold">
                  {inbox.length}
                </div>
              </div>

              <div className="bg-white/10 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
                <div className="text-white/50 text-sm mb-2">
                  Unread
                </div>

                <div className="text-4xl font-bold">
                  {unreadCount}
                </div>
              </div>

              <div className="bg-white/10 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
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

        <div className="grid lg:grid-cols-[420px_1fr] gap-6">
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

            <div className="max-h-[760px] overflow-y-auto">
              {loading && (
                <div className="p-6 text-gray-500">
                  Loading inbox...
                </div>
              )}

              {!loading && inbox.length === 0 && (
                <div className="p-6 text-gray-500">
                  No conversations found
                </div>
              )}

              {!loading &&
                inbox.map((item) => {
                  const conversationId =
                    item.conversationId || item.conversation_id

                  const isSelected =
                    selectedPropertyId === item.propertyId

                  return (
                    <button
                      key={item.propertyId}
                      onClick={() => openConversation(item)}
                      className={`w-full text-left p-5 border-b border-gray-100 transition ${
                        isSelected
                          ? "bg-black text-white"
                          : "bg-white text-gray-950 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="font-bold text-lg leading-snug">
                              {item.propertyName}
                            </div>

                            {(item.unread_count || 0) > 0 && (
                              <div className="min-w-[28px] h-7 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-2">
                                {item.unread_count}
                              </div>
                            )}
                          </div>

                          <div
                            className={`text-sm mb-3 ${
                              isSelected
                                ? "text-white/60"
                                : "text-gray-500"
                            }`}
                          >
                            {item.city || "No city"}
                          </div>

                          <div className="mb-3">
                            <PriorityBadge
                              priority={item.priority}
                              requiresHost={item.requires_host}
                              issue={item.issue_detected}
                            />
                          </div>

                          <div
                            className={`text-sm line-clamp-3 leading-relaxed ${
                              isSelected
                                ? "text-white/85"
                                : "text-gray-700"
                            }`}
                          >
                            {item.lastMessage || "No messages"}
                          </div>

                          <div
                            className={`text-xs mt-3 ${
                              isSelected
                                ? "text-white/40"
                                : "text-gray-400"
                            }`}
                          >
                            {conversationId
                              ? `${item.message_count || 0} messages`
                              : "No active conversation"}
                          </div>

                          {item.created_at && (
                            <div
                              className={`text-xs mt-1 ${
                                isSelected
                                  ? "text-white/40"
                                  : "text-gray-400"
                              }`}
                            >
                              {formatDate(item.created_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
            </div>
          </div>

          <div className="bg-white rounded-[32px] shadow-xl border border-black/5 flex flex-col min-h-[760px] overflow-hidden">
            <div className="border-b border-gray-100 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedPropertyName || "Select a conversation"}
                  </h2>

                  {selectedConversationId && (
                    <div className="text-xs text-gray-400 mt-2 break-all">
                      Conversation: {selectedConversationId}
                    </div>
                  )}
                </div>

                {selectedPropertyId && (
                  <button
                    onClick={() =>
                      fetchConversation({
                        propertyId: selectedPropertyId,
                        conversationId: selectedConversationId,
                      })
                    }
                    className="bg-gray-100 text-black rounded-2xl px-4 py-2 text-sm font-semibold hover:bg-gray-200 transition"
                  >
                    Refresh
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-5">
              {!selectedPropertyId && (
                <div className="h-full flex items-center justify-center text-gray-400 text-center">
                  Select a property conversation from the inbox.
                </div>
              )}

              {selectedPropertyId && loadingMessages && (
                <div className="text-gray-500">
                  Loading messages...
                </div>
              )}

              {selectedPropertyId && !loadingMessages && messages.length === 0 && (
                <div className="text-gray-500">
                  No messages found.
                </div>
              )}

              {messages.map((message) => {
                const isGuest =
                  message.role === "user" ||
                  message.role === "guest"

                return (
                  <div
                    key={message.id}
                    className={`max-w-[78%] rounded-3xl px-5 py-4 ${
                      isGuest
                        ? "bg-gray-100 text-gray-950 mr-auto"
                        : "bg-black text-white ml-auto"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <div className="text-xs opacity-60 uppercase tracking-wide">
                        {getRoleLabel(message.role)}
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
                      {getMessageText(message)}
                    </div>

                    {message.created_at && (
                      <div className="text-[11px] opacity-50 mt-3">
                        {formatDate(message.created_at)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}