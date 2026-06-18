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

type Booking = {
  id: string;
  property_id: string;
  source_id?: string | null;
  source_type: string;
  source_name?: string | null;
  external_event_id?: string | null;
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  checkin_date: string;
  checkout_date: string;
  guest_count: number;
  status: string;
  notes?: string | null;
  cleaning_task_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type BookingEditForm = {
  id: string;
  guest_name: string;
  source_type: string;
  checkin_date: string;
  checkout_date: string;
  guest_count: string;
  status: string;
  notes: string;
};

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getCurrentMonthValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");

  return `${year}-${month}`;
}

function getMonthRange(monthValue: string) {
  const [yearText, monthText] = monthValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!year || !month) {
    return null;
  }

  const start = `${yearText}-${monthText}-01`;
  const nextMonthDate = new Date(year, month, 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonth = `${nextMonthDate.getMonth() + 1}`.padStart(
    2,
    "0"
  );

  return {
    start,
    end: `${nextYear}-${nextMonth}-01`,
  };
}

function bookingOverlapsMonth(
  booking: Booking,
  monthValue: string
) {
  const range = getMonthRange(monthValue);

  if (!range) {
    return true;
  }

  return (
    booking.checkin_date < range.end &&
    booking.checkout_date > range.start
  );
}

function getSourceLabel(value: string) {
  switch (value) {
    case "airbnb":
      return "Airbnb";
    case "booking":
      return "Booking.com";
    case "direct":
      return "Direct";
    case "whatsapp":
      return "WhatsApp";
    case "manual":
      return "Manual";
    case "owner":
      return "Owner Stay";
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
    case "whatsapp":
      return "bg-green-50 text-green-700 border-green-100";
    case "owner":
      return "bg-purple-50 text-purple-700 border-purple-100";
    case "manual":
      return "bg-zinc-50 text-zinc-700 border-zinc-100";
    default:
      return "bg-gray-50 text-gray-700 border-gray-100";
  }
}

function getStatusBadgeClass(value: string) {
  switch (value) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-100";
    default:
      return "bg-gray-50 text-gray-700 border-gray-100";
  }
}

