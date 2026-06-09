 "use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase/supabase"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { DashboardHeader } from "@/components/organisms/DashboardHeader"

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

function PriorityBadge({
  priority,
}: {
  priority?: string | null
}) {
  if (priority === "high") {
    return (
      <Badge color="error" size="sm">
        High
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

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState("all")

  async function fetchNotifications() {
    try {
      setLoading(true)

      const res = await fetch("/api/notifications")
      const data = await res.json()

      if (data.success) {
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: string) {
    try {
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
      console.error(error)
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

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length

  const highPriorityCount = notifications.filter(
    (notification) => notification.priority === "high"
  ).length

  const filteredNotifications = useMemo(() => {
    if (filter === "all") {
      return notifications
    }

    if (filter === "unread") {
      return notifications.filter(
        (notification) => !notification.read
      )
    }

    if (filter === "high") {
      return notifications.filter(
        (notification) => notification.priority === "high"
      )
    }

    return notifications
  }, [notifications, filter])

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader
          eyebrow="AI CO-HOST"
          title="Notifications Center"
          description="Monitor AI alerts, guest complaints, escalations and operational notifications across all properties."
          stats={[
            { label: "Unread", value: String(unreadCount) },
            { label: "High Priority", value: String(highPriorityCount) },
          ]}
          className="mb-8"
        />

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-5 py-3 rounded-2xl transition font-medium ${
              filter === "all"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-lowest border border-outline/20 text-on-surface hover:bg-surface-container-low"
            }`}
          >
            All
          </button>

          <button
            onClick={() => setFilter("unread")}
            className={`px-5 py-3 rounded-2xl transition font-medium ${
              filter === "unread"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-lowest border border-outline/20 text-on-surface hover:bg-surface-container-low"
            }`}
          >
            Unread
          </button>

          <button
            onClick={() => setFilter("high")}
            className={`px-5 py-3 rounded-2xl transition font-medium ${
              filter === "high"
                ? "bg-error text-on-error"
                : "bg-surface-container-lowest border border-outline/20 text-on-surface hover:bg-surface-container-low"
            }`}
          >
            High Priority
          </button>

          <button
            onClick={fetchNotifications}
            className="bg-surface-container-lowest border border-outline/20 text-on-surface px-5 py-3 rounded-2xl hover:bg-surface-container-low transition font-medium"
          >
            Refresh
          </button>
        </div>

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
            filteredNotifications.map((notification) => (
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
                      <PriorityBadge priority={notification.priority} />

                      {!notification.read && (
                        <Badge color="default" size="sm">
                          New
                        </Badge>
                      )}

                      {notification.type && (
                        <Badge color="neutral" size="sm">
                          {notification.type}
                        </Badge>
                      )}
                    </div>

                    <h2 className="text-2xl font-bold text-on-surface mb-3">
                      {notification.title || "Notification"}
                    </h2>

                    <p className="text-on-surface leading-relaxed whitespace-pre-line mb-4">
                      {notification.message || "No message provided"}
                    </p>

                    {notification.created_at && (
                      <div className="text-sm text-outline">
                        {new Date(notification.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 min-w-[180px]">
                    {!notification.read && (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
