"use client";

import { useEffect, useMemo, useState } from "react";

type HostNotification = {
  id: string;
  property_slug: string;
  notification_type: string;
  title: string;
  message: string;
  priority: string;
  status: string;
  whatsapp_status: string;
  telegram_status?: string | null;
  email_status?: string | null;
  created_at: string;
  read_at?: string | null;
  archived_at?: string | null;
};

type GuestPageEvent = {
  id: string;
  property_slug: string;
  event_type: string;
  event_source?: string | null;
  event_label?: string | null;
  guest_language?: string | null;
  is_first_event: boolean;
  host_notified: boolean;
  created_at: string;
};

type AiAnswerCacheItem = {
  id: string;
  property_slug: string;
  question_normalized: string;
  question_original: string;
  source: string;
  usage_count: number;
  last_used_at?: string | null;
  approved: boolean;
  created_at: string;
};

type HostActivitySummary = {
  unread_notifications: number;
  whatsapp_sent: number;
  first_guest_opens: number;
  ai_cache_entries: number;
  ai_cache_total_uses: number;
};

type HostActivityResponse = {
  success: boolean;
  error?: string;
  summary?: HostActivitySummary;
  notifications?: HostNotification[];
  guest_events?: GuestPageEvent[];
  ai_answer_cache?: AiAnswerCacheItem[];
};

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getStatusClass(status?: string | null) {
  if (status === "sent" || status === "read") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  if (status === "unread" || status === "pending_provider") {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }

  if (status === "failed") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (status === "not_configured") {
    return "bg-zinc-100 text-zinc-600 border-zinc-200";
  }

  return "bg-zinc-50 text-zinc-700 border-zinc-100";
}

