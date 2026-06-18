 "use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

type GuestAccessToken = {
  id: string;
  property_id: string | null;
  property_slug: string;
  stay_id: string | null;
  booking_id: string | null;
  source: string;
  external_event_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_contact: string | null;
  token: string;
  guest_access_url: string;
  checkin_date: string | null;
  checkout_date: string | null;
  valid_from: string;
  valid_until: string;
  status: string;
  access_level: string;
  last_used_at: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type GuestAccessSettings = {
  id: string;
  property_id: string | null;
  property_slug: string;
  enabled: boolean;
  access_start_hours_before: number;
  access_end_hours_after: number;
  require_token_for_guest_page: boolean;
  require_token_for_ai: boolean;
  require_token_for_whatsapp: boolean;
  expired_message: string;
  not_active_message: string;
  revoked_message: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type GuestAccessListResponse = {
  success: boolean;
  error?: string;
  tokens?: GuestAccessToken[];
};

type GuestAccessSettingsResponse = {
  success: boolean;
  error?: string;
  settings?: GuestAccessSettings;
};

type GuestAccessSyncResponse = {
  success: boolean;
  error?: string;
  property_slug?: string;
  dry_run?: boolean;
  summary?: {
    bookings_checked: number;
    created: number;
    existing: number;
    skipped: number;
  };
  results?: Array<{
    booking_id: string;
    external_event_id: string | null;
    guest_name: string | null;
    checkin_date: string | null;
    checkout_date: string | null;
    action: string;
    reason: string;
    token_id?: string;
    guest_access_url?: string;
  }>;
};

const defaultSettings: GuestAccessSettings = {
  id: "",
  property_id: null,
  property_slug: "maltese-maisonette",
  enabled: false,
  access_start_hours_before: 24,
  access_end_hours_after: 6,
  require_token_for_guest_page: false,
  require_token_for_ai: false,
  require_token_for_whatsapp: false,
  expired_message:
    "This guest access has expired because the stay has ended. For anything related to your past stay, please contact the host directly.",
  not_active_message:
    "This guest access is not active yet. Please check your check-in details or contact the host.",
  revoked_message:
    "This guest access is no longer available. Please contact the host if you need assistance.",
  metadata: {},
  created_at: "",
  updated_at: "",
};

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(new Date(`${value}T12:00:00.000Z`));
  } catch {
    return value;
  }
}

