 "use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Property = {
  id: string;
  property_name: string;
  slug?: string | null;
};

type CalendarSource = {
  id: string;
  property_id: string;
  source_name: string;
  source_type: string;
  ics_url: string;
  is_active: boolean;
  last_sync_at?: string | null;
  last_sync_status?: string | null;
  last_sync_error?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SyncLog = {
  id: string;
  property_id: string;
  source_id: string | null;
  status: string;
  events_found: number;
  bookings_created: number;
  bookings_updated: number;
  bookings_skipped: number;
  error_message?: string | null;
  synced_at: string;
  booking_sources?: {
    id: string;
    source_name: string;
    source_type: string;
  } | null;
  properties?: {
    id: string;
    property_name: string;
    slug?: string | null;
  } | null;
};

type CalendarSourceForm = {
  property_id: string;
  source_name: string;
  source_type: string;
  ics_url: string;
  is_active: boolean;
};

const emptyCalendarSourceForm: CalendarSourceForm = {
  property_id: "",
  source_name: "",
  source_type: "airbnb",
  ics_url: "",
  is_active: true,
};

function getSourceTypeLabel(value: string) {
  switch (value) {
    case "airbnb":
      return "Airbnb";
    case "booking":
      return "Booking.com";
    case "direct":
      return "Direct";
    case "owner":
      return "Owner";
    case "other":
      return "Other";
    default:
      return "Other";
  }
}

function getSourceBadgeClass(value: string) {
  switch (value) {
    case "airbnb":
      return "bg-rose-50 text-rose-700 border-rose-100";
    case "booking":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "direct":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "owner":
      return "bg-purple-50 text-purple-700 border-purple-100";
    default:
      return "bg-gray-50 text-gray-700 border-gray-100";
  }
}

function getSyncBadgeClass(value?: string | null) {
  switch (value) {
    case "success":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "error":
      return "bg-red-50 text-red-700 border-red-100";
    case "not_synced":
      return "bg-yellow-50 text-yellow-700 border-yellow-100";
    default:
      return "bg-gray-50 text-gray-700 border-gray-100";
  }
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Never synced";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function Card({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-black/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-2">
            {title}
          </p>

          <div className="text-3xl font-black text-gray-950">
            {value}
          </div>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl">
          {icon}
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-4 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-white rounded-[32px] p-6 md:p-7 shadow-xl border border-black/5">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
          {icon} {title}
        </h2>

        <p className="text-sm md:text-base text-gray-500 leading-relaxed max-w-3xl">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

function FieldLabel({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-2">
      <label className="block text-sm font-bold text-gray-800">
        {title}
      </label>

      {description && (
        <p className="text-xs text-gray-400 leading-relaxed mt-1">
          {description}
        </p>
      )}
    </div>
  );
}

export default function CalendarSourcesPage() {
  const [properties, setProperties] =
    useState<Property[]>([]);

  const [calendarSources, setCalendarSources] =
    useState<CalendarSource[]>([]);

  const [syncLogs, setSyncLogs] =
    useState<SyncLog[]>([]);

  const [selectedProperty, setSelectedProperty] =
    useState("all");

  const [form, setForm] =
    useState<CalendarSourceForm>(
      emptyCalendarSourceForm
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [syncingSourceId, setSyncingSourceId] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (properties.length === 0) {
      return;
    }

    setForm((current) => ({
      ...current,
      property_id:
        current.property_id || properties[0].id,
    }));
  }, [properties]);

  async function loadInitialData() {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      await Promise.all([
        loadProperties(),
        loadCalendarSources(),
        loadSyncLogs(),
      ]);
    } catch (error) {
      console.error(
        "CALENDAR SOURCES LOAD ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load calendar sources"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadProperties() {
    const response = await fetch("/api/properties");
    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.error || "Unable to load properties"
      );
    }

    setProperties((data.properties || []) as Property[]);
  }

  async function loadCalendarSources() {
    const response = await fetch("/api/calendar-sources");
    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.error ||
          "Unable to load calendar sources"
      );
    }

    setCalendarSources(
      (data.calendar_sources || []) as CalendarSource[]
    );
  }

  async function loadSyncLogs() {
    const response = await fetch("/api/calendar-sync-logs");
    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.error ||
          "Unable to load calendar sync logs"
      );
    }

    setSyncLogs(
      (data.sync_logs || []) as SyncLog[]
    );
  }

  const filteredSources = useMemo(() => {
    if (selectedProperty === "all") {
      return calendarSources;
    }

    return calendarSources.filter(
      (source) =>
        source.property_id === selectedProperty
    );
  }, [calendarSources, selectedProperty]);

  const filteredLogs = useMemo(() => {
    if (selectedProperty === "all") {
      return syncLogs;
    }

    return syncLogs.filter(
      (log) => log.property_id === selectedProperty
    );
  }, [syncLogs, selectedProperty]);

  const activeSources = filteredSources.filter(
    (source) => source.is_active
  ).length;

  const airbnbSources = filteredSources.filter(
    (source) => source.source_type === "airbnb"
  ).length;

  const bookingSources = filteredSources.filter(
    (source) => source.source_type === "booking"
  ).length;

  const errorSources = filteredSources.filter(
    (source) => source.last_sync_status === "error"
  ).length;

  const notSyncedSources = filteredSources.filter(
    (source) =>
      !source.last_sync_at ||
      source.last_sync_status === "not_synced"
  ).length;

  async function createCalendarSource() {
    if (!form.property_id) {
      setErrorMessage("Select a property first.");
      return;
    }

    if (!form.source_name.trim()) {
      setErrorMessage("Source name is required.");
      return;
    }

    if (!form.ics_url.trim()) {
      setErrorMessage("ICS URL is required.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(
        "/api/calendar-sources",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            property_id: form.property_id,
            source_name: form.source_name,
            source_type: form.source_type,
            ics_url: form.ics_url,
            is_active: form.is_active,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
            "Unable to create calendar source"
        );
      }

      setForm((current) => ({
        ...emptyCalendarSourceForm,
        property_id: current.property_id,
        source_type: current.source_type,
      }));

      await Promise.all([
        loadCalendarSources(),
        loadSyncLogs(),
      ]);

      setSuccessMessage("Calendar source added.");
    } catch (error) {
      console.error(
        "CREATE CALENDAR SOURCE UI ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create calendar source"
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCalendarSource(id: string) {
    const confirmDelete = confirm(
      "Delete this calendar source?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/calendar-sources?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
            "Unable to delete calendar source"
        );
      }

      await Promise.all([
        loadCalendarSources(),
        loadSyncLogs(),
      ]);

      setSuccessMessage("Calendar source deleted.");
    } catch (error) {
      console.error(
        "DELETE CALENDAR SOURCE UI ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete calendar source"
      );
    }
  }

  async function syncCalendarSource(id: string) {
    try {
      setSyncingSourceId(id);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(
        "/api/calendar-sources/sync",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source_id: id,
          }),
        }
      );

      const data = await response.json();

      await Promise.all([
        loadCalendarSources(),
        loadSyncLogs(),
      ]);

      if (!data.success) {
        throw new Error(
          data.error ||
            "Unable to sync calendar source"
        );
      }

      setSuccessMessage(
        `Calendar source synced. Events: ${data.events_found}. Created: ${data.bookings_created}. Updated: ${data.bookings_updated}.`
      );
    } catch (error) {
      console.error(
        "SYNC CALENDAR SOURCE UI ERROR:",
        error
      );

      await Promise.all([
        loadCalendarSources(),
        loadSyncLogs(),
      ]);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sync calendar source"
      );
    } finally {
      setSyncingSourceId("");
    }
  }

  function getPropertyName(propertyId: string) {
    const property = properties.find(
      (item) => item.id === propertyId
    );

    return (
      property?.property_name ||
      "Unknown property"
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white px-6 py-10 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-4">
                AI CO-HOST LIGHT CHANNEL MANAGER
              </div>

              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Calendar Sources
              </h1>

              <p className="text-white/70 text-lg max-w-2xl leading-relaxed">
                Save Airbnb, Booking.com and other iCal links, then sync
                active sources into the Light Channel Manager.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/10 min-w-[280px]">
              <label className="block text-white/60 text-sm mb-2">
                Property filter
              </label>

              <select
                className="w-full bg-white text-black rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-white/30"
                value={selectedProperty}
                onChange={(event) =>
                  setSelectedProperty(event.target.value)
                }
              >
                <option value="all">
                  All properties
                </option>

                {properties.map((property) => (
                  <option
                    key={property.id}
                    value={property.id}
                  >
                    {property.property_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 pb-20 space-y-8">
        <div className="flex flex-wrap gap-3">
          <a
            href="/dashboard/channel-manager"
            className="bg-white border border-gray-200 px-5 py-3 rounded-2xl text-sm font-semibold hover:bg-black hover:text-white transition"
          >
            ← Back to Light Channel Manager
          </a>

          <a
            href="/dashboard"
            className="bg-white border border-gray-200 px-5 py-3 rounded-2xl text-sm font-semibold hover:bg-black hover:text-white transition"
          >
            Back to Dashboard
          </a>
        </div>

        {loading && (
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-black/5">
            Loading calendar sources...
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 text-red-700 rounded-3xl p-6 border border-red-100">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 text-emerald-700 rounded-3xl p-6 border border-emerald-100">
            {successMessage}
          </div>
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-5">
          <Card
            title="Sources"
            value={`${filteredSources.length}`}
            description="Calendar sources saved for this view."
            icon="📡"
          />

          <Card
            title="Active"
            value={`${activeSources}`}
            description="Sources currently marked as active."
            icon="✅"
          />

          <Card
            title="Airbnb / Booking"
            value={`${airbnbSources}/${bookingSources}`}
            description="Main OTA iCal sources configured."
            icon="🏠"
          />

          <Card
            title="Not synced"
            value={`${notSyncedSources}`}
            description="Sources waiting for sync."
            icon="⏳"
          />

          <Card
            title="Errors"
            value={`${errorSources}`}
            description="Sources with failed last sync."
            icon="⚠️"
          />
        </div>

        <Section
          icon="➕"
          title="Add Calendar Source"
          description="Add an iCal feed URL from Airbnb, Booking.com, direct booking tools or another calendar provider."
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <FieldLabel
                title="Property"
                description="Select the property connected to this iCal source."
              />

              <select
                className="w-full border border-gray-200 rounded-2xl p-4 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                value={form.property_id}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    property_id: event.target.value,
                  }))
                }
              >
                <option value="">
                  Select property
                </option>

                {properties.map((property) => (
                  <option
                    key={property.id}
                    value={property.id}
                  >
                    {property.property_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel
                title="Source type"
                description="Choose where this calendar feed comes from."
              />

              <select
                className="w-full border border-gray-200 rounded-2xl p-4 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                value={form.source_type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    source_type: event.target.value,
                  }))
                }
              >
                <option value="airbnb">Airbnb</option>
                <option value="booking">Booking.com</option>
                <option value="direct">Direct</option>
                <option value="owner">Owner</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <FieldLabel
                title="Source name"
                description="Friendly name shown inside the Light Channel Manager."
              />

              <input
                className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-black/20"
                placeholder="Example: Airbnb - Maltese Maisonette"
                value={form.source_name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    source_name: event.target.value,
                  }))
                }
              />
            </div>

            <div>
              <FieldLabel
                title="Status"
                description="Inactive sources will be ignored by the sync engine."
              />

              <select
                className="w-full border border-gray-200 rounded-2xl p-4 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                value={form.is_active ? "true" : "false"}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    is_active:
                      event.target.value === "true",
                  }))
                }
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <FieldLabel
                title="ICS URL"
                description="Paste the full iCal export URL from Airbnb, Booking.com or another calendar provider."
              />

              <input
                className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-black/20"
                placeholder="https://www.airbnb.com/calendar/ical/..."
                value={form.ics_url}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    ics_url: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <button
            onClick={createCalendarSource}
            disabled={saving || loading}
            className="mt-5 bg-black text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50"
          >
            {saving
              ? "Saving source..."
              : "Add Calendar Source"}
          </button>
        </Section>

        <Section
          icon="📡"
          title="Saved Calendar Sources"
          description="Existing iCal sources saved in the database. Use Sync Now to import bookings from active iCal sources."
        >
          <div className="space-y-4">
            {filteredSources.length === 0 && (
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 text-gray-500">
                <div className="font-semibold text-gray-900 mb-1">No calendar sources saved yet</div>
                <div className="text-sm text-gray-600">Add your first iCal URL above to start importing bookings.</div>
              </div>
            )}

            {filteredSources.map((source) => (
              <div
                key={source.id}
                className="border border-gray-100 rounded-3xl p-5 bg-gray-50"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-lg">
                      {source.source_name}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {getPropertyName(source.property_id)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`text-xs border px-3 py-1 rounded-full ${getSourceBadgeClass(
                        source.source_type
                      )}`}
                    >
                      {getSourceTypeLabel(
                        source.source_type
                      )}
                    </span>

                    <span
                      className={`text-xs border px-3 py-1 rounded-full ${
                        source.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-gray-50 text-gray-700 border-gray-100"
                      }`}
                    >
                      {source.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>

                    <span
                      className={`text-xs border px-3 py-1 rounded-full ${getSyncBadgeClass(
                        source.last_sync_status
                      )}`}
                    >
                      {source.last_sync_status ||
                        "not_synced"}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 mb-1">
                      ICS URL
                    </div>

                    <div className="font-mono text-xs bg-white border border-gray-100 rounded-2xl p-3 break-all">
                      {source.ics_url}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 mb-1">
                      Last sync
                    </div>

                    <div className="font-semibold">
                      {formatDateTime(source.last_sync_at)}
                    </div>

                    {source.last_sync_error && (
                      <p className="text-sm text-red-600 mt-2 leading-relaxed">
                        {source.last_sync_error}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    onClick={() =>
                      syncCalendarSource(source.id)
                    }
                    disabled={
                      loading ||
                      syncingSourceId === source.id ||
                      !source.is_active
                    }
                    className="bg-black text-white px-5 py-3 rounded-2xl text-sm font-semibold disabled:opacity-50"
                  >
                    {syncingSourceId === source.id
                      ? "Syncing..."
                      : "Sync Now"}
                  </button>

                  <button
                    onClick={() =>
                      deleteCalendarSource(source.id)
                    }
                    disabled={
                      syncingSourceId === source.id ||
                      loading
                    }
                    className="bg-red-50 text-red-700 px-5 py-3 rounded-2xl text-sm font-semibold border border-red-100 disabled:opacity-50"
                  >
                    Delete Source
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          icon="📜"
          title="Recent Sync Logs"
          description="Latest calendar sync attempts with imported events, created bookings, updated bookings and errors."
        >
          <div className="space-y-4">
            {filteredLogs.length === 0 && (
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 text-gray-500">
                <div className="font-semibold text-gray-900 mb-1">No sync logs yet</div>
                <div className="text-sm text-gray-600">Run a manual sync on any active source to populate recent activity.</div>
              </div>
            )}

            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-100 rounded-3xl p-5 bg-gray-50"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-lg">
                      {log.booking_sources?.source_name ||
                        "Calendar source"}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {log.properties?.property_name ||
                        "Unknown property"}{" "}
                      · {formatDateTime(log.synced_at)}
                    </p>
                  </div>

                  <span
                    className={`text-xs border px-3 py-1 rounded-full ${getSyncBadgeClass(
                      log.status
                    )}`}
                  >
                    {log.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="text-gray-400">
                      Events found
                    </div>

                    <div className="font-bold text-lg">
                      {log.events_found}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="text-gray-400">
                      Created
                    </div>

                    <div className="font-bold text-lg">
                      {log.bookings_created}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="text-gray-400">
                      Updated
                    </div>

                    <div className="font-bold text-lg">
                      {log.bookings_updated}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="text-gray-400">
                      Skipped
                    </div>

                    <div className="font-bold text-lg">
                      {log.bookings_skipped}
                    </div>
                  </div>
                </div>

                {log.error_message && (
                  <div className="mt-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-sm leading-relaxed">
                    {log.error_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      </main>
    </div>
  );
}