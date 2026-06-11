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

type RelatedProperty = {
  id: string;
  property_name: string;
  slug?: string | null;
};

type Booking = {
  id: string;
  property_id: string;
  source_type: string;
  source_name?: string | null;
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  checkin_date: string;
  checkout_date: string;
  guest_count: number;
  status: string;
  notes?: string | null;
  cleaning_task_id?: string | null;
  properties?: RelatedProperty | null;
};

type BlockedDate = {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  notes?: string | null;
  properties?: RelatedProperty | null;
};

type BookingForm = {
  property_id: string;
  guest_name: string;
  source_type: string;
  checkin_date: string;
  checkout_date: string;
  guest_count: string;
  status: string;
  notes: string;
};

type BlockedDateForm = {
  property_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  notes: string;
};

type CalendarDay = {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  bookings: Booking[];
  checkins: Booking[];
  checkouts: Booking[];
  blockedDates: BlockedDate[];
};

type TurnoverItem = {
  booking: Booking;
  nextBooking: Booking | null;
  daysToNextCheckin: number | null;
  priority: "High" | "Normal";
  label: string;
};

const emptyBookingForm: BookingForm = {
  property_id: "",
  guest_name: "",
  source_type: "manual",
  checkin_date: "",
  checkout_date: "",
  guest_count: "1",
  status: "confirmed",
  notes: "",
};

const emptyBlockedDateForm: BlockedDateForm = {
  property_id: "",
  start_date: "",
  end_date: "",
  reason: "Unavailable",
  notes: "",
};

function toDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);

  return next;
}

function getMonthStart(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

function getMonthEnd(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  );
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function datesOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: Date,
  secondEnd: Date
) {
  const start = toDate(firstStart);
  const end = toDate(firstEnd);

  return start < secondEnd && end > secondStart;
}

function isDateInsideStay(
  dateKey: string,
  checkinDate: string,
  checkoutDate: string
) {
  const date = toDate(dateKey);
  const checkin = toDate(checkinDate);
  const checkout = toDate(checkoutDate);

  return date >= checkin && date < checkout;
}

function isSameDate(dateKey: string, value: string) {
  return dateKey === value;
}

function differenceInNights(
  startDate: string,
  endDate: string
) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = toDate(startDate);
  const end = toDate(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 0;
  }

  const diff = end.getTime() - start.getTime();

  return Math.max(
    0,
    Math.round(diff / (1000 * 60 * 60 * 24))
  );
}