function formatDateTime(value?: string | null) {
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

function getAccessState(token: GuestAccessToken) {
  const now = new Date();
  const validFrom = new Date(token.valid_from);
  const validUntil = new Date(token.valid_until);

  if (token.status === "revoked") {
    return {
      label: "Revoked",
      tone: "danger" as const,
    };
  }

  if (token.status === "expired") {
    return {
      label: "Expired",
      tone: "neutral" as const,
    };
  }

  if (
    Number.isNaN(validFrom.getTime()) ||
    Number.isNaN(validUntil.getTime())
  ) {
    return {
      label: "Invalid dates",
      tone: "danger" as const,
    };
  }

  if (now < validFrom) {
    return {
      label: "Not active yet",
      tone: "warning" as const,
    };
  }

  if (now > validUntil) {
    return {
      label: "Expired",
      tone: "neutral" as const,
    };
  }

  return {
    label: "Active",
    tone: "success" as const,
  };
}

function getBadgeClass(tone: "success" | "warning" | "danger" | "neutral") {
  if (tone === "success") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (tone === "warning") {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  if (tone === "danger") {
    return "border-red-100 bg-red-50 text-red-700";
  }

  return "border-zinc-200 bg-zinc-100 text-zinc-600";
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "danger" | "neutral";
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getBadgeClass(
        tone
      )}`}
    >
      {children}
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
      <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
        {label}
      </div>

      <div className="mt-3 text-4xl font-black text-zinc-950">{value}</div>

      <div className="mt-2 text-sm leading-relaxed text-zinc-500">{hint}</div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-zinc-100 bg-zinc-50 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-base font-black text-zinc-950">{title}</div>
        <div className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
          {description}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 rounded-full transition ${
          checked ? "bg-black" : "bg-zinc-300"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
            checked ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function DashboardGuestAccessPage() {
  const [tokens, setTokens] = useState<GuestAccessToken[]>([]);
  const [settings, setSettings] =
    useState<GuestAccessSettings>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const summary = useMemo(() => {
    const active = tokens.filter(
      (token) => getAccessState(token).label === "Active"
    ).length;

    const future = tokens.filter(
      (token) => getAccessState(token).label === "Not active yet"
    ).length;

    const revoked = tokens.filter((token) => token.status === "revoked").length;

    const bookingSynced = tokens.filter(
      (token) =>
        token.source !== "manual_test" && token.source !== "manual_active_test"
    ).length;

    return {
      total: tokens.length,
      active,
      future,
      revoked,
      bookingSynced,
    };
  }, [tokens]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadTokens(), loadSettings()]);
    setLoading(false);
  }

  async function loadSettings() {
    try {
      setError("");

      const response = await fetch(
        "/api/guest-access/settings?property_slug=maltese-maisonette",
        {
          cache: "no-store",
        }
      );

      const data = (await response.json()) as GuestAccessSettingsResponse;

      if (!data.success) {
        throw new Error(data.error || "Unable to load guest access settings");
      }

      setSettings(data.settings || defaultSettings);
    } catch (loadError) {
      console.error("LOAD GUEST ACCESS SETTINGS ERROR:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load guest access settings"
      );
    }
  }

  async function loadTokens() {
    try {
      setError("");

      const response = await fetch(
        "/api/guest-access?property_slug=maltese-maisonette",
        {
          cache: "no-store",
        }
      );

      const data = (await response.json()) as GuestAccessListResponse;

      if (!data.success) {
        throw new Error(data.error || "Unable to load guest access tokens");
      }

      setTokens(data.tokens || []);
    } catch (loadError) {
      console.error("LOAD GUEST ACCESS TOKENS ERROR:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load guest access tokens"
      );
    }
  }

  async function saveSettings() {
    try {
      setSettingsSaving(true);
      setError("");
      setStatusMessage("Saving Guest Stay Access settings...");

      const response = await fetch("/api/guest-access/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property_slug: "maltese-maisonette",
          enabled: settings.enabled,
          access_start_hours_before: settings.access_start_hours_before,
          access_end_hours_after: settings.access_end_hours_after,
          require_token_for_guest_page: settings.require_token_for_guest_page,
          require_token_for_ai: settings.require_token_for_ai,
          require_token_for_whatsapp: settings.require_token_for_whatsapp,
          expired_message: settings.expired_message,
          not_active_message: settings.not_active_message,
          revoked_message: settings.revoked_message,
        }),
      });

      const data = (await response.json()) as GuestAccessSettingsResponse;

      if (!data.success) {
        throw new Error(data.error || "Unable to save guest access settings");
      }

      setSettings(data.settings || settings);
      setStatusMessage("Guest Stay Access settings saved.");
    } catch (saveError) {
      console.error("SAVE GUEST ACCESS SETTINGS ERROR:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save guest access settings"
      );
    } finally {
      setSettingsSaving(false);
    }
  }

  async function syncFromBookings() {
    try {
      setWorking(true);
      setError("");
      setStatusMessage("Syncing bookings...");

      const response = await fetch("/api/guest-access/sync-from-bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property_slug: "maltese-maisonette",
          dry_run: false,
          limit: 50,
        }),
      });

      const data = (await response.json()) as GuestAccessSyncResponse;

      if (!data.success) {
        throw new Error(data.error || "Unable to sync bookings");
      }

      setStatusMessage(
        `Sync completed. Created: ${data.summary?.created || 0}, existing: ${
          data.summary?.existing || 0
        }, skipped: ${data.summary?.skipped || 0}.`
      );

      await loadTokens();
    } catch (syncError) {
      console.error("SYNC GUEST ACCESS ERROR:", syncError);
      setError(
        syncError instanceof Error
          ? syncError.message
          : "Unable to sync guest access from bookings"
      );
    } finally {
      setWorking(false);
    }
  }

  async function revokeAccess(token: GuestAccessToken) {
    const confirmed = window.confirm(
      `Revoke guest access for ${token.guest_name || "this guest"}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setWorking(true);
      setError("");
      setStatusMessage("Revoking guest access...");

      const response = await fetch("/api/guest-access/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: token.id,
          revoked_reason: "Revoked from dashboard",
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Unable to revoke guest access");
      }

      setStatusMessage("Guest access revoked.");
      await loadTokens();
    } catch (revokeError) {
      console.error("REVOKE GUEST ACCESS ERROR:", revokeError);
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : "Unable to revoke guest access"
      );
    } finally {
      setWorking(false);
    }
  }

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setStatusMessage("Guest access link copied.");
    } catch {
      setError("Unable to copy link. Please copy it manually.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f1eb] px-4 py-6 text-zinc-950 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[36px] border border-black/5 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-zinc-400">
                Host Dashboard
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Guest Stay Access
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-relaxed text-zinc-500 md:text-lg">
                Manage personal stay links generated from bookings. This module
                is separate, optional and can be enabled only when ready.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/dashboard"
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 font-black text-zinc-950 shadow-sm"
              >
                Back to Dashboard
              </a>

              <button
                onClick={loadAll}
                disabled={working || settingsSaving}
                className="rounded-2xl bg-zinc-900 px-5 py-3 font-black text-white shadow-sm disabled:opacity-50"
              >
                Refresh
              </button>

              <button
                onClick={syncFromBookings}
                disabled={working || settingsSaving}
                className="rounded-2xl bg-black px-5 py-3 font-black text-white shadow-sm disabled:opacity-50"
              >
                {working ? "Working..." : "Sync from Bookings"}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-[28px] border border-red-100 bg-red-50 p-5 font-semibold text-red-700">
            {error}
          </div>
        )}

        {statusMessage && (
          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-5 font-semibold text-emerald-700">
            {statusMessage}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total"
            value={summary.total}
            hint="Guest access links created."
          />

          <StatCard
            label="Active now"
            value={summary.active}
            hint="Links currently usable."
          />

          <StatCard
            label="Upcoming"
            value={summary.future}
            hint="Links not active yet."
          />

          <StatCard
            label="Revoked"
            value={summary.revoked}
            hint="Access manually revoked."
          />

          <StatCard
            label="Booking synced"
            value={summary.bookingSynced}
            hint="Links generated from imported bookings."
          />
        </section>

        <section className="rounded-[36px] border border-black/5 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Module Settings</h2>

              <p className="mt-1 text-sm text-zinc-500">
                Keep this module OFF until enforcement is connected to AI,
                WhatsApp and the guest page.
              </p>
            </div>

            <Badge tone={settings.enabled ? "success" : "neutral"}>
              {settings.enabled ? "Module ON" : "Module OFF"}
            </Badge>
          </div>

          <div className="space-y-4">
            <ToggleRow
              title="Enable Guest Stay Access module"
              description="Master switch for this feature. For now it stores the setting only; enforcement is added in the next block."
              checked={settings.enabled}
              onChange={(value) =>
                setSettings((current) => ({
                  ...current,
                  enabled: value,
                }))
              }
            />

            <ToggleRow
              title="Require token for Guest Page"
              description="When enforcement is enabled, the full guest page can require a valid stay token."
              checked={settings.require_token_for_guest_page}
              onChange={(value) =>
                setSettings((current) => ({
                  ...current,
                  require_token_for_guest_page: value,
                }))
              }
            />

            <ToggleRow
              title="Require token for AI Concierge"
              description="When enforcement is enabled, AI replies can be limited to active stays only."
              checked={settings.require_token_for_ai}
              onChange={(value) =>
                setSettings((current) => ({
                  ...current,
                  require_token_for_ai: value,
                }))
              }
            />

            <ToggleRow
              title="Require token for WhatsApp"
              description="When enforcement is enabled, WhatsApp AI can be limited to guests with an active stay."
              checked={settings.require_token_for_whatsapp}
              onChange={(value) =>
                setSettings((current) => ({
                  ...current,
                  require_token_for_whatsapp: value,
                }))
              }
            />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-3xl border border-zinc-100 bg-zinc-50 p-5">
                <div className="text-sm font-black text-zinc-950">
                  Access starts hours before check-in
                </div>

                <input
                  type="number"
                  min={0}
                  max={168}
                  value={settings.access_start_hours_before}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      access_start_hours_before: Number(event.target.value),
                    }))
                  }
                  className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 font-bold outline-none"
                />
              </label>

              <label className="rounded-3xl border border-zinc-100 bg-zinc-50 p-5">
                <div className="text-sm font-black text-zinc-950">
                  Access ends hours after check-out
                </div>

                <input
                  type="number"
                  min={0}
                  max={168}
                  value={settings.access_end_hours_after}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      access_end_hours_after: Number(event.target.value),
                    }))
                  }
                  className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 font-bold outline-none"
                />
              </label>
            </div>

            <button
              onClick={saveSettings}
              disabled={settingsSaving || working}
              className="rounded-2xl bg-black px-5 py-3 font-black text-white shadow-sm disabled:opacity-50"
            >
              {settingsSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </section>

        <section className="rounded-[36px] border border-black/5 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Guest Access Links</h2>

              <p className="mt-1 text-sm text-zinc-500">
                Copy, open or revoke personal guest access links.
              </p>
            </div>

            <Badge>{tokens.length} links</Badge>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-zinc-50 p-8 text-center text-zinc-500">
              Loading guest access links...
            </div>
          ) : tokens.length === 0 ? (
            <div className="rounded-3xl bg-zinc-50 p-8 text-center">
              <div className="text-5xl">🔑</div>

              <div className="mt-4 text-2xl font-black">
                No guest access links yet
              </div>

              <p className="mt-2 text-zinc-500">
                Use “Sync from Bookings” to generate links from imported Airbnb
                bookings.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tokens.map((token) => {
                const state = getAccessState(token);

                return (
                  <article
                    key={token.id}
                    className="rounded-[30px] border border-zinc-100 bg-zinc-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={state.tone}>{state.label}</Badge>
                          <Badge>{token.source}</Badge>
                          <Badge>{token.property_slug}</Badge>
                        </div>

                        <h3 className="mt-3 text-2xl font-black text-zinc-950">
                          {token.guest_name || "Guest"}
                        </h3>

                        <div className="mt-2 grid gap-2 text-sm text-zinc-500 md:grid-cols-2">
                          <div>
                            Check-in:{" "}
                            <span className="font-bold text-zinc-800">
                              {formatDate(token.checkin_date)}
                            </span>
                          </div>

                          <div>
                            Check-out:{" "}
                            <span className="font-bold text-zinc-800">
                              {formatDate(token.checkout_date)}
                            </span>
                          </div>

                          <div>
                            Valid from:{" "}
                            <span className="font-bold text-zinc-800">
                              {formatDateTime(token.valid_from)}
                            </span>
                          </div>

                          <div>
                            Valid until:{" "}
                            <span className="font-bold text-zinc-800">
                              {formatDateTime(token.valid_until)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 break-all rounded-2xl bg-white p-3 text-xs text-zinc-500">
                          {token.guest_access_url}
                        </div>

                        {token.revoked_reason && (
                          <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">
                            Revoked reason: {token.revoked_reason}
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 xl:justify-end">
                        <button
                          onClick={() => copyLink(token.guest_access_url)}
                          className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-black text-zinc-950 shadow-sm"
                        >
                          Copy Link
                        </button>

                        <a
                          href={token.guest_access_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl bg-black px-4 py-3 text-sm font-black text-white shadow-sm"
                        >
                          Open
                        </a>

                        {token.status !== "revoked" && (
                          <button
                            onClick={() => revokeAccess(token)}
                            disabled={working || settingsSaving}
                            className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-sm disabled:opacity-50"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}