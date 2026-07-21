 /* eslint-disable @next/next/no-img-element */
"use client";

import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import QRCode from "qrcode";

type Property = {
  id: string;
  property_name: string;
  slug?: string | null;
  city?: string | null;
  country?: string | null;
  wifi_name?: string | null;
  wifi_password?: string | null;
};

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
  summary?: {
    bookings_checked: number;
    created: number;
    existing: number;
    skipped: number;
  };
};

type PropertiesResponse = {
  success: boolean;
  error?: string;
  properties?: Property[];
};

const defaultSettings: GuestAccessSettings = {
  id: "",
  property_id: null,
  property_slug: "",
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

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getPropertySlug(property?: Property) {
  if (!property) {
    return "";
  }

  return property.slug || createSlug(property.property_name);
}

function escapeWifiValue(value?: string | null) {
  return (value || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/:/g, "\\:");
}

function createWifiQrValue(property?: Property) {
  if (!property) {
    return "";
  }

  const ssid = escapeWifiValue(property.wifi_name);
  const password = escapeWifiValue(property.wifi_password);

  if (!ssid && !password) {
    return "";
  }

  return `WIFI:T:WPA;S:${ssid};P:${password};;`;
}

async function generateQr(value: string) {
  if (!value) {
    return "";
  }

  try {
    return await QRCode.toDataURL(value, {
      width: 900,
      margin: 2,
      errorCorrectionLevel: "H",
    });
  } catch (error) {
    console.error("QR GENERATION ERROR:", error);
    return "";
  }
}

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

function getBadgeClass(
  tone: "success" | "warning" | "danger" | "neutral"
) {
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

      <div className="mt-3 text-4xl font-black text-zinc-950">
        {value}
      </div>

      <div className="mt-2 text-sm leading-relaxed text-zinc-500">
        {hint}
      </div>
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
        <div className="text-base font-black text-zinc-950">
          {title}
        </div>

        <div className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
          {description}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${
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

function QrPanel({
  eyebrow,
  title,
  description,
  qrDataUrl,
  emptyMessage,
  downloadLabel,
  onDownload,
}: {
  eyebrow: string;
  title: string;
  description: string;
  qrDataUrl: string;
  emptyMessage: string;
  downloadLabel: string;
  onDownload: () => void;
}) {
  return (
    <section className="rounded-[32px] border border-black/5 bg-white p-6 shadow-sm md:p-7">
      <div className="text-xs font-black uppercase tracking-[0.25em] text-zinc-400">
        {eyebrow}
      </div>

      <h2 className="mt-3 text-3xl font-black text-zinc-950">
        {title}
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-zinc-500">
        {description}
      </p>

      <div className="mt-6 flex min-h-[330px] items-center justify-center rounded-3xl border border-zinc-100 bg-zinc-50 p-6">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={title}
            className="w-full max-w-[300px] rounded-2xl"
          />
        ) : (
          <div className="text-center text-sm text-zinc-400">
            {emptyMessage}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onDownload}
        disabled={!qrDataUrl}
        className="mt-5 w-full rounded-2xl bg-black px-5 py-4 font-black text-white disabled:opacity-40"
      >
        {downloadLabel}
      </button>
    </section>
  );
}

export default function DashboardGuestAccessPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const [tokens, setTokens] = useState<GuestAccessToken[]>([]);
  const [settings, setSettings] =
    useState<GuestAccessSettings>(defaultSettings);

  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [working, setWorking] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [guestQr, setGuestQr] = useState("");
  const [wifiQr, setWifiQr] = useState("");

  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const selectedProperty = useMemo(
    () =>
      properties.find(
        (property) => property.id === selectedPropertyId
      ),
    [properties, selectedPropertyId]
  );

  const selectedPropertySlug = useMemo(
    () => getPropertySlug(selectedProperty),
    [selectedProperty]
  );

  const origin = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.location.origin;
  }, []);

  const publicGuestUrl = useMemo(() => {
    if (!origin || !selectedPropertySlug) {
      return "";
    }

    return `${origin}/guest/${selectedPropertySlug}`;
  }, [origin, selectedPropertySlug]);

  const wifiQrValue = useMemo(
    () => createWifiQrValue(selectedProperty),
    [selectedProperty]
  );

  const propertyLocation = useMemo(() => {
    if (!selectedProperty) {
      return "";
    }

    return [
      selectedProperty.city,
      selectedProperty.country,
    ]
      .filter(Boolean)
      .join(", ");
  }, [selectedProperty]);

  const summary = useMemo(() => {
    const active = tokens.filter(
      (token) => getAccessState(token).label === "Active"
    ).length;

    const future = tokens.filter(
      (token) =>
        getAccessState(token).label === "Not active yet"
    ).length;

    const revoked = tokens.filter(
      (token) => token.status === "revoked"
    ).length;

    const bookingSynced = tokens.filter(
      (token) =>
        token.source !== "manual_test" &&
        token.source !== "manual_active_test"
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
    loadProperties();
  }, []);

  useEffect(() => {
    if (!selectedPropertySlug) {
      setTokens([]);
      setSettings(defaultSettings);
      return;
    }

    loadAccessData(selectedPropertySlug);
  }, [selectedPropertySlug]);

  useEffect(() => {
    generateQr(publicGuestUrl).then(setGuestQr);
  }, [publicGuestUrl]);

  useEffect(() => {
    generateQr(wifiQrValue).then(setWifiQr);
  }, [wifiQrValue]);

  async function loadProperties() {
    try {
      setLoadingProperties(true);
      setError("");

      const response = await fetch("/api/properties", {
        cache: "no-store",
      });

      const data = (await response.json()) as PropertiesResponse;

      if (!data.success) {
        throw new Error(
          data.error || "Unable to load properties"
        );
      }

      const loadedProperties = data.properties || [];

      setProperties(loadedProperties);

      if (loadedProperties.length > 0) {
        setSelectedPropertyId((current) => {
          if (
            current &&
            loadedProperties.some(
              (property) => property.id === current
            )
          ) {
            return current;
          }

          return loadedProperties[0].id;
        });
      }
    } catch (loadError) {
      console.error("LOAD PROPERTIES ERROR:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load properties"
      );
    } finally {
      setLoadingProperties(false);
    }
  }

  async function loadAccessData(propertySlug: string) {
    try {
      setLoadingAccess(true);
      setError("");

      const encodedSlug = encodeURIComponent(propertySlug);

      const [tokensResponse, settingsResponse] =
        await Promise.all([
          fetch(
            `/api/guest-access?property_slug=${encodedSlug}`,
            {
              cache: "no-store",
            }
          ),
          fetch(
            `/api/guest-access/settings?property_slug=${encodedSlug}`,
            {
              cache: "no-store",
            }
          ),
        ]);

      const tokensData =
        (await tokensResponse.json()) as GuestAccessListResponse;

      const settingsData =
        (await settingsResponse.json()) as GuestAccessSettingsResponse;

      if (!tokensData.success) {
        throw new Error(
          tokensData.error ||
            "Unable to load guest access tokens"
        );
      }

      if (!settingsData.success) {
        throw new Error(
          settingsData.error ||
            "Unable to load guest access settings"
        );
      }

      setTokens(tokensData.tokens || []);

      setSettings(
        settingsData.settings || {
          ...defaultSettings,
          property_slug: propertySlug,
        }
      );
    } catch (loadError) {
      console.error("LOAD GUEST ACCESS ERROR:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load guest access"
      );
    } finally {
      setLoadingAccess(false);
    }
  }

  async function refreshCurrentProperty() {
    if (!selectedPropertySlug) {
      return;
    }

    setStatusMessage("");
    await loadAccessData(selectedPropertySlug);
  }

  async function saveSettings() {
    if (!selectedPropertySlug) {
      return;
    }

    try {
      setSettingsSaving(true);
      setError("");
      setStatusMessage("Saving guest access settings...");

      const response = await fetch(
        "/api/guest-access/settings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            property_slug: selectedPropertySlug,
            enabled: settings.enabled,
            access_start_hours_before:
              settings.access_start_hours_before,
            access_end_hours_after:
              settings.access_end_hours_after,
            require_token_for_guest_page:
              settings.require_token_for_guest_page,
            require_token_for_ai:
              settings.require_token_for_ai,
            require_token_for_whatsapp:
              settings.require_token_for_whatsapp,
            expired_message: settings.expired_message,
            not_active_message: settings.not_active_message,
            revoked_message: settings.revoked_message,
          }),
        }
      );

      const data =
        (await response.json()) as GuestAccessSettingsResponse;

      if (!data.success) {
        throw new Error(
          data.error ||
            "Unable to save guest access settings"
        );
      }

      setSettings(
        data.settings || {
          ...settings,
          property_slug: selectedPropertySlug,
        }
      );

      setStatusMessage("Guest access settings saved.");
    } catch (saveError) {
      console.error(
        "SAVE GUEST ACCESS SETTINGS ERROR:",
        saveError
      );

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
    if (!selectedPropertySlug) {
      return;
    }

    try {
      setWorking(true);
      setError("");
      setStatusMessage("Syncing bookings...");

      const response = await fetch(
        "/api/guest-access/sync-from-bookings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            property_slug: selectedPropertySlug,
            dry_run: false,
            limit: 50,
          }),
        }
      );

      const data =
        (await response.json()) as GuestAccessSyncResponse;

      if (!data.success) {
        throw new Error(
          data.error || "Unable to sync bookings"
        );
      }

      setStatusMessage(
        `Sync completed. Created: ${
          data.summary?.created || 0
        }, existing: ${
          data.summary?.existing || 0
        }, skipped: ${data.summary?.skipped || 0}.`
      );

      await loadAccessData(selectedPropertySlug);
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
      `Revoke guest access for ${
        token.guest_name || "this guest"
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setWorking(true);
      setError("");
      setStatusMessage("Revoking guest access...");

      const response = await fetch(
        "/api/guest-access/revoke",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: token.id,
            revoked_reason: "Revoked from dashboard",
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Unable to revoke guest access"
        );
      }

      setStatusMessage("Guest access revoked.");

      await loadAccessData(selectedPropertySlug);
    } catch (revokeError) {
      console.error(
        "REVOKE GUEST ACCESS ERROR:",
        revokeError
      );

      setError(
        revokeError instanceof Error
          ? revokeError.message
          : "Unable to revoke guest access"
      );
    } finally {
      setWorking(false);
    }
  }

  async function copyToClipboard(
    value: string,
    successMessage: string
  ) {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setStatusMessage(successMessage);
    } catch {
      setError(
        "Unable to copy the link. Please copy it manually."
      );
    }
  }

  function downloadQr(
    dataUrl: string,
    filename: string
  ) {
    if (!dataUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }

  return (
    <main className="min-h-screen bg-[#f4f1eb] px-4 py-6 text-zinc-950 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[36px] bg-gradient-to-br from-black via-zinc-900 to-zinc-800 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-white/40">
                AI Co-Host Platform
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Guest Access & QR/NFC
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/60 md:text-lg">
                Manage personal stay links, booking sync,
                access enforcement, QR codes, NFC links and
                Wi-Fi access from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/dashboard"
                className="rounded-2xl bg-white px-5 py-3 font-black text-black"
              >
                Back to Dashboard
              </a>

              <button
                type="button"
                onClick={refreshCurrentProperty}
                disabled={
                  working ||
                  settingsSaving ||
                  !selectedPropertySlug
                }
                className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-black text-white disabled:opacity-40"
              >
                Refresh
              </button>

              <button
                type="button"
                onClick={syncFromBookings}
                disabled={
                  working ||
                  settingsSaving ||
                  !selectedPropertySlug
                }
                className="rounded-2xl bg-white px-5 py-3 font-black text-black disabled:opacity-40"
              >
                {working
                  ? "Working..."
                  : "Sync from Bookings"}
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_auto]">
            <div>
              <label
                htmlFor="guest-access-property"
                className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-white/40"
              >
                Select property
              </label>

              <select
                id="guest-access-property"
                value={selectedPropertyId}
                disabled={
                  loadingProperties ||
                  properties.length === 0
                }
                onChange={(event) =>
                  setSelectedPropertyId(
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-white px-4 py-4 font-black text-black outline-none disabled:opacity-50"
              >
                {properties.length === 0 && (
                  <option value="">
                    {loadingProperties
                      ? "Loading properties..."
                      : "No properties available"}
                  </option>
                )}

                {properties.map((property) => (
                  <option
                    key={property.id}
                    value={property.id}
                  >
                    {property.property_name}
                    {property.city
                      ? ` — ${property.city}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                Selected
              </div>

              <div className="mt-1 text-lg font-black">
                {selectedProperty?.property_name ||
                  "No property selected"}
              </div>

              {propertyLocation && (
                <div className="mt-1 text-sm text-white/50">
                  {propertyLocation}
                </div>
              )}
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total links"
            value={summary.total}
            hint="Access links created."
          />

          <StatCard
            label="Active now"
            value={summary.active}
            hint="Currently usable."
          />

          <StatCard
            label="Upcoming"
            value={summary.future}
            hint="Not active yet."
          />

          <StatCard
            label="Revoked"
            value={summary.revoked}
            hint="Manually disabled."
          />

          <StatCard
            label="Booking synced"
            value={summary.bookingSynced}
            hint="Generated from bookings."
          />
        </section>

        <section className="rounded-[36px] border border-black/5 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black">
                Public Guest Page & NFC Link
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-500">
                Use this permanent property link for printed
                cards and NFC tags. Personal stay links remain
                available below for token-controlled access.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    publicGuestUrl,
                    "Public guest link copied."
                  )
                }
                disabled={!publicGuestUrl}
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 font-black disabled:opacity-40"
              >
                Copy Link
              </button>

              {publicGuestUrl && (
                <a
                  href={publicGuestUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-black px-5 py-3 font-black text-white"
                >
                  Open Guest Page
                </a>
              )}
            </div>
          </div>

          <div className="mt-5 break-all rounded-3xl bg-zinc-50 p-4 font-mono text-sm text-zinc-600">
            {publicGuestUrl || "Guest URL not available"}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <QrPanel
            eyebrow="Main QR Code"
            title="Guest Page QR"
            description="The main QR code for welcome cards, stickers and printed guest information."
            qrDataUrl={guestQr}
            emptyMessage="Select a property to generate the guest QR."
            downloadLabel="Download Guest QR"
            onDownload={() =>
              downloadQr(
                guestQr,
                `${selectedPropertySlug}-guest-page-qr.png`
              )
            }
          />

          <QrPanel
            eyebrow="Optional Wi-Fi QR"
            title="Direct Wi-Fi QR"
            description={`Network: ${
              selectedProperty?.wifi_name ||
              "Not configured"
            }`}
            qrDataUrl={wifiQr}
            emptyMessage="Add Wi-Fi details to generate the Wi-Fi QR."
            downloadLabel="Download Wi-Fi QR"
            onDownload={() =>
              downloadQr(
                wifiQr,
                `${selectedPropertySlug}-wifi-qr.png`
              )
            }
          />
        </section>

        <section className="rounded-[36px] border border-black/5 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black">
                Access Settings
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Configure when token-based access begins and
                ends for the selected property.
              </p>
            </div>

            <Badge
              tone={
                settings.enabled
                  ? "success"
                  : "neutral"
              }
            >
              {settings.enabled
                ? "Module ON"
                : "Module OFF"}
            </Badge>
          </div>

          {loadingAccess ? (
            <div className="rounded-3xl bg-zinc-50 p-8 text-center text-zinc-500">
              Loading access settings...
            </div>
          ) : (
            <div className="space-y-4">
              <ToggleRow
                title="Enable Guest Stay Access"
                description="Master switch for token-controlled guest access."
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
                description="Allow the guest page only with a valid stay token."
                checked={
                  settings.require_token_for_guest_page
                }
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    require_token_for_guest_page:
                      value,
                  }))
                }
              />

              <ToggleRow
                title="Require token for AI Concierge"
                description="Limit AI replies to guests with an active stay."
                checked={
                  settings.require_token_for_ai
                }
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    require_token_for_ai: value,
                  }))
                }
              />

              <ToggleRow
                title="Require token for WhatsApp"
                description="Limit WhatsApp AI access to active stays."
                checked={
                  settings.require_token_for_whatsapp
                }
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    require_token_for_whatsapp:
                      value,
                  }))
                }
              />

              <div className="grid gap-4 md:grid-cols-2">
                <label className="rounded-3xl border border-zinc-100 bg-zinc-50 p-5">
                  <div className="text-sm font-black">
                    Access starts hours before check-in
                  </div>

                  <input
                    type="number"
                    min={0}
                    max={168}
                    value={
                      settings.access_start_hours_before
                    }
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        access_start_hours_before:
                          Number(event.target.value),
                      }))
                    }
                    className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 font-bold outline-none"
                  />
                </label>

                <label className="rounded-3xl border border-zinc-100 bg-zinc-50 p-5">
                  <div className="text-sm font-black">
                    Access ends hours after check-out
                  </div>

                  <input
                    type="number"
                    min={0}
                    max={168}
                    value={
                      settings.access_end_hours_after
                    }
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        access_end_hours_after:
                          Number(event.target.value),
                      }))
                    }
                    className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 font-bold outline-none"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={saveSettings}
                disabled={
                  settingsSaving ||
                  working ||
                  !selectedPropertySlug
                }
                className="rounded-2xl bg-black px-5 py-3 font-black text-white disabled:opacity-50"
              >
                {settingsSaving
                  ? "Saving..."
                  : "Save Settings"}
              </button>
            </div>
          )}
        </section>

        <section className="rounded-[36px] border border-black/5 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black">
                Personal Guest Access Links
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Copy, open or revoke tokenized links generated
                from bookings.
              </p>
            </div>

            <Badge>{tokens.length} links</Badge>
          </div>

          {loadingAccess ? (
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
                Use “Sync from Bookings” to create links from
                imported reservations.
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
                          <Badge tone={state.tone}>
                            {state.label}
                          </Badge>

                          <Badge>{token.source}</Badge>
                        </div>

                        <h3 className="mt-3 text-2xl font-black">
                          {token.guest_name || "Guest"}
                        </h3>

                        <div className="mt-3 grid gap-2 text-sm text-zinc-500 md:grid-cols-2">
                          <div>
                            Check-in:{" "}
                            <span className="font-bold text-zinc-800">
                              {formatDate(
                                token.checkin_date
                              )}
                            </span>
                          </div>

                          <div>
                            Check-out:{" "}
                            <span className="font-bold text-zinc-800">
                              {formatDate(
                                token.checkout_date
                              )}
                            </span>
                          </div>

                          <div>
                            Valid from:{" "}
                            <span className="font-bold text-zinc-800">
                              {formatDateTime(
                                token.valid_from
                              )}
                            </span>
                          </div>

                          <div>
                            Valid until:{" "}
                            <span className="font-bold text-zinc-800">
                              {formatDateTime(
                                token.valid_until
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 break-all rounded-2xl bg-white p-3 text-xs text-zinc-500">
                          {token.guest_access_url}
                        </div>

                        {token.revoked_reason && (
                          <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">
                            Revoked reason:{" "}
                            {token.revoked_reason}
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              token.guest_access_url,
                              "Guest access link copied."
                            )
                          }
                          className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-black"
                        >
                          Copy Link
                        </button>

                        <a
                          href={token.guest_access_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl bg-black px-4 py-3 text-sm font-black text-white"
                        >
                          Open
                        </a>

                        {token.status !== "revoked" && (
                          <button
                            type="button"
                            onClick={() =>
                              revokeAccess(token)
                            }
                            disabled={
                              working ||
                              settingsSaving
                            }
                            className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
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

        <section className="rounded-[36px] bg-black p-6 text-white shadow-xl md:p-8">
          <div className="grid gap-7 lg:grid-cols-[1fr_300px] lg:items-center">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.25em] text-white/40">
                NFC-ready guest experience
              </div>

              <h2 className="mt-3 text-3xl font-black md:text-4xl">
                Scan or tap once
              </h2>

              <p className="mt-3 max-w-2xl leading-relaxed text-white/60">
                The permanent guest page URL can be written to
                an NFC tag or printed as a QR code. Do not write
                localhost URLs to physical tags.
              </p>

              <div className="mt-5 break-all rounded-2xl bg-white/10 p-4 font-mono text-sm text-white/70">
                {publicGuestUrl ||
                  "Guest URL not available"}
              </div>
            </div>

            <div className="flex items-center justify-center rounded-3xl bg-white p-5">
              {guestQr ? (
                <img
                  src={guestQr}
                  alt="Guest access QR preview"
                  className="w-full rounded-2xl"
                />
              ) : (
                <div className="py-20 text-zinc-400">
                  QR preview
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}