function differenceInNights(
  checkinDate: string,
  checkoutDate: string
) {
  const start = new Date(`${checkinDate}T00:00:00`);
  const end = new Date(`${checkoutDate}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(
      (end.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
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

          <div className="text-3xl font-bold text-gray-950">
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
    <section className="bg-white rounded-[32px] p-7 shadow-xl border border-black/5">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {icon} {title}
        </h2>

        <p className="text-gray-500 leading-relaxed">
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

export default function BookingManagementPage() {
  const [properties, setProperties] =
    useState<Property[]>([]);

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [selectedProperty, setSelectedProperty] =
    useState("all");

  const [selectedSource, setSelectedSource] =
    useState("all");

  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonthValue());

  const [editingBookingId, setEditingBookingId] =
    useState("");

  const [editForm, setEditForm] =
    useState<BookingEditForm | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingBookingId, setDeletingBookingId] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      setErrorMessage("");

      await Promise.all([
        loadProperties(),
        loadBookings(),
      ]);
    } catch (error) {
      console.error("BOOKING MANAGEMENT LOAD ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load bookings"
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

  async function loadBookings() {
    const response = await fetch("/api/bookings");
    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.error || "Unable to load bookings"
      );
    }

    setBookings((data.bookings || []) as Booking[]);
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (
        selectedProperty !== "all" &&
        booking.property_id !== selectedProperty
      ) {
        return false;
      }

      if (
        selectedSource !== "all" &&
        booking.source_type !== selectedSource
      ) {
        return false;
      }

      if (
        selectedMonth &&
        !bookingOverlapsMonth(booking, selectedMonth)
      ) {
        return false;
      }

      return true;
    });
  }, [
    bookings,
    selectedProperty,
    selectedSource,
    selectedMonth,
  ]);

  const manualBookings = filteredBookings.filter(
    (booking) => booking.source_type === "manual"
  ).length;

  const importedBookings = filteredBookings.filter(
    (booking) => booking.source_type !== "manual"
  ).length;

  const linkedCleaningBookings =
    filteredBookings.filter(
      (booking) => booking.cleaning_task_id
    ).length;

  const totalNights = filteredBookings.reduce(
    (total, booking) =>
      total +
      differenceInNights(
        booking.checkin_date,
        booking.checkout_date
      ),
    0
  );

  function getPropertyName(propertyId: string) {
    const property = properties.find(
      (item) => item.id === propertyId
    );

    return (
      property?.property_name ||
      "Unknown property"
    );
  }

  function startEditing(booking: Booking) {
    setEditingBookingId(booking.id);

    setEditForm({
      id: booking.id,
      guest_name: booking.guest_name || "",
      source_type: booking.source_type || "manual",
      checkin_date: booking.checkin_date || "",
      checkout_date: booking.checkout_date || "",
      guest_count: `${booking.guest_count || 1}`,
      status: booking.status || "confirmed",
      notes: booking.notes || "",
    });
  }

  function cancelEditing() {
    setEditingBookingId("");
    setEditForm(null);
  }

  async function saveBooking() {
    if (!editForm) {
      return;
    }

    if (!editForm.checkin_date || !editForm.checkout_date) {
      alert("Check-in and check-out dates are required");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/bookings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editForm.id,
          guest_name:
            editForm.guest_name || "Unnamed booking",
          source_type: editForm.source_type,
          source_name: getSourceLabel(editForm.source_type),
          checkin_date: editForm.checkin_date,
          checkout_date: editForm.checkout_date,
          guest_count:
            Number(editForm.guest_count) || 1,
          status: editForm.status,
          notes: editForm.notes || null,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Unable to update booking"
        );
      }

      await loadBookings();

      cancelEditing();

      alert("Booking updated");
    } catch (error) {
      console.error("UPDATE BOOKING UI ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to update booking"
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteBooking(booking: Booking) {
    const warning = booking.cleaning_task_id
      ? "This booking has a linked cleaning task. Delete booking anyway?"
      : "Delete this booking?";

    const confirmDelete = confirm(warning);

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingBookingId(booking.id);

      const response = await fetch(
        `/api/bookings?id=${encodeURIComponent(booking.id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Unable to delete booking"
        );
      }

      await loadBookings();

      alert("Booking deleted");
    } catch (error) {
      console.error("DELETE BOOKING UI ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete booking"
      );
    } finally {
      setDeletingBookingId("");
    }
  }

  async function bulkDeleteCurrentView() {
    if (filteredBookings.length === 0) {
      alert("No bookings to delete in the current view");
      return;
    }

    const confirmBulkDelete = confirm(
      `Delete ${filteredBookings.length} bookings in the current filtered view? This cannot be undone.`
    );

    if (!confirmBulkDelete) {
      return;
    }

    try {
      setDeletingBookingId("bulk");

      for (const booking of filteredBookings) {
        const response = await fetch(
          `/api/bookings?id=${encodeURIComponent(booking.id)}`,
          {
            method: "DELETE",
          }
        );

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.error ||
              `Unable to delete booking ${booking.id}`
          );
        }
      }

      await loadBookings();

      alert("Filtered bookings deleted");
    } catch (error) {
      console.error("BULK DELETE BOOKINGS UI ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete filtered bookings"
      );
    } finally {
      setDeletingBookingId("");
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white px-6 py-10 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div>
            <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-4">
              AI CO-HOST LIGHT CHANNEL MANAGER
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Booking Management
            </h1>

            <p className="text-white/70 text-lg max-w-2xl leading-relaxed">
              Edit, clean up and delete manual or imported bookings without
              touching Supabase directly.
            </p>
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
            href="/dashboard/channel-manager/sources"
            className="bg-white border border-gray-200 px-5 py-3 rounded-2xl text-sm font-semibold hover:bg-black hover:text-white transition"
          >
            Calendar Sources
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
            Loading bookings...
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 text-red-700 rounded-3xl p-6 border border-red-100">
            {errorMessage}
          </div>
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-5">
          <Card
            title="Bookings"
            value={`${filteredBookings.length}`}
            description="Bookings matching current filters."
            icon="🛎️"
          />

          <Card
            title="Manual"
            value={`${manualBookings}`}
            description="Bookings created manually."
            icon="✍️"
          />

          <Card
            title="Imported"
            value={`${importedBookings}`}
            description="Bookings imported from sources."
            icon="📡"
          />

          <Card
            title="Nights"
            value={`${totalNights}`}
            description="Total booked nights in current view."
            icon="🌙"
          />

          <Card
            title="Cleaning linked"
            value={`${linkedCleaningBookings}`}
            description="Bookings already linked to cleaning tasks."
            icon="🧹"
          />
        </div>

        <Section
          icon="🔎"
          title="Filters"
          description="Filter bookings by property, source and month before editing or deleting."
        >
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <FieldLabel
                title="Property"
                description="Choose property."
              />

              <select
                className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
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

            <div>
              <FieldLabel
                title="Source"
                description="Manual or imported."
              />

              <select
                className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                value={selectedSource}
                onChange={(event) =>
                  setSelectedSource(event.target.value)
                }
              >
                <option value="all">All sources</option>
                <option value="manual">Manual</option>
                <option value="airbnb">Airbnb</option>
                <option value="booking">Booking.com</option>
                <option value="direct">Direct</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="owner">Owner Stay</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <FieldLabel
                title="Month"
                description="Month view."
              />

              <input
                type="month"
                className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                value={selectedMonth}
                onChange={(event) =>
                  setSelectedMonth(event.target.value)
                }
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={bulkDeleteCurrentView}
                disabled={
                  deletingBookingId === "bulk" ||
                  filteredBookings.length === 0
                }
                className="w-full bg-red-50 text-red-700 px-5 py-4 rounded-2xl text-sm font-semibold border border-red-100 disabled:opacity-50"
              >
                {deletingBookingId === "bulk"
                  ? "Deleting..."
                  : "Delete Filtered View"}
              </button>
            </div>
          </div>
        </Section>

        <Section
          icon="🗂️"
          title="Bookings"
          description="Edit or delete bookings. Imported bookings can be corrected manually when needed."
        >
          <div className="space-y-4">
            {filteredBookings.length === 0 && (
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 text-gray-500">
                No bookings found for current filters.
              </div>
            )}

            {filteredBookings.map((booking) => {
              const isEditing =
                editingBookingId === booking.id &&
                editForm;

              return (
                <div
                  key={booking.id}
                  className="border border-gray-100 rounded-3xl p-5 bg-gray-50"
                >
                  {!isEditing && (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div>
                          <h3 className="font-bold text-lg">
                            {booking.guest_name ||
                              "Unnamed booking"}
                          </h3>

                          <p className="text-sm text-gray-500">
                            {getPropertyName(
                              booking.property_id
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`text-xs border px-3 py-1 rounded-full ${getSourceBadgeClass(
                              booking.source_type
                            )}`}
                          >
                            {getSourceLabel(
                              booking.source_type
                            )}
                          </span>

                          <span
                            className={`text-xs border px-3 py-1 rounded-full ${getStatusBadgeClass(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>

                          {booking.external_event_id && (
                            <span className="text-xs border px-3 py-1 rounded-full bg-white text-gray-700 border-gray-200">
                              Imported
                            </span>
                          )}

                          {booking.cleaning_task_id && (
                            <span className="text-xs border px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border-emerald-100">
                              Cleaning linked
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-gray-400">
                            Check-in
                          </div>

                          <div className="font-semibold">
                            {formatDate(booking.checkin_date)}
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-400">
                            Check-out
                          </div>

                          <div className="font-semibold">
                            {formatDate(booking.checkout_date)}
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-400">
                            Guests / Nights
                          </div>

                          <div className="font-semibold">
                            {booking.guest_count || 1} guests ·{" "}
                            {differenceInNights(
                              booking.checkin_date,
                              booking.checkout_date
                            )}{" "}
                            nights
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-400">
                            Source name
                          </div>

                          <div className="font-semibold">
                            {booking.source_name ||
                              getSourceLabel(
                                booking.source_type
                              )}
                          </div>
                        </div>
                      </div>

                      {booking.notes && (
                        <p className="text-sm text-gray-500 mt-4">
                          {booking.notes}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 mt-4">
                        <button
                          onClick={() =>
                            startEditing(booking)
                          }
                          className="bg-black text-white px-5 py-3 rounded-2xl text-sm font-semibold"
                        >
                          Edit Booking
                        </button>

                        <button
                          onClick={() =>
                            deleteBooking(booking)
                          }
                          disabled={
                            deletingBookingId ===
                            booking.id
                          }
                          className="bg-red-50 text-red-700 px-5 py-3 rounded-2xl text-sm font-semibold border border-red-100 disabled:opacity-50"
                        >
                          {deletingBookingId ===
                          booking.id
                            ? "Deleting..."
                            : "Delete Booking"}
                        </button>
                      </div>
                    </>
                  )}

                  {isEditing && editForm && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg">
                        Edit booking
                      </h3>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <FieldLabel
                            title="Guest name"
                            description="Guest or reference name."
                          />

                          <input
                            className="w-full border border-gray-200 rounded-2xl p-4"
                            value={editForm.guest_name}
                            onChange={(event) =>
                              setEditForm((current) =>
                                current
                                  ? {
                                      ...current,
                                      guest_name:
                                        event.target.value,
                                    }
                                  : current
                              )
                            }
                          />
                        </div>

                        <div>
                          <FieldLabel
                            title="Source"
                            description="Booking source."
                          />

                          <select
                            className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                            value={editForm.source_type}
                            onChange={(event) =>
                              setEditForm((current) =>
                                current
                                  ? {
                                      ...current,
                                      source_type:
                                        event.target.value,
                                    }
                                  : current
                              )
                            }
                          >
                            <option value="manual">
                              Manual
                            </option>
                            <option value="airbnb">
                              Airbnb
                            </option>
                            <option value="booking">
                              Booking.com
                            </option>
                            <option value="direct">
                              Direct
                            </option>
                            <option value="whatsapp">
                              WhatsApp
                            </option>
                            <option value="owner">
                              Owner Stay
                            </option>
                            <option value="other">
                              Other
                            </option>
                          </select>
                        </div>

                        <div>
                          <FieldLabel
                            title="Check-in"
                            description="Arrival date."
                          />

                          <input
                            type="date"
                            className="w-full border border-gray-200 rounded-2xl p-4"
                            value={editForm.checkin_date}
                            onChange={(event) =>
                              setEditForm((current) =>
                                current
                                  ? {
                                      ...current,
                                      checkin_date:
                                        event.target.value,
                                    }
                                  : current
                              )
                            }
                          />
                        </div>

                        <div>
                          <FieldLabel
                            title="Check-out"
                            description="Departure date."
                          />

                          <input
                            type="date"
                            className="w-full border border-gray-200 rounded-2xl p-4"
                            value={editForm.checkout_date}
                            onChange={(event) =>
                              setEditForm((current) =>
                                current
                                  ? {
                                      ...current,
                                      checkout_date:
                                        event.target.value,
                                    }
                                  : current
                              )
                            }
                          />
                        </div>

                        <div>
                          <FieldLabel
                            title="Guests"
                            description="Number of guests."
                          />

                          <input
                            type="number"
                            min="1"
                            className="w-full border border-gray-200 rounded-2xl p-4"
                            value={editForm.guest_count}
                            onChange={(event) =>
                              setEditForm((current) =>
                                current
                                  ? {
                                      ...current,
                                      guest_count:
                                        event.target.value,
                                    }
                                  : current
                              )
                            }
                          />
                        </div>

                        <div>
                          <FieldLabel
                            title="Status"
                            description="Booking status."
                          />

                          <select
                            className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                            value={editForm.status}
                            onChange={(event) =>
                              setEditForm((current) =>
                                current
                                  ? {
                                      ...current,
                                      status:
                                        event.target.value,
                                    }
                                  : current
                              )
                            }
                          >
                            <option value="confirmed">
                              Confirmed
                            </option>
                            <option value="pending">
                              Pending
                            </option>
                            <option value="cancelled">
                              Cancelled
                            </option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <FieldLabel
                            title="Notes"
                            description="Internal notes."
                          />

                          <input
                            className="w-full border border-gray-200 rounded-2xl p-4"
                            value={editForm.notes}
                            onChange={(event) =>
                              setEditForm((current) =>
                                current
                                  ? {
                                      ...current,
                                      notes:
                                        event.target.value,
                                    }
                                  : current
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={saveBooking}
                          disabled={saving}
                          className="bg-black text-white px-5 py-3 rounded-2xl text-sm font-semibold disabled:opacity-50"
                        >
                          {saving
                            ? "Saving..."
                            : "Save Booking"}
                        </button>

                        <button
                          onClick={cancelEditing}
                          className="bg-white border border-gray-200 px-5 py-3 rounded-2xl text-sm font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      </main>
    </div>
  );
}