"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Booking = {
  id: string;
  stayId: string | null;
  bookingId: string | null;
  propertyId: string;
  propertyName: string | null;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  guestContact: string | null;
  checkinDate: string;
  checkoutDate: string;
  status: string;
  aiAccessStatus: string;
  conversationCount: number;
  conversationId: string | null;
  cleaningStatus: string;
  source: string | null;
  externalEventId: string | null;
};

type BookingsData = {
  upcomingBookings: Booking[];
  activeStays: Booking[];
  completedStays: Booking[];
  cancelledBookings: Booking[];
};

export default function BookingsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingsData | null>(null);
  const [activeTab, setActiveTab] = useState<
    "upcoming" | "active" | "completed" | "cancelled"
  >("active");
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [properties, setProperties] = useState<string[]>([]);

  async function loadBookings() {
    try {
      if (bookings) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(
        "/api/dashboard-bookings"
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error("Unable to load bookings right now");
      }

      setBookings(
        data.bookings || {
          upcomingBookings: [],
          activeStays: [],
          completedStays: [],
          cancelledBookings: [],
        }
      );

      // Extract unique properties
      const allProps = new Set<string>();
      (data.bookings.upcomingBookings || []).forEach(
        (b: Booking) => {
          if (b.propertyName) allProps.add(b.propertyName);
        }
      );
      (data.bookings.activeStays || []).forEach(
        (b: Booking) => {
          if (b.propertyName) allProps.add(b.propertyName);
        }
      );
      (data.bookings.completedStays || []).forEach(
        (b: Booking) => {
          if (b.propertyName) allProps.add(b.propertyName);
        }
      );
      (data.bookings.cancelledBookings || []).forEach(
        (b: Booking) => {
          if (b.propertyName) allProps.add(b.propertyName);
        }
      );
      setProperties(Array.from(allProps).sort());
    } catch (err) {
      setError("Unable to load bookings right now");
      console.error("Bookings error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  function getTabBookings() {
    if (!bookings) return [];

    let list: Booking[] = [];

    if (activeTab === "upcoming") {
      list = bookings.upcomingBookings || [];
    } else if (activeTab === "active") {
      list = bookings.activeStays || [];
    } else if (activeTab === "completed") {
      list = bookings.completedStays || [];
    } else if (activeTab === "cancelled") {
      list = bookings.cancelledBookings || [];
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.guestName.toLowerCase().includes(q) ||
          (b.guestEmail &&
            b.guestEmail.toLowerCase().includes(q)) ||
          (b.guestPhone &&
            b.guestPhone.toLowerCase().includes(q))
      );
    }

    // Filter by property
    if (propertyFilter) {
      list = list.filter(
        (b) => b.propertyName === propertyFilter
      );
    }

    return list;
  }

  function formatDate(dateStr: string) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  function getDaysUntil(dateStr: string) {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days;
    } catch {
      return null;
    }
  }

  function getCleaningBadgeColor(status: string) {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "accepted":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  const currentBookings = getTabBookings();
  const tabNames = {
    upcoming: `Upcoming (${bookings?.upcomingBookings.length || 0})`,
    active: `Active (${bookings?.activeStays.length || 0})`,
    completed: `Completed (${bookings?.completedStays.length || 0})`,
    cancelled: `Cancelled (${bookings?.cancelledBookings.length || 0})`,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f6f1e8] to-[#f0e9dd] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full" />
          </div>
          <p className="mt-4 text-gray-600 font-semibold">
            Loading bookings...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f6f1e8] to-[#f0e9dd]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-[24px] p-6">
            <p className="text-red-700 font-semibold">
              ❌ Error loading bookings
            </p>
            <p className="text-red-600 text-sm mt-2">
              {error}
            </p>
            <button
              onClick={loadBookings}
              className="mt-4 px-4 py-2 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f1e8] to-[#f0e9dd]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-32">
        {/* HERO SECTION */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-4xl sm:text-5xl font-black mb-2">
            📅 Bookings & Stays
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Manage all bookings, track guest access, monitor cleaning status, and view conversation history.
          </p>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-[24px] shadow-lg border border-black/5 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 sm:max-w-xs">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by guest name..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 sm:px-5 sm:py-3 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Property Filter */}
            <div className="flex-1 sm:max-w-xs">
              <select
                value={propertyFilter}
                onChange={(e) =>
                  setPropertyFilter(e.target.value)
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 sm:px-5 sm:py-3 text-sm outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">All properties</option>
                {properties.map((prop) => (
                  <option key={prop} value={prop}>
                    {prop}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadBookings}
              disabled={refreshing}
              className="bg-black text-white rounded-lg px-4 py-2 sm:px-5 sm:py-3 text-sm font-semibold hover:bg-black/90 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-2">
          {(
            ["upcoming", "active", "completed", "cancelled"] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold text-sm sm:text-base whitespace-nowrap transition ${
                activeTab === tab
                  ? "bg-black text-white shadow-lg"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tabNames[tab]}
            </button>
          ))}
        </div>

        {/* BOOKING CARDS */}
        <div className="space-y-4 sm:space-y-6">
          {currentBookings.length > 0 ? (
            currentBookings.map((booking) => {
              const daysUntil = getDaysUntil(booking.checkinDate);

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-[24px] shadow-lg border border-black/5 overflow-hidden hover:shadow-xl transition"
                >
                  {/* HEADER */}
                  <div className="bg-gradient-to-r from-black via-zinc-900 to-zinc-800 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl sm:text-2xl font-black text-white truncate">
                          {booking.guestName}
                        </h3>
                        <p className="text-gray-300 text-xs sm:text-sm truncate">
                          {booking.propertyName || "Unknown"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {activeTab === "upcoming" && daysUntil && (
                          <span className="text-xs sm:text-sm px-3 py-1 bg-blue-500 text-white rounded-full font-semibold">
                            {daysUntil > 0
                              ? `In ${daysUntil}d`
                              : "Today"}
                          </span>
                        )}

                        <span
                          className={`text-xs sm:text-sm px-3 py-1 rounded-full font-semibold ${
                            booking.aiAccessStatus === "available"
                              ? "bg-green-500 text-white"
                              : booking.aiAccessStatus === "expired"
                                ? "bg-red-500 text-white"
                                : "bg-gray-500 text-white"
                          }`}
                        >
                          {booking.aiAccessStatus === "available"
                            ? "🤖 AI Active"
                            : "❌ AI " +
                              booking.aiAccessStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BODY */}
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
                      {/* Check-in */}
                      <div className="bg-gray-50 rounded-[16px] p-3 sm:p-4">
                        <p className="text-xs text-gray-600 font-semibold mb-1">
                          Check-in
                        </p>
                        <p className="text-sm sm:text-base font-black">
                          {formatDate(booking.checkinDate)}
                        </p>
                      </div>

                      {/* Check-out */}
                      <div className="bg-gray-50 rounded-[16px] p-3 sm:p-4">
                        <p className="text-xs text-gray-600 font-semibold mb-1">
                          Check-out
                        </p>
                        <p className="text-sm sm:text-base font-black">
                          {formatDate(booking.checkoutDate)}
                        </p>
                      </div>

                      {/* Guest Info */}
                      <div className="bg-gray-50 rounded-[16px] p-3 sm:p-4">
                        <p className="text-xs text-gray-600 font-semibold mb-1">
                          Contact
                        </p>
                        <p className="text-xs sm:text-sm font-semibold truncate">
                          {booking.guestEmail ||
                            booking.guestPhone ||
                            booking.guestContact ||
                            "No contact"}
                        </p>
                      </div>

                      {/* Cleaning Status */}
                      <div className="bg-gray-50 rounded-[16px] p-3 sm:p-4">
                        <p className="text-xs text-gray-600 font-semibold mb-1">
                          Cleaning
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold inline-block ${getCleaningBadgeColor(
                            booking.cleaningStatus
                          )}`}
                        >
                          {booking.cleaningStatus}
                        </span>
                      </div>
                    </div>

                    {/* CONVERSATIONS & METADATA */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm mb-5 sm:mb-6">
                      {booking.conversationId && (
                        <span className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded-lg font-semibold">
                          💬 {booking.conversationCount} conversations
                        </span>
                      )}

                      {booking.source && (
                        <span className="bg-gray-100 text-gray-700 px-2 sm:px-3 py-1 rounded-lg font-semibold">
                          📌 {booking.source}
                        </span>
                      )}

                      {booking.externalEventId && (
                        <span className="bg-purple-100 text-purple-700 px-2 sm:px-3 py-1 rounded-lg font-semibold text-xs truncate">
                          🔗 {booking.externalEventId}
                        </span>
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      {booking.conversationId && (
                        <Link
                          href={`/dashboard/conversations/${encodeURIComponent(
                            booking.conversationId
                          )}`}
                          className="flex-1 bg-black text-white rounded-lg px-4 py-2 sm:px-5 sm:py-3 font-semibold text-sm text-center hover:opacity-90 transition active:scale-[0.98]"
                        >
                          Open Conversation
                        </Link>
                      )}

                      {booking.propertyId && (
                        <a
                          href={`/dashboard/property/${encodeURIComponent(
                            booking.propertyId
                          )}`}
                          className="flex-1 bg-gray-200 text-gray-800 rounded-lg px-4 py-2 sm:px-5 sm:py-3 font-semibold text-sm text-center hover:bg-gray-300 transition active:scale-[0.98]"
                        >
                          View Property
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          alert(
                            `Booking ID: ${booking.id}\nStay ID: ${booking.stayId}\nBooking ID: ${booking.bookingId}`
                          );
                        }}
                        className="flex-1 bg-gray-100 text-gray-800 rounded-lg px-4 py-2 sm:px-5 sm:py-3 font-semibold text-sm hover:bg-gray-200 transition active:scale-[0.98]"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-[24px] shadow-lg border border-black/5 p-8 text-center">
              <div className="text-5xl mb-4">📭</div>
              <h2 className="text-2xl font-black mb-2">
                No bookings found
              </h2>
              <p className="text-gray-600 max-w-sm mx-auto mb-4">
                {search || propertyFilter
                  ? "No bookings match your search criteria."
                  : activeTab === "upcoming"
                    ? "No upcoming bookings scheduled."
                    : activeTab === "active"
                      ? "No active stays at the moment."
                      : activeTab === "completed"
                        ? "No completed stays yet."
                        : "No cancelled bookings."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPropertyFilter("");
                }}
                className="inline-flex rounded-xl bg-black text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
