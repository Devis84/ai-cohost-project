"use client";

import { useMemo, useState } from "react";

type PropertyOption = {
  id: string;
  name: string;
  slug: string;
};

type BookingStatus =
  | "confirmed"
  | "pending"
  | "cancelled"
  | "blocked";

type BookingSource =
  | "Airbnb"
  | "Booking.com"
  | "Direct"
  | "WhatsApp"
  | "Manual"
  | "Owner Stay"
  | "Other";

type Booking = {
  id: string;
  propertySlug: string;
  guestName: string;
  source: BookingSource;
  checkin: string;
  checkout: string;
  guests: number;
  status: BookingStatus;
  notes?: string;
};

type BlockedDate = {
  id: string;
  propertySlug: string;
  startDate: string;
  endDate: string;
  reason: string;
  notes?: string;
};

type CalendarSource = {
  id: string;
  propertySlug: string;
  sourceName: string;
  sourceType: string;
  status: "Connected" | "Not connected" | "Error";
  lastSync: string;
};

const properties: PropertyOption[] = [
  {
    id: "1",
    name: "Maltese Maisonette",
    slug: "maltese-maisonette",
  },
  {
    id: "2",
    name: "Big House",
    slug: "big-house",
  },
  {
    id: "3",
    name: "Test Apartment",
    slug: "test-apartment",
  },
];

const demoBookings: Booking[] = [
  {
    id: "b1",
    propertySlug: "maltese-maisonette",
    guestName: "Sample Airbnb Guest",
    source: "Airbnb",
    checkin: "2026-06-18",
    checkout: "2026-06-22",
    guests: 2,
    status: "confirmed",
    notes: "Demo booking used to preview the Light Channel Manager layout.",
  },
  {
    id: "b2",
    propertySlug: "maltese-maisonette",
    guestName: "Direct Guest",
    source: "Direct",
    checkin: "2026-06-25",
    checkout: "2026-06-29",
    guests: 2,
    status: "confirmed",
    notes: "Manual/direct booking example.",
  },
  {
    id: "b3",
    propertySlug: "big-house",
    guestName: "Booking.com Guest",
    source: "Booking.com",
    checkin: "2026-06-20",
    checkout: "2026-06-24",
    guests: 4,
    status: "confirmed",
  },
];

const demoBlockedDates: BlockedDate[] = [
  {
    id: "bd1",
    propertySlug: "maltese-maisonette",
    startDate: "2026-06-30",
    endDate: "2026-07-02",
    reason: "Maintenance",
    notes: "Demo blocked date.",
  },
  {
    id: "bd2",
    propertySlug: "big-house",
    startDate: "2026-06-28",
    endDate: "2026-06-30",
    reason: "Owner stay",
    notes: "Demo owner stay.",
  },
];

const demoCalendarSources: CalendarSource[] = [
  {
    id: "s1",
    propertySlug: "maltese-maisonette",
    sourceName: "Airbnb Calendar",
    sourceType: "Airbnb ICS",
    status: "Not connected",
    lastSync: "Not synced yet",
  },
  {
    id: "s2",
    propertySlug: "maltese-maisonette",
    sourceName: "Booking.com Calendar",
    sourceType: "Booking.com ICS",
    status: "Not connected",
    lastSync: "Not synced yet",
  },
  {
    id: "s3",
    propertySlug: "big-house",
    sourceName: "Airbnb Calendar",
    sourceType: "Airbnb ICS",
    status: "Not connected",
    lastSync: "Not synced yet",
  },
];

