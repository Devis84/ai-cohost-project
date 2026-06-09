 "use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase/supabase"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { DashboardHeader } from "@/components/organisms/DashboardHeader"
import { SmartAlert } from "@/components/ui/SmartAlert"

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
      <Badge color="error" size="sm">
        High priority
      </Badge>
    )
  }

  if (requiresHost || priority === "medium") {
    return (
      <Badge color="warning" size="sm">
        Needs host
      </Badge>
    )
  }

  if (issue) {
    return (
      <Badge color="warning" size="sm">
        Issue
      </Badge>
    )
  }

  return (
    <Badge color="neutral" size="sm">
      Normal
    </Badge>
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
    <div className="min-h-screen bg-background p-5 md:p-6">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader
          eyebrow="AI CO-HOST"
          title="Host Inbox"
          description="Monitor guest conversations, review AI interactions and detect issues that may need host attention."
          stats={[
            { label: "Properties", value: String(inbox.length) },
            { label: "Unread", value: String(unreadCount) },
            { label: "Needs Attention", value: String(priorityCount) },
          ]}
          className="mb-8"
        />

        <div className="grid lg:grid-cols-[420px_1fr] gap-6">
          <Card variant="white" padding="p-0" border className="overflow-hidden">
            <div className="p-6 border-b border-outline/20 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-on-surface">
                Conversations
              </h2>

              <Button variant="primary" size="sm" onClick={fetchInbox}>
                Refresh
              </Button>
            </div>

            <div className="max-h-[760px] overflow-y-auto">
              {loading && (
                <div className="p-6 text-outline">
                  Loading inbox...
                </div>
              )}

              {!loading && inbox.length === 0 && (
                <div className="p-6 text-outline">
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
                      className={`w-full text-left p-5 border-b border-outline/20 transition ${
                        isSelected
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-low"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="font-bold text-lg leading-snug">
                              {item.propertyName}
                            </div>

                            {(item.unread_count || 0) > 0 && (
                              <div className="min-w-[28px] h-7 rounded-full bg-error text-on-error text-xs font-bold flex items-center justify-center px-2">
                                {item.unread_count}
                              </div>
                            )}
                          </div>

                          <div
                            className={`text-sm mb-3 ${
                              isSelected
                                ? "text-on-primary/60"
                                : "text-outline"
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
                                ? "text-on-primary/85"
                                : "text-on-surface"
                            }`}
                          >
                            {item.lastMessage || "No messages"}
                          </div>

                          <div
                            className={`text-xs mt-3 ${
                              isSelected
                                ? "text-on-primary/40"
                                : "text-outline"
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
                                  ? "text-on-primary/40"
                                  : "text-outline"
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
          </Card>

          <Card variant="white" padding="p-0" border className="flex flex-col min-h-[760px] overflow-hidden">
            <div className="border-b border-outline/20 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface">
                    {selectedPropertyName || "Select a conversation"}
                  </h2>

                  {selectedConversationId && (
                    <div className="text-xs text-outline mt-2 break-all">
                      Conversation: {selectedConversationId}
                    </div>
                  )}
                </div>

                {selectedPropertyId && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      fetchConversation({
                        propertyId: selectedPropertyId,
                        conversationId: selectedConversationId,
                      })
                    }
                  >
                    Refresh
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-5">
              {!selectedPropertyId && (
                <div className="h-full flex items-center justify-center text-outline text-center">
                  Select a property conversation from the inbox.
                </div>
              )}

              {selectedPropertyId && loadingMessages && (
                <div className="text-outline">
                  Loading messages...
                </div>
              )}

              {selectedPropertyId && !loadingMessages && messages.length === 0 && (
                <div className="text-outline">
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
                        ? "bg-surface-container text-on-surface mr-auto"
                        : "bg-accent text-on-accent ml-auto"
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
                      <div className="mb-3">
                        <SmartAlert
                          message={`Issue: ${formatIssue(message.issue_detected)}`}
                        />
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
          </Card>
        </div>
      </div>
    </div>
  )
}