function StatusBadge({
  children,
}: {
  children: string | number | null | undefined;
}) {
  const value = children ? String(children) : "—";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
        value
      )}`}
    >
      {value}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-[0.22em] text-zinc-400">
        {label}
      </div>

      <div className="mt-3 text-4xl font-black text-zinc-950">
        {value}
      </div>

      <div className="mt-2 text-sm leading-relaxed text-zinc-500">
        {hint}
      </div>
    </div>
  );
}

export default function HostActivityPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] =
    useState<HostActivitySummary | null>(null);

  const [notifications, setNotifications] = useState<
    HostNotification[]
  >([]);

  const [guestEvents, setGuestEvents] = useState<
    GuestPageEvent[]
  >([]);

  const [aiAnswerCache, setAiAnswerCache] = useState<
    AiAnswerCacheItem[]
  >([]);

  const latestActivity = useMemo(() => {
    const notificationItems = notifications.map((item) => ({
      id: `notification-${item.id}`,
      type: "notification",
      title: item.title,
      subtitle: item.message,
      propertySlug: item.property_slug,
      status: item.status,
      whatsappStatus: item.whatsapp_status,
      createdAt: item.created_at,
    }));

    const eventItems = guestEvents.map((item) => ({
      id: `event-${item.id}`,
      type: "event",
      title:
        item.event_label ||
        item.event_type.replaceAll("_", " "),
      subtitle: `${item.event_source || "guest_page"} · ${
        item.guest_language || "unknown language"
      }`,
      propertySlug: item.property_slug,
      status: item.is_first_event ? "first_event" : "repeat",
      whatsappStatus: item.host_notified ? "host_notified" : "not_notified",
      createdAt: item.created_at,
    }));

    return [...notificationItems, ...eventItems]
      .sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        );
      })
      .slice(0, 20);
  }, [notifications, guestEvents]);

  useEffect(() => {
    loadActivity();
  }, []);

  async function loadActivity() {
    try {
      setRefreshing(true);
      setError("");

      const response = await fetch("/api/host-activity", {
        cache: "no-store",
      });

      const data =
        (await response.json()) as HostActivityResponse;

      if (!data.success) {
        throw new Error(
          data.error || "Unable to load host activity"
        );
      }

      setSummary(data.summary || null);
      setNotifications(data.notifications || []);
      setGuestEvents(data.guest_events || []);
      setAiAnswerCache(data.ai_answer_cache || []);
    } catch (loadError) {
      console.error("LOAD HOST ACTIVITY ERROR:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load host activity"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function updateNotification({
    notificationId,
    action,
  }: {
    notificationId: string;
    action: "mark_notification_read" | "archive_notification";
  }) {
    try {
      const response = await fetch("/api/host-activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          notification_id: notificationId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Unable to update notification"
        );
      }

      await loadActivity();
    } catch (updateError) {
      console.error(
        "UPDATE HOST NOTIFICATION ERROR:",
        updateError
      );
      alert(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update notification"
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f1eb] px-4 py-6 text-zinc-950 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[36px] border border-black/5 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                HOST DASHBOARD
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Guest Activity
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-relaxed text-zinc-500 md:text-lg">
                Live overview of guest page opens, host alerts,
                WhatsApp notification status and AI cache activity.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/dashboard"
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 font-bold text-zinc-950 shadow-sm"
              >
                Back to Dashboard
              </a>

              <a
                href="/guest/maltese-maisonette"
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-black bg-black px-5 py-3 font-bold text-white shadow-sm"
              >
                Open Guest Page
              </a>

              <button
                onClick={loadActivity}
                disabled={refreshing}
                className="rounded-2xl bg-zinc-900 px-5 py-3 font-bold text-white shadow-sm disabled:opacity-50"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-[28px] border border-red-100 bg-red-50 p-5 font-semibold text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Unread"
            value={summary?.unread_notifications ?? 0}
            hint="Host notifications still unread."
          />

          <StatCard
            label="WhatsApp sent"
            value={summary?.whatsapp_sent ?? 0}
            hint="Host WhatsApp alerts delivered."
          />

          <StatCard
            label="First opens"
            value={summary?.first_guest_opens ?? 0}
            hint="First guest page openings detected."
          />

          <StatCard
            label="AI cache"
            value={summary?.ai_cache_entries ?? 0}
            hint="Stored AI answers for reuse."
          />

          <StatCard
            label="Cache uses"
            value={summary?.ai_cache_total_uses ?? 0}
            hint="Total cached-answer usage count."
          />
        </section>

        {loading ? (
          <div className="rounded-[36px] border border-black/5 bg-white p-8 text-center shadow-sm">
            <div className="text-5xl">🏡</div>
            <div className="mt-4 text-2xl font-black">
              Loading guest activity
            </div>
            <div className="mt-2 text-zinc-500">
              Please wait a moment.
            </div>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[36px] border border-black/5 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black">
                    Latest Activity
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Combined view of guest events and host alerts.
                  </p>
                </div>

                <StatusBadge>{latestActivity.length}</StatusBadge>
              </div>

              <div className="space-y-3">
                {latestActivity.length === 0 && (
                  <div className="rounded-3xl bg-zinc-50 p-6 text-zinc-500">
                    No guest activity yet.
                  </div>
                )}

                {latestActivity.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-zinc-100 bg-zinc-50 p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                          {item.type} · {item.propertySlug}
                        </div>

                        <div className="mt-2 text-lg font-black">
                          {item.title}
                        </div>

                        <div className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-500">
                          {item.subtitle}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <StatusBadge>{item.status}</StatusBadge>
                        <StatusBadge>
                          {item.whatsappStatus}
                        </StatusBadge>
                        <StatusBadge>
                          {formatDate(item.createdAt)}
                        </StatusBadge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-[36px] border border-black/5 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black">
                      Host Notifications
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Alerts generated for the host.
                    </p>
                  </div>

                  <StatusBadge>{notifications.length}</StatusBadge>
                </div>

                <div className="space-y-3">
                  {notifications.length === 0 && (
                    <div className="rounded-3xl bg-zinc-50 p-5 text-zinc-500">
                      No host notifications yet.
                    </div>
                  )}

                  {notifications.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-3xl border border-zinc-100 p-5"
                    >
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge>{item.status}</StatusBadge>
                        <StatusBadge>
                          {item.whatsapp_status}
                        </StatusBadge>
                        <StatusBadge>
                          {item.priority}
                        </StatusBadge>
                      </div>

                      <div className="mt-3 text-lg font-black">
                        {item.title}
                      </div>

                      <div className="mt-2 text-sm leading-relaxed text-zinc-500">
                        {item.message}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
                        <span>{formatDate(item.created_at)}</span>

                        <div className="flex gap-2">
                          {item.status !== "read" && (
                            <button
                              onClick={() =>
                                updateNotification({
                                  notificationId: item.id,
                                  action:
                                    "mark_notification_read",
                                })
                              }
                              className="rounded-xl bg-zinc-100 px-3 py-2 font-bold text-zinc-700"
                            >
                              Mark read
                            </button>
                          )}

                          <button
                            onClick={() =>
                              updateNotification({
                                notificationId: item.id,
                                action:
                                  "archive_notification",
                              })
                            }
                            className="rounded-xl bg-zinc-900 px-3 py-2 font-bold text-white"
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[36px] border border-black/5 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black">
                      AI Cache
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Recent saved AI answers.
                    </p>
                  </div>

                  <StatusBadge>{aiAnswerCache.length}</StatusBadge>
                </div>

                <div className="space-y-3">
                  {aiAnswerCache.length === 0 && (
                    <div className="rounded-3xl bg-zinc-50 p-5 text-zinc-500">
                      No AI cache entries yet.
                    </div>
                  )}

                  {aiAnswerCache.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-3xl border border-zinc-100 p-5"
                    >
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge>
                          uses {item.usage_count || 0}
                        </StatusBadge>
                        <StatusBadge>{item.source}</StatusBadge>
                        <StatusBadge>
                          {item.approved ? "approved" : "review"}
                        </StatusBadge>
                      </div>

                      <div className="mt-3 font-black">
                        {item.question_original}
                      </div>

                      <div className="mt-2 text-xs text-zinc-400">
                        normalized: {item.question_normalized}
                      </div>

                      <div className="mt-3 text-xs text-zinc-400">
                        Last used: {formatDate(item.last_used_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}