function differenceInNights(
  checkin: string,
  checkout: string
) {
  const start = new Date(`${checkin}T00:00:00`);
  const end = new Date(`${checkout}T00:00:00`);

  const diff =
    end.getTime() - start.getTime();

  return Math.max(
    0,
    Math.round(diff / (1000 * 60 * 60 * 24))
  );
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getSourceBadgeClass(source: BookingSource) {
  switch (source) {
    case "Airbnb":
      return "bg-rose-50 text-rose-700 border-rose-100";
    case "Booking.com":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "Direct":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "WhatsApp":
      return "bg-green-50 text-green-700 border-green-100";
    case "Manual":
      return "bg-zinc-50 text-zinc-700 border-zinc-100";
    case "Owner Stay":
      return "bg-purple-50 text-purple-700 border-purple-100";
    default:
      return "bg-gray-50 text-gray-700 border-gray-100";
  }
}

function getStatusBadgeClass(status: BookingStatus) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-100";
    case "blocked":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
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
  children: React.ReactNode;
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

export default function ChannelManagerPage() {
  const [selectedProperty, setSelectedProperty] =
    useState("all");

  const filteredBookings = useMemo(() => {
    if (selectedProperty === "all") {
      return demoBookings;
    }

    return demoBookings.filter(
      (booking) =>
        booking.propertySlug === selectedProperty
    );
  }, [selectedProperty]);

  const filteredBlockedDates = useMemo(() => {
    if (selectedProperty === "all") {
      return demoBlockedDates;
    }

    return demoBlockedDates.filter(
      (blockedDate) =>
        blockedDate.propertySlug === selectedProperty
    );
  }, [selectedProperty]);

  const filteredSources = useMemo(() => {
    if (selectedProperty === "all") {
      return demoCalendarSources;
    }

    return demoCalendarSources.filter(
      (source) =>
        source.propertySlug === selectedProperty
    );
  }, [selectedProperty]);

  const occupiedNights = filteredBookings.reduce(
    (total, booking) =>
      total +
      differenceInNights(
        booking.checkin,
        booking.checkout
      ),
    0
  );

  const blockedNights = filteredBlockedDates.reduce(
    (total, blockedDate) =>
      total +
      differenceInNights(
        blockedDate.startDate,
        blockedDate.endDate
      ),
    0
  );

  const totalPeriodNights = 30;
  const occupancyRate =
    totalPeriodNights > 0
      ? Math.round(
          (occupiedNights / totalPeriodNights) * 100
        )
      : 0;

  const upcomingCheckins =
    filteredBookings.length;

  const upcomingCheckouts =
    filteredBookings.length;

  const cleaningNeeded =
    filteredBookings.filter(
      (booking) => booking.status === "confirmed"
    ).length;

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
                Unified calendar foundation for bookings, blocked dates,
                occupancy, turnovers and future ICS calendar sync.
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
                    value={property.slug}
                  >
                    {property.name}
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
            href="/dashboard/qr"
            className="bg-white border border-gray-200 px-5 py-3 rounded-2xl text-sm font-semibold hover:bg-black hover:text-white transition"
          >
            Open QR/NFC
          </a>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-5">
          <Card
            title="Occupancy"
            value={`${occupancyRate}%`}
            description="Demo occupancy for the selected 30-day period."
            icon="📈"
          />

          <Card
            title="Occupied nights"
            value={`${occupiedNights}`}
            description="Booked nights from current demo bookings."
            icon="🌙"
          />

          <Card
            title="Blocked nights"
            value={`${blockedNights}`}
            description="Unavailable nights for maintenance or private use."
            icon="⛔"
          />

          <Card
            title="Check-ins"
            value={`${upcomingCheckins}`}
            description="Upcoming arrivals in the current view."
            icon="🔑"
          />

          <Card
            title="Cleaning needed"
            value={`${cleaningNeeded}`}
            description="Confirmed departures that will require turnover."
            icon="🧹"
          />
        </div>

        <Section
          icon="📅"
          title="Calendar Overview"
          description="Visual unified calendar placeholder. In the next blocks this will become the real monthly calendar with occupied nights, blocked dates and turnovers."
        >
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 30 }).map((_, index) => {
              const day = index + 1;

              const isOccupied =
                day >= 18 && day <= 21;

              const isBlocked =
                day >= 28 && day <= 30;

              return (
                <div
                  key={day}
                  className={`min-h-[90px] rounded-2xl border p-3 text-sm ${
                    isOccupied
                      ? "bg-rose-50 border-rose-100 text-rose-900"
                      : isBlocked
                        ? "bg-zinc-100 border-zinc-200 text-zinc-800"
                        : "bg-gray-50 border-gray-100 text-gray-500"
                  }`}
                >
                  <div className="font-semibold">
                    {day}
                  </div>

                  {isOccupied && (
                    <div className="mt-2 text-xs">
                      Occupied
                    </div>
                  )}

                  {isBlocked && (
                    <div className="mt-2 text-xs">
                      Blocked
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        <div className="grid xl:grid-cols-2 gap-8">
          <Section
            icon="🛎️"
            title="Manual Bookings"
            description="Bookings entered manually by the host. Database and real forms will be added in the next blocks."
          >
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-100 rounded-3xl p-5 bg-gray-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-bold text-lg">
                        {booking.guestName}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {
                          properties.find(
                            (property) =>
                              property.slug ===
                              booking.propertySlug
                          )?.name
                        }
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`text-xs border px-3 py-1 rounded-full ${getSourceBadgeClass(
                          booking.source
                        )}`}
                      >
                        {booking.source}
                      </span>

                      <span
                        className={`text-xs border px-3 py-1 rounded-full ${getStatusBadgeClass(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-gray-400">
                        Check-in
                      </div>

                      <div className="font-semibold">
                        {formatDate(booking.checkin)}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-400">
                        Check-out
                      </div>

                      <div className="font-semibold">
                        {formatDate(booking.checkout)}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-400">
                        Guests / Nights
                      </div>

                      <div className="font-semibold">
                        {booking.guests} guests ·{" "}
                        {differenceInNights(
                          booking.checkin,
                          booking.checkout
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
                </div>
              ))}
            </div>
          </Section>

          <Section
            icon="⛔"
            title="Blocked Dates"
            description="Dates blocked for owner stays, maintenance, deep cleaning or private use."
          >
            <div className="space-y-4">
              {filteredBlockedDates.map((blockedDate) => (
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
                        {
                          properties.find(
                            (property) =>
                              property.slug ===
                              blockedDate.propertySlug
                          )?.name
                        }
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
                        {formatDate(blockedDate.startDate)}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-400">
                        End
                      </div>

                      <div className="font-semibold">
                        {formatDate(blockedDate.endDate)}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-400">
                        Nights
                      </div>

                      <div className="font-semibold">
                        {differenceInNights(
                          blockedDate.startDate,
                          blockedDate.endDate
                        )}
                      </div>
                    </div>
                  </div>

                  {blockedDate.notes && (
                    <p className="text-sm text-gray-500 mt-4">
                      {blockedDate.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="grid xl:grid-cols-2 gap-8">
          <Section
            icon="🔄"
            title="Calendar Sources"
            description="Future ICS sources from Airbnb, Booking.com, VRBO, Google Calendar or other external calendars."
          >
            <div className="space-y-4">
              {filteredSources.map((source) => (
                <div
                  key={source.id}
                  className="border border-gray-100 rounded-3xl p-5 bg-gray-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-lg">
                        {source.sourceName}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {source.sourceType} ·{" "}
                        {
                          properties.find(
                            (property) =>
                              property.slug ===
                              source.propertySlug
                          )?.name
                        }
                      </p>
                    </div>

                    <span className="text-xs border px-3 py-1 rounded-full bg-amber-50 text-amber-700 border-amber-100">
                      {source.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mt-4">
                    Last sync: {source.lastSync}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section
            icon="🧹"
            title="Turnover & Cleaning"
            description="Operational view connecting booking check-outs with cleaning tasks."
          >
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={`cleaning-${booking.id}`}
                  className="border border-gray-100 rounded-3xl p-5 bg-gray-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-lg">
                        Cleaning after{" "}
                        {booking.guestName}
                      </h3>

                      <p className="text-sm text-gray-500">
                        Check-out on{" "}
                        {formatDate(booking.checkout)}
                      </p>
                    </div>

                    <span className="text-xs border px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 border-yellow-100">
                      Cleaning needed
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mt-4">
                    In a future block this card will create or link a real
                    cleaning task from the booking check-out.
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <Section
          icon="📊"
          title="Reports Foundation"
          description="Basic reporting area for occupancy, check-ins, check-outs, blocked nights and future CSV/PDF exports."
        >
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
              <div className="text-sm text-gray-500 mb-2">
                Current period
              </div>

              <div className="font-bold text-lg">
                Next 30 days
              </div>
            </div>

            <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
              <div className="text-sm text-gray-500 mb-2">
                Bookings
              </div>

              <div className="font-bold text-lg">
                {filteredBookings.length}
              </div>
            </div>

            <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
              <div className="text-sm text-gray-500 mb-2">
                Occupancy
              </div>

              <div className="font-bold text-lg">
                {occupancyRate}%
              </div>
            </div>

            <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
              <div className="text-sm text-gray-500 mb-2">
                Cleanings needed
              </div>

              <div className="font-bold text-lg">
                {cleaningNeeded}
              </div>
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}