function nightsInsideMonth(
  startDate: string,
  endDate: string,
  monthDate: Date
) {
  const monthStart = getMonthStart(monthDate);
  const monthEndExclusive = addDays(
    getMonthEnd(monthDate),
    1
  );

  const start = toDate(startDate);
  const end = toDate(endDate);

  const effectiveStart =
    start > monthStart ? start : monthStart;

  const effectiveEnd =
    end < monthEndExclusive ? end : monthEndExclusive;

  if (effectiveEnd <= effectiveStart) {
    return 0;
  }

  return Math.round(
    (effectiveEnd.getTime() - effectiveStart.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function daysInMonth(date: Date) {
  return getMonthEnd(date).getDate();
}

function daysBetween(startDate: string, endDate: string) {
  return differenceInNights(startDate, endDate);
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(toDate(value));
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

export default function ChannelManagerPage() {
  const [properties, setProperties] =
    useState<Property[]>([]);

  const [selectedProperty, setSelectedProperty] =
    useState("all");

  const [selectedMonth, setSelectedMonth] =
    useState(() => getMonthStart(new Date()));

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [blockedDates, setBlockedDates] =
    useState<BlockedDate[]>([]);

  const [bookingForm, setBookingForm] =
    useState<BookingForm>(emptyBookingForm);

  const [blockedDateForm, setBlockedDateForm] =
    useState<BlockedDateForm>(emptyBlockedDateForm);

  const [loading, setLoading] =
    useState(true);

  const [savingBooking, setSavingBooking] =
    useState(false);

  const [savingBlockedDate, setSavingBlockedDate] =
    useState(false);

  const [creatingCleaningTaskId, setCreatingCleaningTaskId] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (properties.length === 0) {
      return;
    }

    setBookingForm((current) => ({
      ...current,
      property_id:
        current.property_id || properties[0].id,
    }));

    setBlockedDateForm((current) => ({
      ...current,
      property_id:
        current.property_id || properties[0].id,
    }));
  }, [properties]);

  async function loadInitialData() {
    try {
      setLoading(true);
      setErrorMessage("");

      await Promise.all([
        loadProperties(),
        loadBookings(),
        loadBlockedDates(),
      ]);
    } catch (error) {
      console.error("CHANNEL MANAGER LOAD ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load channel manager data"
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

  async function loadBlockedDates() {
    const response = await fetch("/api/blocked-dates");
    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.error || "Unable to load blocked dates"
      );
    }

    setBlockedDates(
      (data.blocked_dates || []) as BlockedDate[]
    );
  }

  const visibleBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (
        selectedProperty !== "all" &&
        booking.property_id !== selectedProperty
      ) {
        return false;
      }

      return datesOverlap(
        booking.checkin_date,
        booking.checkout_date,
        getMonthStart(selectedMonth),
        addDays(getMonthEnd(selectedMonth), 1)
      );
    });
  }, [bookings, selectedProperty, selectedMonth]);

  const visibleBlockedDates = useMemo(() => {
    return blockedDates.filter((blockedDate) => {
      if (
        selectedProperty !== "all" &&
        blockedDate.property_id !== selectedProperty
      ) {
        return false;
      }

      return datesOverlap(
        blockedDate.start_date,
        blockedDate.end_date,
        getMonthStart(selectedMonth),
        addDays(getMonthEnd(selectedMonth), 1)
      );
    });
  }, [blockedDates, selectedProperty, selectedMonth]);

  const occupiedNights = visibleBookings.reduce(
    (total, booking) =>
      total +
      nightsInsideMonth(
        booking.checkin_date,
        booking.checkout_date,
        selectedMonth
      ),
    0
  );

  const blockedNights = visibleBlockedDates.reduce(
    (total, blockedDate) =>
      total +
      nightsInsideMonth(
        blockedDate.start_date,
        blockedDate.end_date,
        selectedMonth
      ),
    0
  );

  const totalMonthNights = daysInMonth(selectedMonth);

  const availableNights = Math.max(
    0,
    totalMonthNights - blockedNights
  );

  const occupancyRate =
    availableNights > 0
      ? Math.round(
          (occupiedNights / availableNights) * 100
        )
      : 0;

  const upcomingCheckins =
    visibleBookings.filter((booking) =>
      booking.checkin_date.startsWith(
        `${selectedMonth.getFullYear()}-${`${selectedMonth.getMonth() + 1}`.padStart(2, "0")}`
      )
    ).length;

  const calendarDays = useMemo<CalendarDay[]>(() => {
    const monthStart = getMonthStart(selectedMonth);
    const monthEnd = getMonthEnd(selectedMonth);

    const startDay = monthStart.getDay();
    const mondayOffset =
      startDay === 0 ? -6 : 1 - startDay;

    const calendarStart = addDays(
      monthStart,
      mondayOffset
    );

    const endDay = monthEnd.getDay();
    const sundayOffset =
      endDay === 0 ? 0 : 7 - endDay;

    const calendarEnd = addDays(
      monthEnd,
      sundayOffset
    );

    const days: CalendarDay[] = [];

    let cursor = calendarStart;

    while (cursor <= calendarEnd) {
      const dateKey = toDateKey(cursor);

      const dayBookings = visibleBookings.filter(
        (booking) =>
          isDateInsideStay(
            dateKey,
            booking.checkin_date,
            booking.checkout_date
          )
      );

      const checkins = visibleBookings.filter(
        (booking) =>
          isSameDate(dateKey, booking.checkin_date)
      );

      const checkouts = visibleBookings.filter(
        (booking) =>
          isSameDate(dateKey, booking.checkout_date)
      );

      const dayBlockedDates = visibleBlockedDates.filter(
        (blockedDate) =>
          isDateInsideStay(
            dateKey,
            blockedDate.start_date,
            blockedDate.end_date
          )
      );

      days.push({
        date: new Date(cursor),
        dateKey,
        dayNumber: cursor.getDate(),
        isCurrentMonth:
          cursor.getMonth() === selectedMonth.getMonth(),
        bookings: dayBookings,
        checkins,
        checkouts,
        blockedDates: dayBlockedDates,
      });

      cursor = addDays(cursor, 1);
    }

    return days;
  }, [
    selectedMonth,
    visibleBookings,
    visibleBlockedDates,
  ]);

  const turnoverItems = useMemo<TurnoverItem[]>(() => {
    const confirmedBookings = bookings
      .filter((booking) => {
        if (booking.status !== "confirmed") {
          return false;
        }

        if (
          selectedProperty !== "all" &&
          booking.property_id !== selectedProperty
        ) {
          return false;
        }

        return datesOverlap(
          booking.checkin_date,
          booking.checkout_date,
          getMonthStart(selectedMonth),
          addDays(getMonthEnd(selectedMonth), 1)
        );
      })
      .sort((a, b) =>
        a.checkout_date.localeCompare(b.checkout_date)
      );

    return confirmedBookings.map((booking) => {
      const nextBooking =
        bookings
          .filter(
            (candidate) =>
              candidate.property_id === booking.property_id &&
              candidate.status === "confirmed" &&
              candidate.id !== booking.id &&
              candidate.checkin_date >= booking.checkout_date
          )
          .sort((a, b) =>
            a.checkin_date.localeCompare(b.checkin_date)
          )[0] || null;

      const daysToNextCheckin = nextBooking
        ? daysBetween(
            booking.checkout_date,
            nextBooking.checkin_date
          )
        : null;

      let label = "No upcoming check-in";
      let priority: "High" | "Normal" = "Normal";

      if (daysToNextCheckin === 0) {
        label = "Same-day turnover";
        priority = "High";
      } else if (daysToNextCheckin === 1) {
        label = "Next-day turnover";
        priority = "High";
      } else if (
        typeof daysToNextCheckin === "number" &&
        daysToNextCheckin > 1
      ) {
        label = `${daysToNextCheckin}-day gap`;
      }

      return {
        booking,
        nextBooking,
        daysToNextCheckin,
        priority,
        label,
      };
    });
  }, [bookings, selectedProperty, selectedMonth]);

  const cleaningNeeded =
    turnoverItems.filter(
      (item) => !item.booking.cleaning_task_id
    ).length;

  async function createBooking() {
    if (!bookingForm.property_id) {
      alert("Select a property first");
      return;
    }

    if (
      !bookingForm.checkin_date ||
      !bookingForm.checkout_date
    ) {
      alert("Check-in and check-out dates are required");
      return;
    }

    try {
      setSavingBooking(true);

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property_id: bookingForm.property_id,
          guest_name:
            bookingForm.guest_name || "Manual booking",
          source_type: bookingForm.source_type,
          source_name: getSourceLabel(
            bookingForm.source_type
          ),
          checkin_date: bookingForm.checkin_date,
          checkout_date: bookingForm.checkout_date,
          guest_count:
            Number(bookingForm.guest_count) || 1,
          status: bookingForm.status,
          notes: bookingForm.notes || null,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Unable to create booking"
        );
      }

      setBookingForm((current) => ({
        ...emptyBookingForm,
        property_id: current.property_id,
      }));

      await loadBookings();

      alert("Booking added");
    } catch (error) {
      console.error("CREATE BOOKING UI ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to create booking"
      );
    } finally {
      setSavingBooking(false);
    }
  }

  async function deleteBooking(id: string) {
    const confirmDelete = confirm(
      "Delete this booking?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `/api/bookings?id=${encodeURIComponent(id)}`,
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
    } catch (error) {
      console.error("DELETE BOOKING UI ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete booking"
      );
    }
  }

  async function createBlockedDate() {
    if (!blockedDateForm.property_id) {
      alert("Select a property first");
      return;
    }

    if (
      !blockedDateForm.start_date ||
      !blockedDateForm.end_date
    ) {
      alert("Start and end dates are required");
      return;
    }

    try {
      setSavingBlockedDate(true);

      const response = await fetch(
        "/api/blocked-dates",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            property_id:
              blockedDateForm.property_id,
            start_date:
              blockedDateForm.start_date,
            end_date:
              blockedDateForm.end_date,
            reason:
              blockedDateForm.reason ||
              "Unavailable",
            notes:
              blockedDateForm.notes || null,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
            "Unable to create blocked date"
        );
      }

      setBlockedDateForm((current) => ({
        ...emptyBlockedDateForm,
        property_id: current.property_id,
      }));

      await loadBlockedDates();

      alert("Blocked date added");
    } catch (error) {
      console.error(
        "CREATE BLOCKED DATE UI ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to create blocked date"
      );
    } finally {
      setSavingBlockedDate(false);
    }
  }

  async function deleteBlockedDate(id: string) {
    const confirmDelete = confirm(
      "Delete this blocked date?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `/api/blocked-dates?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
            "Unable to delete blocked date"
        );
      }

      await loadBlockedDates();
    } catch (error) {
      console.error(
        "DELETE BLOCKED DATE UI ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete blocked date"
      );
    }
  }

  async function createCleaningTask(bookingId: string) {
    try {
      setCreatingCleaningTaskId(bookingId);

      const response = await fetch(
        "/api/channel-manager/create-cleaning-task",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            booking_id: bookingId,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
            "Unable to create cleaning task"
        );
      }

      await loadBookings();

      alert("Cleaning task created");
    } catch (error) {
      console.error(
        "CREATE CLEANING TASK UI ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to create cleaning task"
      );
    } finally {
      setCreatingCleaningTaskId("");
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

  function goToPreviousMonth() {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() - 1,
        1
      )
    );
  }

  function goToNextMonth() {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        1
      )
    );
  }

  function goToCurrentMonth() {
    setSelectedMonth(getMonthStart(new Date()));
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white px-6 py-10 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-4">
                AI CO-HOST OPERATIONS
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Light Channel Manager
              </h1>

              <p className="text-white/70 text-lg max-w-2xl leading-relaxed">
                Unified calendar for bookings, blocked dates, occupancy and
                cleaning turnover planning.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/10 min-w-[280px]">
              <label className="block text-white/60 text-sm mb-2">
                Property filter
              </label>

              <select
                className="w-full bg-white text-black rounded-2xl p-4"
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
            href="/dashboard"
            className="bg-white border border-gray-200 px-5 py-3 rounded-2xl text-sm font-semibold hover:bg-black hover:text-white transition"
          >
            ← Back to Dashboard
          </a>

          <a
            href="/dashboard/cleaning"
            className="bg-white border border-gray-200 px-5 py-3 rounded-2xl text-sm font-semibold hover:bg-black hover:text-white transition"
          >
            Open Cleaning
          </a>

          <a
            href="/dashboard/channel-manager/sources"
            className="bg-white border border-gray-200 px-5 py-3 rounded-2xl text-sm font-semibold hover:bg-black hover:text-white transition"
          >
            Calendar Sources
          </a>

          <a
            href="/dashboard/channel-manager/bookings"
            className="bg-white border border-gray-200 px-5 py-3 rounded-2xl text-sm font-semibold hover:bg-black hover:text-white transition"
          >
            Manage Bookings
          </a>

          <a
            href="/dashboard/qr"
            className="bg-white border border-gray-200 px-5 py-3 rounded-2xl text-sm font-semibold hover:bg-black hover:text-white transition"
          >
            Open QR/NFC
          </a>
        </div>

        {loading && (
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-black/5">
            Loading channel manager data...
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 text-red-700 rounded-3xl p-6 border border-red-100">
            {errorMessage}
          </div>
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-6 gap-5">
          <Card
            title="Occupancy"
            value={`${occupancyRate}%`}
            description={`Occupancy for ${getMonthLabel(selectedMonth)}.`}
            icon="📈"
          />

          <Card
            title="Occupied nights"
            value={`${occupiedNights}`}
            description="Booked nights inside the selected month."
            icon="🌙"
          />

          <Card
            title="Available nights"
            value={`${availableNights}`}
            description="Month nights minus blocked nights."
            icon="✅"
          />

          <Card
            title="Blocked nights"
            value={`${blockedNights}`}
            description="Unavailable nights inside the selected month."
            icon="⛔"
          />

          <Card
            title="Check-ins"
            value={`${upcomingCheckins}`}
            description="Arrivals in the selected month."
            icon="🔑"
          />

          <Card
            title="Cleaning needed"
            value={`${cleaningNeeded}`}
            description="Departures not yet linked to a cleaning task."
            icon="🧹"
          />
        </div>

        <Section
          icon="📅"
          title="Monthly Calendar"
          description="Visual monthly calendar showing bookings, check-ins, check-outs, blocked dates and turnover days."
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold">
                {getMonthLabel(selectedMonth)}
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Occupied nights: {occupiedNights} · Blocked nights:{" "}
                {blockedNights} · Available nights: {availableNights}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={goToPreviousMonth}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-2xl text-sm font-semibold"
              >
                ← Previous
              </button>

              <button
                onClick={goToCurrentMonth}
                className="bg-black text-white px-4 py-3 rounded-2xl text-sm font-semibold"
              >
                Current month
              </button>

              <button
                onClick={goToNextMonth}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-2xl text-sm font-semibold"
              >
                Next →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
              (day) => (
                <div
                  key={day}
                  className="text-xs font-bold text-gray-400 uppercase px-2"
                >
                  {day}
                </div>
              )
            )}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const hasBookings = day.bookings.length > 0;
              const hasBlockedDates =
                day.blockedDates.length > 0;
              const hasTurnover =
                day.checkins.length > 0 ||
                day.checkouts.length > 0;

              return (
                <div
                  key={day.dateKey}
                  className={`min-h-[130px] rounded-2xl border p-3 text-sm overflow-hidden ${
                    !day.isCurrentMonth
                      ? "bg-gray-50 border-gray-100 text-gray-300"
                      : hasBlockedDates
                        ? "bg-zinc-100 border-zinc-200 text-zinc-900"
                        : hasBookings
                          ? "bg-rose-50 border-rose-100 text-rose-950"
                          : "bg-white border-gray-100 text-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="font-bold">
                      {day.dayNumber}
                    </div>

                    {hasTurnover && (
                      <span className="text-[10px] bg-white/80 border border-gray-200 rounded-full px-2 py-0.5">
                        Turnover
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {day.checkins.slice(0, 1).map((booking) => (
                      <div
                        key={`checkin-${booking.id}`}
                        className="text-[11px] bg-emerald-100 text-emerald-800 rounded-lg px-2 py-1 truncate"
                      >
                        IN · {booking.guest_name || "Guest"}
                      </div>
                    ))}

                    {day.checkouts.slice(0, 1).map((booking) => (
                      <div
                        key={`checkout-${booking.id}`}
                        className="text-[11px] bg-yellow-100 text-yellow-800 rounded-lg px-2 py-1 truncate"
                      >
                        OUT · {booking.guest_name || "Guest"}
                      </div>
                    ))}

                    {day.bookings.slice(0, 2).map((booking) => (
                      <div
                        key={`stay-${booking.id}`}
                        className="text-[11px] bg-rose-100 text-rose-800 rounded-lg px-2 py-1 truncate"
                      >
                        {getSourceLabel(booking.source_type)} ·{" "}
                        {booking.guest_name || "Guest"}
                      </div>
                    ))}

                    {day.blockedDates.slice(0, 2).map((blockedDate) => (
                      <div
                        key={`blocked-${blockedDate.id}`}
                        className="text-[11px] bg-zinc-200 text-zinc-800 rounded-lg px-2 py-1 truncate"
                      >
                        Blocked · {blockedDate.reason}
                      </div>
                    ))}

                    {day.bookings.length +
                      day.blockedDates.length >
                      2 && (
                      <div className="text-[11px] text-gray-500">
                        + more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section
          icon="🧹"
          title="Turnover & Cleaning"
          description="Create cleaning tasks directly from confirmed booking check-outs."
        >
          <div className="space-y-4">
            {turnoverItems.length === 0 && (
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 text-gray-500">
                No turnover detected for this view.
              </div>
            )}

            {turnoverItems.map((item) => (
              <div
                key={`turnover-${item.booking.id}`}
                className="border border-gray-100 rounded-3xl p-5 bg-gray-50"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-lg">
                      Cleaning after{" "}
                      {item.booking.guest_name || "Guest"}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {getPropertyName(item.booking.property_id)} ·
                      Check-out on{" "}
                      {formatDate(item.booking.checkout_date)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`text-xs border px-3 py-1 rounded-full ${
                        item.priority === "High"
                          ? "bg-red-50 text-red-700 border-red-100"
                          : "bg-yellow-50 text-yellow-700 border-yellow-100"
                      }`}
                    >
                      {item.priority} priority
                    </span>

                    <span className="text-xs border px-3 py-1 rounded-full bg-white text-gray-700 border-gray-200">
                      {item.label}
                    </span>

                    {item.booking.cleaning_task_id && (
                      <span className="text-xs border px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border-emerald-100">
                        Cleaning linked
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-gray-400">
                      Current guest check-out
                    </div>

                    <div className="font-semibold">
                      {formatDate(item.booking.checkout_date)}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400">
                      Next check-in
                    </div>

                    <div className="font-semibold">
                      {item.nextBooking
                        ? formatDate(
                            item.nextBooking.checkin_date
                          )
                        : "No upcoming booking"}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400">
                      Cleaning status
                    </div>

                    <div className="font-semibold">
                      {item.booking.cleaning_task_id
                        ? "Cleaning task created"
                        : "Cleaning task not created"}
                    </div>
                  </div>
                </div>

                {item.nextBooking && (
                  <p className="text-sm text-gray-500 mt-4">
                    Next guest:{" "}
                    {item.nextBooking.guest_name || "Guest"} ·{" "}
                    {getSourceLabel(item.nextBooking.source_type)}
                  </p>
                )}

                <button
                  onClick={() =>
                    createCleaningTask(item.booking.id)
                  }
                  disabled={
                    Boolean(item.booking.cleaning_task_id) ||
                    creatingCleaningTaskId === item.booking.id
                  }
                  className={`mt-4 px-5 py-3 rounded-2xl text-sm font-semibold ${
                    item.booking.cleaning_task_id
                      ? "bg-emerald-100 text-emerald-700 cursor-not-allowed"
                      : "bg-black text-white hover:opacity-90"
                  } disabled:opacity-60`}
                >
                  {item.booking.cleaning_task_id
                    ? "Cleaning Task Created"
                    : creatingCleaningTaskId === item.booking.id
                      ? "Creating..."
                      : "Create Cleaning Task"}
                </button>
              </div>
            ))}
          </div>
        </Section>

        <div className="grid xl:grid-cols-2 gap-8">
          <Section
            icon="➕"
            title="Add Manual Booking"
            description="Create a booking manually for direct reservations, WhatsApp bookings, owner use or reservations not yet synced."
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <FieldLabel
                  title="Property"
                  description="Select the property for this booking."
                />

                <select
                  className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                  value={bookingForm.property_id}
                  onChange={(event) =>
                    setBookingForm((current) => ({
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
                  title="Guest name"
                  description="Guest name or booking reference."
                />

                <input
                  className="w-full border border-gray-200 rounded-2xl p-4"
                  placeholder="Example: John Smith"
                  value={bookingForm.guest_name}
                  onChange={(event) =>
                    setBookingForm((current) => ({
                      ...current,
                      guest_name: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <FieldLabel
                  title="Source"
                  description="Where this booking came from."
                />

                <select
                  className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                  value={bookingForm.source_type}
                  onChange={(event) =>
                    setBookingForm((current) => ({
                      ...current,
                      source_type: event.target.value,
                    }))
                  }
                >
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
                  title="Guests"
                  description="Number of guests."
                />

                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-200 rounded-2xl p-4"
                  value={bookingForm.guest_count}
                  onChange={(event) =>
                    setBookingForm((current) => ({
                      ...current,
                      guest_count: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <FieldLabel
                  title="Check-in date"
                  description="Arrival date."
                />

                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-2xl p-4"
                  value={bookingForm.checkin_date}
                  onChange={(event) =>
                    setBookingForm((current) => ({
                      ...current,
                      checkin_date: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <FieldLabel
                  title="Check-out date"
                  description="Departure date."
                />

                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-2xl p-4"
                  value={bookingForm.checkout_date}
                  onChange={(event) =>
                    setBookingForm((current) => ({
                      ...current,
                      checkout_date: event.target.value,
                    }))
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
                  value={bookingForm.status}
                  onChange={(event) =>
                    setBookingForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
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

              <div>
                <FieldLabel
                  title="Notes"
                  description="Optional booking notes."
                />

                <input
                  className="w-full border border-gray-200 rounded-2xl p-4"
                  placeholder="Optional notes"
                  value={bookingForm.notes}
                  onChange={(event) =>
                    setBookingForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <button
              onClick={createBooking}
              disabled={savingBooking}
              className="mt-5 bg-black text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50"
            >
              {savingBooking
                ? "Saving booking..."
                : "Add Booking"}
            </button>
          </Section>

          <Section
            icon="⛔"
            title="Add Blocked Date"
            description="Block dates for owner stays, maintenance, deep cleaning or private use."
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <FieldLabel
                  title="Property"
                  description="Select the property to block."
                />

                <select
                  className="w-full border border-gray-200 rounded-2xl p-4 bg-white"
                  value={blockedDateForm.property_id}
                  onChange={(event) =>
                    setBlockedDateForm((current) => ({
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
                  title="Reason"
                  description="Reason for blocking these dates."
                />

                <input
                  className="w-full border border-gray-200 rounded-2xl p-4"
                  placeholder="Example: Maintenance"
                  value={blockedDateForm.reason}
                  onChange={(event) =>
                    setBlockedDateForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <FieldLabel
                  title="Start date"
                  description="First unavailable date."
                />

                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-2xl p-4"
                  value={blockedDateForm.start_date}
                  onChange={(event) =>
                    setBlockedDateForm((current) => ({
                      ...current,
                      start_date: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <FieldLabel
                  title="End date"
                  description="Date when availability resumes."
                />

                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-2xl p-4"
                  value={blockedDateForm.end_date}
                  onChange={(event) =>
                    setBlockedDateForm((current) => ({
                      ...current,
                      end_date: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="md:col-span-2">
                <FieldLabel
                  title="Notes"
                  description="Optional blocked date notes."
                />

                <input
                  className="w-full border border-gray-200 rounded-2xl p-4"
                  placeholder="Optional notes"
                  value={blockedDateForm.notes}
                  onChange={(event) =>
                    setBlockedDateForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <button
              onClick={createBlockedDate}
              disabled={savingBlockedDate}
              className="mt-5 bg-black text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50"
            >
              {savingBlockedDate
                ? "Saving blocked date..."
                : "Add Blocked Date"}
            </button>
          </Section>
        </div>

        <div className="grid xl:grid-cols-2 gap-8">
          <Section
            icon="🛎️"
            title="Bookings"
            description="Stored bookings for the selected month and property view."
          >
            <div className="space-y-4">
              {visibleBookings.length === 0 && (
                <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 text-gray-500">
                  No bookings for this view.
                </div>
              )}

              {visibleBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-100 rounded-3xl p-5 bg-gray-50"
                >
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

                      {booking.cleaning_task_id && (
                        <span className="text-xs border px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border-emerald-100">
                          Cleaning linked
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3 text-sm">
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
                  </div>

                  {booking.notes && (
                    <p className="text-sm text-gray-500 mt-4">
                      {booking.notes}
                    </p>
                  )}

                  <button
                    onClick={() =>
                      deleteBooking(booking.id)
                    }
                    className="mt-4 text-sm text-red-600 font-semibold"
                  >
                    Delete booking
                  </button>
                </div>
              ))}
            </div>
          </Section>

          <Section
            icon="⛔"
            title="Blocked Dates"
            description="Unavailable dates for the selected month and property view."
          >
            <div className="space-y-4">
              {visibleBlockedDates.length === 0 && (
                <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 text-gray-500">
                  No blocked dates for this view.
                </div>
              )}

              {visibleBlockedDates.map((blockedDate) => (
                <div
                  key={blockedDate.id}
                  className="border border-gray-100 rounded-3xl p-5 bg-gray-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-bold text-lg">
                        {blockedDate.reason}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {getPropertyName(
                          blockedDate.property_id
                        )}
                      </p>
                    </div>

                    <span className="text-xs border px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 border-zinc-200">
                      Blocked
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-gray-400">
                        Start
                      </div>

                      <div className="font-semibold">
                        {formatDate(
                          blockedDate.start_date
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-400">
                        End
                      </div>

                      <div className="font-semibold">
                        {formatDate(
                          blockedDate.end_date
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-400">
                        Nights
                      </div>

                      <div className="font-semibold">
                        {differenceInNights(
                          blockedDate.start_date,
                          blockedDate.end_date
                        )}
                      </div>
                    </div>
                  </div>

                  {blockedDate.notes && (
                    <p className="text-sm text-gray-500 mt-4">
                      {blockedDate.notes}
                    </p>
                  )}

                  <button
                    onClick={() =>
                      deleteBlockedDate(blockedDate.id)
                    }
                    className="mt-4 text-sm text-red-600 font-semibold"
                  >
                    Delete blocked date
                  </button>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}