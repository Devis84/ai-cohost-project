 "use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/supabase"

type NotificationFilter =
  | "all"
  | "unread"
  | "high"
  | "medium"
  | "issues"
  | "read"

type Notification = {
  id: string
  property_id?: string | null
  type?: string | null
  title?: string | null
  message?: string | null
  priority?: string | null
  read?: boolean
  created_at?: string | null
}

function formatLabel(value?: string | null) {
  if (!value) return "Notification"

  return value
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

function isHighPriority(notification: Notification) {
  return notification.priority === "high"
}

function isMediumPriority(notification: Notification) {
  return notification.priority === "medium"
}

function isIssueNotification(notification: Notification) {
  const text = [
    notification.type,
    notification.title,
    notification.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return (
    text.includes("issue") ||
    text.includes("complaint") ||
    text.includes("problem") ||
    text.includes("access") ||
    text.includes("lockbox") ||
    text.includes("wifi") ||
    text.includes("clean") ||
    text.includes("maintenance") ||
    text.includes("emergency") ||
    text.includes("sensitive")
  )
}

function getNotificationTone(notification: Notification) {
  const text = [
    notification.type,
    notification.title,
    notification.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  if (
    text.includes("emergency") ||
    text.includes("urgent") ||
    text.includes("safety")
  ) {
    return {
      icon: "🚨",
      label: "Emergency",
    }
  }

  if (
    text.includes("access") ||
    text.includes("lockbox") ||
    text.includes("code") ||
    text.includes("check-in") ||
    text.includes("checkin")
  ) {
    return {
      icon: "🔑",
      label: "Access",
    }
  }

  if (
    text.includes("wifi") ||
    text.includes("internet")
  ) {
    return {
      icon: "📶",
      label: "WiFi",
    }
  }

  if (
    text.includes("clean") ||
    text.includes("towel") ||
    text.includes("linen")
  ) {
    return {
      icon: "🧹",
      label: "Cleaning",
    }
  }

  if (
    text.includes("maintenance") ||
    text.includes("broken") ||
    text.includes("repair")
  ) {
    return {
      icon: "🛠️",
      label: "Maintenance",
    }
  }

  if (
    text.includes("conversation") ||
    text.includes("message") ||
    text.includes("guest")
  ) {
    return {
      icon: "💬",
      label: "Guest Message",
    }
  }

  return {
    icon: "🔔",
    label: "Alert",
  }
}

function PriorityBadge({
  priority,
}: {
  priority?: string | null
}) {
  if (priority === "high") {
    return (
      <div className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-bold">
        High priority
      </div>
    )
  }

  if (priority === "medium") {
    return (
      <div className="inline-flex items-center rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-xs font-bold">
        Medium
      </div>
    )
  }

  return (
    <div className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-xs font-bold">
      Normal
    </div>
  )
}

function FilterButton({
  label,
  value,
  activeFilter,
  count,
  onClick,
}: {
  label: string
  value: NotificationFilter
  activeFilter: NotificationFilter
  count: number
  onClick: (value: NotificationFilter) => void
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
      <span
        className={`ml-2 ${
          active ? "text-white/60" : "text-gray-400"
        }`}
      >
        {count}
      </span>
    </button>
  )
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] =
    useState<Notification[]>([])
  const [filter, setFilter] =
    useState<NotificationFilter>("all")
  const [search, setSearch] = useState("")
  const [markingId, setMarkingId] = useState("")

  async function fetchNotifications() {
    try {
      setLoading(true)

      const res = await fetch("/api/notifications")
      const data = await res.json()

      if (data.success) {
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("FETCH NOTIFICATIONS ERROR:", error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: string) {
    try {
      setMarkingId(id)

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          read: true,
        }),
      })

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                read: true,
              }
            : notification
        )
      )
    } catch (error) {
      console.error("MARK NOTIFICATION READ ERROR:", error)
    } finally {
      setMarkingId("")
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        async () => {
          await fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (notification) => !notification.read
    ).length
  }, [notifications])

  const readCount = useMemo(() => {
    return notifications.filter(
      (notification) => notification.read
    ).length
  }, [notifications])

  const highPriorityCount = useMemo(() => {
    return notifications.filter((notification) =>
      isHighPriority(notification)
    ).length
  }, [notifications])

  const mediumPriorityCount = useMemo(() => {
    return notifications.filter((notification) =>
      isMediumPriority(notification)
    ).length
  }, [notifications])

  const issueCount = useMemo(() => {
    return notifications.filter((notification) =>
      isIssueNotification(notification)
    ).length
  }, [notifications])

  const filteredNotifications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return notifications.filter((notification) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !notification.read) ||
        (filter === "read" && notification.read) ||
        (filter === "high" && isHighPriority(notification)) ||
        (filter === "medium" && isMediumPriority(notification)) ||
        (filter === "issues" &&
          isIssueNotification(notification))

      if (!matchesFilter) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const searchableText = [
        notification.type,
        notification.title,
        notification.message,
        notification.priority,
        notification.property_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(normalizedSearch)
    })
  }, [notifications, filter, search])

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-5 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white rounded-[32px] p-7 md:p-8 shadow-2xl mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-4">
                AI CO-HOST ALERTS
              </div>

              <h1 className="text-4xl font-bold mb-4">
                Notifications Center
              </h1>

              <p className="text-white/60 max-w-2xl leading-relaxed">
                Monitor guest alerts, AI escalations, operational notifications and host attention items across all properties.
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href="/dashboard"
                  className="bg-white text-black rounded-2xl px-5 py-3 text-sm font-semibold"
                >
                  Back to Dashboard
                </Link>

                <Link
                  href="/dashboard/inbox"
                  className="bg-white/10 border border-white/10 text-white rounded-2xl px-5 py-3 text-sm font-semibold hover:bg-white/15 transition"
                >
                  Inbox
                </Link>

                <Link
                  href="/dashboard/issues"
                  className="bg-white/10 border border-white/10 text-white rounded-2xl px-5 py-3 text-sm font-semibold hover:bg-white/15 transition"
                >
                  Issues
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:min-w-[640px]">
              <div className="bg-white/10 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
                <div className="text-white/50 text-sm mb-2">
                  Total
                </div>

                <div className="text-4xl font-bold">
                  {notifications.length}
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
                  High Priority
                </div>

                <div className="text-4xl font-bold">
                  {highPriorityCount}
                </div>
              </div>

              <div className="bg-white/10 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
                <div className="text-white/50 text-sm mb-2">
                  Issues
                </div>

                <div className="text-4xl font-bold">
                  {issueCount}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-black/5 shadow-xl p-5 md:p-6 mb-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search notifications, issue type, property id or message..."
              className="w-full xl:max-w-md bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black"
            />

            <div className="flex flex-wrap gap-2">
              <FilterButton
                label="All"
                value="all"
                activeFilter={filter}
                count={notifications.length}
                onClick={setFilter}
              />

              <FilterButton
                label="Unread"
                value="unread"
                activeFilter={filter}
                count={unreadCount}
                onClick={setFilter}
              />

              <FilterButton
                label="High"
                value="high"
                activeFilter={filter}
                count={highPriorityCount}
                onClick={setFilter}
              />

              <FilterButton
                label="Medium"
                value="medium"
                activeFilter={filter}
                count={mediumPriorityCount}
                onClick={setFilter}
              />

              <FilterButton
                label="Issues"
                value="issues"
                activeFilter={filter}
                count={issueCount}
                onClick={setFilter}
              />

              <FilterButton
                label="Read"
                value="read"
                activeFilter={filter}
                count={readCount}
                onClick={setFilter}
              />

              <button
                onClick={fetchNotifications}
                className="bg-black text-white px-5 py-3 rounded-2xl text-sm font-bold"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {loading && (
            <div className="bg-white rounded-[32px] p-8 shadow-xl border border-black/5 text-gray-500">
              Loading notifications...
            </div>
          )}

          {!loading && filteredNotifications.length === 0 && (
            <div className="bg-white rounded-[32px] p-10 shadow-xl border border-black/5 text-center">
              <div className="text-5xl mb-5">✅</div>

              <h2 className="text-2xl font-black text-gray-900 mb-3">
                No notifications in this view
              </h2>

              <p className="text-gray-500 max-w-xl mx-auto">
                There are no notifications matching the selected filter or search.
              </p>
            </div>
          )}

          {!loading &&
            filteredNotifications.map((notification) => {
              const tone = getNotificationTone(notification)

              return (
                <div
                  key={notification.id}
                  className={`rounded-[32px] p-7 shadow-xl border ${
                    notification.read
                      ? "bg-white border-black/5"
                      : "bg-blue-50 border-blue-100"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="text-3xl mr-1">
                          {tone.icon}
                        </div>

                        <PriorityBadge priority={notification.priority} />

                        {!notification.read && (
                          <div className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-bold">
                            New
                          </div>
                        )}

                        {notification.read && (
                          <div className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-bold">
                            Read
                          </div>
                        )}

                        <div className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-xs font-bold">
                          {formatLabel(notification.type || tone.label)}
                        </div>
                      </div>

                      <div className="uppercase tracking-[0.25em] text-[10px] text-gray-400 font-semibold mb-2">
                        {tone.label}
                      </div>

                      <h2 className="text-2xl font-black mb-3 text-gray-900">
                        {notification.title || "Notification"}
                      </h2>

                      <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-4">
                        {notification.message || "No message provided"}
                      </p>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        {notification.property_id && (
                          <div className="break-all">
                            Property: {notification.property_id}
                          </div>
                        )}

                        {notification.created_at && (
                          <div>
                            Created: {formatDate(notification.created_at)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[180px]">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          disabled={markingId === notification.id}
                          className="bg-black text-white rounded-2xl px-5 py-3 font-semibold hover:opacity-90 transition disabled:opacity-50"
                        >
                          {markingId === notification.id
                            ? "Marking..."
                            : "Mark as Read"}
                        </button>
                      )}

                      <Link
                        href="/dashboard/inbox"
                        className="bg-gray-100 text-black text-center rounded-2xl px-5 py-3 font-semibold hover:bg-gray-200 transition"
                      >
                        Open Inbox
                      </Link>

                      <Link
                        href="/dashboard/issues"
                        className="bg-gray-100 text-black text-center rounded-2xl px-5 py-3 font-semibold hover:bg-gray-200 transition"
                      >
                        Open Issues
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}