 "use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/supabase"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { DashboardHeader } from "@/components/organisms/DashboardHeader"
import { SmartAlert } from "@/components/ui/SmartAlert"

type InboxFilter = "all" | "attention" | "unread" | "issues"

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

function getConversationId(item: InboxItem) {
  return item.conversationId || item.conversation_id || null
}

function getInboxKey(item: InboxItem) {
  return `${item.propertyId}-${getConversationId(item) || "property"}`
}

function isAttentionItem(item: InboxItem) {
  return (
    item.priority === "high" ||
    item.priority === "medium" ||
    item.requires_host === true
  )
}

function isIssueItem(item: InboxItem) {
  return Boolean(item.issue_detected)
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

function FilterButton({
  label,
  value,
  activeFilter,
  onClick,
  count,
}: {
  label: string
  value: InboxFilter
  activeFilter: InboxFilter
  onClick: (value: InboxFilter) => void
  count?: number
}) {
  const active = value === activeFilter

  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
        active
          ? "bg-black text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
      {typeof count === "number" && (
        <span
          className={`ml-2 ${
            active ? "text-white/60" : "text-gray-400"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

export default function InboxPage() {
  const [loading, setLoading] = useState(true)
  const [inbox, setInbox] = useState<InboxItem[]>([])
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [selectedPropertyId, setSelectedPropertyId] =
    useState<string | null>(null)
  const [selectedPropertyName, setSelectedPropertyName] =
    useState("")
  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>(null)
  const [selectedItem, setSelectedItem] =
    useState<InboxItem | null>(null)
  const [loadingMessages, setLoadingMessages] =
    useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] =
    useState<InboxFilter>("all")

  const unreadCount = useMemo(() => {
    return inbox.reduce((total, item) => {
      return total + (item.unread_count || 0)
    }, 0)
  }, [inbox])

  const priorityCount = useMemo(() => {
    return inbox.filter((item) => isAttentionItem(item)).length
  }, [inbox])

  const issueCount = useMemo(() => {
    return inbox.filter((item) => isIssueItem(item)).length
  }, [inbox])

  const totalMessageCount = useMemo(() => {
    return inbox.reduce((total, item) => {
      return total + (item.message_count || 0)
    }, 0)
  }, [inbox])

  const filteredInbox = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return inbox.filter((item) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "attention" && isAttentionItem(item)) ||
        (filter === "unread" && (item.unread_count || 0) > 0) ||
        (filter === "issues" && isIssueItem(item))

      if (!matchesFilter) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const searchableText = [
        item.propertyName,
        item.city,
        item.lastMessage,
        item.issue_detected,
        item.priority,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(normalizedSearch)
    })
  }, [inbox, filter, search])

  const selectedConversationMessages = useMemo(() => {
    const guestMessages = messages.filter((message) => {
      return (
        message.role === "user" ||
        message.role === "guest" ||
        !message.role
      )
    })

    const aiMessages = messages.filter((message) => {
      return (
        message.role === "assistant" ||
        message.role === "ai"
      )
    })

    const issueMessages = messages.filter((message) => {
      return (
        message.issue_detected ||
        message.requires_host ||
        message.priority === "high" ||
        message.priority === "medium"
      )
    })

    return {
      guestMessages: guestMessages.length,
      aiMessages: aiMessages.length,
      issueMessages: issueMessages.length,
    }
  }, [messages])

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

  async function markConversationAsRead(
    conversationId?: string | null
  ) {
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
          const itemConversationId = getConversationId(item)

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
    const conversationId = getConversationId(item)

    setSelectedPropertyId(item.propertyId)
    setSelectedPropertyName(item.propertyName)
    setSelectedConversationId(conversationId)
    setSelectedItem(item)

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
          title="Guest Inbox"
          description="Monitor guest conversations, review AI interactions, detect issues and keep control when a guest needs human attention."
          stats={[
            { label: "Threads", value: String(inbox.length) },
            { label: "Messages", value: String(totalMessageCount) },
            { label: "Unread", value: String(unreadCount) },
            { label: "Attention", value: String(priorityCount) },
          ]}
          className="mb-8"
        />

        <div className="flex flex-wrap gap-3 mb-6">
          <Link
            href="/dashboard"
            className="bg-white text-black rounded-2xl px-5 py-3 text-sm font-semibold border border-outline/20 hover:bg-surface-container transition"
          >
            Back to Dashboard
          </Link>

          <Link
            href="/dashboard/issues"
            className="bg-surface-container border border-outline/20 text-on-surface rounded-2xl px-5 py-3 text-sm font-semibold hover:bg-surface-container-low transition"
          >
            Issues
          </Link>

          <Link
            href="/dashboard/qr"
            className="bg-surface-container border border-outline/20 text-on-surface rounded-2xl px-5 py-3 text-sm font-semibold hover:bg-surface-container-low transition"
          >
            QR/NFC
          </Link>
        </div>

        <div className="grid lg:grid-cols-[420px_1fr] gap-6">
          <Card variant="white" padding="p-0" border className="overflow-hidden">
            <div className="p-6 border-b border-outline/20">
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="text-2xl font-bold text-on-surface">
                  Conversations
                </h2>

                <Button variant="secondary" size="sm" onClick={fetchInbox}>
                  Refresh
                </Button>
              </div>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search property, issue or message..."
                className="w-full bg-surface-container border border-outline/20 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary mb-4"
              />

              <div className="grid grid-cols-2 gap-2">
                <FilterButton
                  label="All"
                  value="all"
                  activeFilter={filter}
                  onClick={setFilter}
                  count={inbox.length}
                />

                <FilterButton
                  label="Attention"
                  value="attention"
                  activeFilter={filter}
                  onClick={setFilter}
                  count={priorityCount}
                />

                <FilterButton
                  label="Unread"
                  value="unread"
                  activeFilter={filter}
                  onClick={setFilter}
                  count={unreadCount}
                />

                <FilterButton
                  label="Issues"
                  value="issues"
                  activeFilter={filter}
                  onClick={setFilter}
                  count={issueCount}
                />
              </div>
            </div>

            <div className="max-h-[760px] overflow-y-auto">
              {loading && (
                <div className="p-6 text-outline">
                  Loading inbox...
                </div>
              )}

              {!loading && filteredInbox.length === 0 && (
                <div className="p-6 text-outline">
                  No conversations match this view.
                </div>
              )}

              {!loading &&
                filteredInbox.map((item) => {
                  const conversationId = getConversationId(item)

                  const isSelected =
                    selectedPropertyId === item.propertyId &&
                    selectedConversationId === conversationId

                  return (
                    <button
                      key={getInboxKey(item)}
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

                          <div className="flex flex-wrap gap-2 mb-3">
                            <PriorityBadge
                              priority={item.priority}
                              requiresHost={item.requires_host}
                              issue={item.issue_detected}
                            />

                            {item.issue_detected && (
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                                  isSelected
                                    ? "bg-white/10 text-white"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {formatIssue(item.issue_detected)}
                              </span>
                            )}
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
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div>
                  <div className="uppercase tracking-[0.25em] text-xs text-outline mb-3">
                    Selected conversation
                  </div>

                  <h2 className="text-2xl font-bold text-on-surface">
                    {selectedPropertyName || "Select a conversation"}
                  </h2>

                  {selectedConversationId && (
                    <div className="text-xs text-outline mt-2 break-all">
                      Conversation: {selectedConversationId}
                    </div>
                  )}

                  {selectedItem?.issue_detected && (
                    <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                      Issue detected:{" "}
                      <strong>
                        {formatIssue(selectedItem.issue_detected)}
                      </strong>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
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

                  {selectedConversationId && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        markConversationAsRead(selectedConversationId)
                      }
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              </div>

              {selectedPropertyId && (
                <div className="grid md:grid-cols-3 gap-3 mt-6">
                  <div className="bg-gray-50 border border-gray-100 rounded-3xl p-4">
                    <div className="text-xs text-gray-400 mb-1">
                      Guest messages
                    </div>
                    <div className="text-2xl font-black">
                      {selectedConversationMessages.guestMessages}
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-3xl p-4">
                    <div className="text-xs text-gray-400 mb-1">
                      AI replies
                    </div>
                    <div className="text-2xl font-black">
                      {selectedConversationMessages.aiMessages}
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-3xl p-4">
                    <div className="text-xs text-gray-400 mb-1">
                      Issue signals
                    </div>
                    <div className="text-2xl font-black">
                      {selectedConversationMessages.issueMessages}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-5">
              {!selectedPropertyId && (
                <div className="h-full flex items-center justify-center text-outline text-center">
                  <div>
                    <div className="text-4xl mb-4">💬</div>
                    <div className="font-bold text-on-surface mb-2">
                      Select a conversation
                    </div>
                    <div>
                      Choose a property thread from the inbox to review guest messages and AI replies.
                    </div>
                  </div>
                </div>
              )}

              {selectedPropertyId && loadingMessages && (
                <div className="text-outline">
                  Loading messages...
                </div>
              )}

              {selectedPropertyId &&
                !loadingMessages &&
                messages.length === 0 && (
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
                    className={`max-w-[86%] rounded-3xl px-5 py-4 shadow-sm ${
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
                      {getMessageText(message) || "No message content"}
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
