"use client"

import { useEffect, useMemo, useState } from "react"

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
      <div className="inline-flex items-center rounded-2xl bg-red-100 text-red-700 px-3 py-1 text-xs font-semibold">
        🔴 High
      </div>
    )
  }

  if (priority === "medium") {
    return (
      <div className="inline-flex items-center rounded-2xl bg-orange-100 text-orange-700 px-3 py-1 text-xs font-semibold">
        🟠 Medium
      </div>
    )
  }

  return (
    <div className="inline-flex items-center rounded-2xl bg-gray-100 text-gray-700 px-3 py-1 text-xs font-semibold">
      Normal
    </div>
  )
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true)

  const [notifications, setNotifications] =
    useState<Notification[]>([])

  const [filter, setFilter] =
    useState("all")

  async function fetchNotifications() {
    try {
      setLoading(true)

      const res = await fetch(
        "/api/notifications"
      )

      const data = await res.json()

      if (data.success) {
        setNotifications(
          data.notifications || []
        )
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
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          id,
          read: true,
        }),
      })

      fetchNotifications()
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.read
    ).length

  const highPriorityCount =
    notifications.filter(
      (notification) =>
        notification.priority ===
        "high"
    ).length

  const filteredNotifications =
    useMemo(() => {
      if (filter === "all") {
        return notifications
      }

      if (filter === "unread") {
        return notifications.filter(
          (notification) =>
            !notification.read
        )
      }

      if (filter === "high") {
        return notifications.filter(
          (notification) =>
            notification.priority ===
            "high"
        )
      }

      return notifications
    }, [notifications, filter])

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
                Notifications Center
              </h1>

              <p className="text-white/60 max-w-2xl">
                Monitor AI alerts, guest
                complaints, escalations and
                operational notifications across
                all properties.
              </p>

            </div>

            <div className="grid grid-cols-2 gap-4 min-w-[320px]">

              <div className="bg-white/10 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">

                <div className="text-white/50 text-sm mb-2">
                  Unread
                </div>

                <div className="text-4xl font-bold">
                  {unreadCount}
                </div>

              </div>

              <div className="bg-white/10 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">

                <div className="text-white/50 text-sm mb-2">
                  High Priority
                </div>

                <div className="text-4xl font-bold">
                  {highPriorityCount}
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* FILTERS */}

        <div className="flex flex-wrap gap-3 mb-6">

          <button
            onClick={() =>
              setFilter("all")
            }
            className={`px-5 py-3 rounded-2xl transition ${
              filter === "all"
                ? "bg-black text-white"
                : "bg-white border border-gray-200"
            }`}
          >
            All
          </button>

          <button
            onClick={() =>
              setFilter("unread")
            }
            className={`px-5 py-3 rounded-2xl transition ${
              filter === "unread"
                ? "bg-black text-white"
                : "bg-white border border-gray-200"
            }`}
          >
            Unread
          </button>

          <button
            onClick={() =>
              setFilter("high")
            }
            className={`px-5 py-3 rounded-2xl transition ${
              filter === "high"
                ? "bg-red-600 text-white"
                : "bg-white border border-gray-200"
            }`}
          >
            High Priority
          </button>

          <button
            onClick={fetchNotifications}
            className="bg-white border border-gray-200 px-5 py-3 rounded-2xl"
          >
            Refresh
          </button>

        </div>

        {/* NOTIFICATIONS */}

        <div className="space-y-5">

          {loading && (

            <div className="bg-white rounded-[32px] p-8 shadow-xl border border-black/5 text-gray-500">
              Loading notifications...
            </div>

          )}

          {!loading &&
            filteredNotifications.length ===
              0 && (

              <div className="bg-white rounded-[32px] p-10 shadow-xl border border-black/5 text-center text-gray-500">

                No notifications found

              </div>

            )}

          {!loading &&
            filteredNotifications.map(
              (notification) => (

                <div
                  key={notification.id}
                  className={`rounded-[32px] p-7 shadow-xl border ${
                    notification.read
                      ? "bg-white border-black/5"
                      : "bg-blue-50 border-blue-100"
                  }`}
                >

                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

                    {/* LEFT */}

                    <div className="flex-1">

                      <div className="flex flex-wrap items-center gap-3 mb-4">

                        <PriorityBadge
                          priority={
                            notification.priority
                          }
                        />

                        {!notification.read && (

                          <div className="inline-flex items-center rounded-2xl bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
                            New
                          </div>

                        )}

                        {notification.type && (

                          <div className="inline-flex items-center rounded-2xl bg-gray-100 text-gray-700 px-3 py-1 text-xs font-semibold">
                            {notification.type}
                          </div>

                        )}

                      </div>

                      <h2 className="text-2xl font-bold mb-3">

                        {notification.title ||
                          "Notification"}

                      </h2>

                      <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-4">

                        {notification.message}

                      </p>

                      {notification.created_at && (

                        <div className="text-sm text-gray-400">

                          {new Date(
                            notification.created_at
                          ).toLocaleString()}

                        </div>

                      )}

                    </div>

                    {/* RIGHT */}

                    <div className="flex flex-col gap-3 min-w-[180px]">

                      {!notification.read && (

                        <button
                          onClick={() =>
                            markAsRead(
                              notification.id
                            )
                          }
                          className="bg-black text-white rounded-2xl px-5 py-3 font-semibold hover:opacity-90 transition"
                        >
                          Mark as Read
                        </button>

                      )}

                    </div>

                  </div>

                </div>

              )
            )}

        </div>

      </div>

    </div>
  )
}