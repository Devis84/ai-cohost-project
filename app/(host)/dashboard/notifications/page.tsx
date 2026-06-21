 "use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/supabase"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { DashboardHeader } from "@/components/organisms/DashboardHeader"
import { NotificationSettings } from "@/components/organisms/NotificationSettings"

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
      <Badge color="error" size="sm">
        High priority
      </Badge>
    )
  }

  if (priority === "medium") {
    return (
      <Badge color="warning" size="sm">
        Medium
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
          ? "bg-primary text-on-primary"
          : "bg-surface-container-lowest text-on-surface border border-outline/20 hover:bg-surface-container-low"
      }`}
    >
      {label}
      <span
        className={`ml-2 ${
          active ? "text-on-primary/60" : "text-outline"
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader
          eyebrow="AI CO-HOST"
          title="Notifications Center"
          description="Monitor AI alerts, guest complaints, escalations and operational notifications across all properties."
          stats={[
            { label: "Total", value: String(notifications.length) },
            { label: "Unread", value: String(unreadCount) },
            { label: "High Priority", value: String(highPriorityCount) },
            { label: "Issues", value: String(issueCount) },
          ]}
          className="mb-8"
        />

        <div className="flex flex-wrap gap-3 mb-6">
          <Link
            href="/dashboard"
            className="bg-primary text-on-primary rounded-2xl px-5 py-3 text-sm font-semibold"
          >
            Back to Dashboard
          </Link>

          <Link
            href="/dashboard/inbox"
            className="bg-surface-container-high text-on-surface rounded-2xl px-5 py-3 text-sm font-semibold hover:bg-surface-container-low transition"
          >
            Inbox
          </Link>

          <Link
            href="/dashboard/issues"
            className="bg-surface-container-high text-on-surface rounded-2xl px-5 py-3 text-sm font-semibold hover:bg-surface-container-low transition"
          >
            Issues
          </Link>
        </div>

        <div className="mb-8">
          <NotificationSettings />
        </div>

        <Card variant="white" border padding="p-5 md:p-6" className="mb-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search notifications, issue type, property id or message..."
              className="w-full xl:max-w-md bg-surface border border-outline/20 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-accent"
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
                className="bg-primary text-on-primary px-5 py-3 rounded-2xl text-sm font-bold"
              >
                Refresh
              </button>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          {loading && (
            <Card variant="white" border padding="p-8">
              <span className="text-outline">Loading notifications...</span>
            </Card>
          )}

          {!loading && filteredNotifications.length === 0 && (
            <Card variant="white" border padding="p-10" className="text-center">
              <span className="text-outline">No notifications found</span>
            </Card>
          )}

          {!loading &&
            filteredNotifications.map((notification) => {
              const tone = getNotificationTone(notification)

              return (
                <div
                  key={notification.id}
                  className={`rounded-[32px] p-7 shadow-xl border ${
                    notification.read
                      ? "bg-surface-container-lowest border-outline/20"
                      : "bg-accent/5 border-accent/20"
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
                          <Badge color="default" size="sm">
                            New
                          </Badge>
                        )}

                        {notification.read && (
                          <Badge color="success" size="sm">
                            Read
                          </Badge>
                        )}

                        <Badge color="neutral" size="sm">
                          {formatLabel(notification.type || tone.label)}
                        </Badge>
                      </div>

                      <div className="uppercase tracking-[0.25em] text-[10px] text-outline font-semibold mb-2">
                        {tone.label}
                      </div>

                      <h2 className="text-2xl font-bold text-on-surface mb-3">
                        {notification.title || "Notification"}
                      </h2>

                      <p className="text-on-surface leading-relaxed whitespace-pre-line mb-4">
                        {notification.message || "No message provided"}
                      </p>

                      <div className="flex flex-wrap gap-3 text-xs text-outline">
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
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => markAsRead(notification.id)}
                          disabled={markingId === notification.id}
                        >
                          {markingId === notification.id
                            ? "Marking..."
                            : "Mark as Read"}
                        </Button>
                      )}

                      <Link
                        href="/dashboard/inbox"
                        className="bg-surface-container-high text-on-surface text-center rounded-2xl px-5 py-3 font-semibold hover:bg-surface-container-low transition"
                      >
                        Open Inbox
                      </Link>

                      <Link
                        href="/dashboard/issues"
                        className="bg-surface-container-high text-on-surface text-center rounded-2xl px-5 py-3 font-semibold hover:bg-surface-container-low transition"
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
