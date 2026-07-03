"use client";

import { useEffect, useState } from "react";
import {
  buildCalendarMonth,
  calculateOccupancy,
  getNextCheckin,
  getNextCheckout,
  getMonthName,
  getPreviousMonth,
  getNextMonth,
  type CalendarMonth,
} from "@/lib/services/calendar-service";

type Booking = {
  id: string;
  propertyId: string;
  propertyName: string | null;
  guestName: string;
  checkinDate: string;
  checkoutDate: string;
  status: string;
  aiAccessStatus: string;
};

type CleaningTask = {
  id: string;
  propertyId: string;
  propertyName: string | null;
  cleaningDate: string;
  status: string;
};

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [properties, setProperties] = useState<string[]>([]);
  
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  
  const [propertyFilter, setPropertyFilter] = useState("");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [calendarData, setCalendarData] = useState<CalendarMonth | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch bookings
      const bookingsRes = await fetch("/api/dashboard-bookings");
      const bookingsData = await bookingsRes.json();

      if (bookingsData.success) {
        const allBookings = [
          ...(bookingsData.bookings.upcomingBookings || []),
          ...(bookingsData.bookings.activeStays || []),
          ...(bookingsData.bookings.completedStays || []),
        ];
        setBookings(allBookings);

        // Extract unique properties
        const props = new Set<string>();
        allBookings.forEach((b) => {
          if (b.propertyName) props.add(b.propertyName);
        });
        setProperties(Array.from(props).sort());
      }

      // Fetch cleaning tasks
      const cleaningRes = await fetch("/api/cleaning-tasks");
      const cleaningData = await cleaningRes.json();

      if (cleaningData.success && cleaningData.data) {
        const tasks = cleaningData.data.map((task: any) => ({
          id: task.id,
          propertyId: task.property_id,
          propertyName: task.property_name,
          cleaningDate: task.cleaning_date,
          status: task.status,
        }));
        setCleaningTasks(tasks);
      }
    } catch (err) {
      console.error("Failed to load calendar data:", err);
      setError("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (bookings.length > 0 || cleaningTasks.length > 0) {
      const calendar = buildCalendarMonth(
        bookings,
        cleaningTasks,
        currentDate.year,
        currentDate.month,
        propertyFilter || undefined
      );
      setCalendarData(calendar);
    }
  }, [bookings, cleaningTasks, currentDate, propertyFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f6f1e8] to-[#f0e9dd] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full" />
          </div>
          <p className="mt-4 text-gray-600 font-semibold">
            Loading calendar...
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
              ❌ Error loading calendar
            </p>
            <p className="text-red-600 text-sm mt-2">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!calendarData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f6f1e8] to-[#f0e9dd]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-[24px] shadow-lg border border-black/5 p-8 text-center">
            <p className="text-gray-600 font-semibold">
              No bookings or cleaning tasks to display
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate occupancy for current view
  const filteredBookings = propertyFilter
    ? bookings.filter((b) => b.propertyName === propertyFilter)
    : bookings;

  const occupancyStats = propertyFilter
    ? calculateOccupancy(
        filteredBookings,
        filteredBookings[0]?.propertyId || "",
        currentDate.year,
        currentDate.month
      )
    : null;

  const nextCheckin = propertyFilter
    ? getNextCheckin(
        filteredBookings,
        filteredBookings[0]?.propertyId || ""
      )
    : null;

  const nextCheckout = propertyFilter
    ? getNextCheckout(
        filteredBookings,
        filteredBookings[0]?.propertyId || ""
      )
    : null;

  const prevMonth = getPreviousMonth(currentDate.year, currentDate.month);
  const nextMonth = getNextMonth(currentDate.year, currentDate.month);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f1e8] to-[#f0e9dd]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32">
        {/* HERO SECTION */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-4xl sm:text-5xl font-black mb-2">
            📅 Calendar
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Manage bookings, track occupancy, and organize your cleaning schedule.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {/* Left: Date & View Controls */}
          <div className="bg-white rounded-[24px] shadow-lg border border-black/5 p-4 sm:p-6">
            <div className="space-y-4">
              {/* Month/Year Navigation */}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setCurrentDate(prevMonth)}
                  className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-semibold text-sm"
                >
                  ← Prev
                </button>

                <h2 className="text-xl sm:text-2xl font-black">
                  {getMonthName(currentDate.month)} {currentDate.year}
                </h2>

                <button
                  onClick={() => setCurrentDate(nextMonth)}
                  className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-semibold text-sm"
                >
                  Next →
                </button>
              </div>

              {/* View Mode Tabs */}
              <div className="flex gap-2">
                {(["month", "week"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition ${
                      viewMode === mode
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {mode === "month" ? "📆 Month" : "📊 Week"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Filters & Stats */}
          <div className="bg-white rounded-[24px] shadow-lg border border-black/5 p-4 sm:p-6">
            <div className="space-y-4">
              {/* Property Filter */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">
                  Property
                </label>
                <select
                  value={propertyFilter}
                  onChange={(e) => setPropertyFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">All properties</option>
                  {properties.map((prop) => (
                    <option key={prop} value={prop}>
                      {prop}
                    </option>
                  ))}
                </select>
              </div>

              {/* Occupancy Stats */}
              {occupancyStats && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    📊 Occupancy
                  </p>
                  <div className="flex items-end gap-2">
                    <div>
                      <p className="text-2xl font-black text-blue-700">
                        {Math.round(occupancyStats.occupancyRate)}%
                      </p>
                      <p className="text-xs text-gray-600">
                        {occupancyStats.occupiedDays}/{occupancyStats.totalDays} days
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${occupancyStats.occupancyRate}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Checkin/Checkout */}
              {propertyFilter && (
                <div className="space-y-2 text-xs">
                  {nextCheckin && (
                    <div className="flex items-center gap-2 text-blue-700 bg-blue-50 p-2 rounded-lg">
                      <span>✓</span>
                      <span>
                        Check-in:{" "}
                        <strong>
                          {new Date(nextCheckin).toLocaleDateString()}
                        </strong>
                      </span>
                    </div>
                  )}
                  {nextCheckout && (
                    <div className="flex items-center gap-2 text-orange-700 bg-orange-50 p-2 rounded-lg">
                      <span>✗</span>
                      <span>
                        Check-out:{" "}
                        <strong>
                          {new Date(nextCheckout).toLocaleDateString()}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CALENDAR VIEW */}
        {viewMode === "month" && (
          <div className="bg-white rounded-[24px] shadow-lg border border-black/5 overflow-hidden">
            {/* WEEKDAY HEADERS */}
            <div className="grid grid-cols-7 gap-0 border-b border-gray-200 bg-gray-50">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day) => (
                  <div
                    key={day}
                    className="p-2 sm:p-4 text-center font-black text-sm sm:text-base"
                  >
                    {day}
                  </div>
                )
              )}
            </div>

            {/* CALENDAR DAYS */}
            <div className="grid grid-cols-7 gap-0">
              {calendarData.days.map((day) => (
                <div
                  key={day.date}
                  className={`border border-gray-100 p-1 sm:p-2 min-h-[80px] sm:min-h-[120px] ${
                    !day.isCurrentMonth ? "bg-gray-50" : ""
                  } ${day.isToday ? "bg-yellow-50" : ""}`}
                >
                  {/* DAY NUMBER */}
                  <div
                    className={`text-xs sm:text-sm font-black mb-1 ${
                      day.isToday
                        ? "text-yellow-700"
                        : day.isCurrentMonth
                          ? "text-gray-900"
                          : "text-gray-400"
                    }`}
                  >
                    {day.date.split("-")[2]}
                  </div>

                  {/* EVENTS */}
                  <div className="space-y-0.5">
                    {day.events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs px-1.5 py-0.5 rounded border truncate ${event.color}`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {day.events.length > 3 && (
                      <div className="text-xs px-1.5 py-0.5 text-gray-600 font-semibold">
                        +{day.events.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WEEK VIEW */}
        {viewMode === "week" && (
          <div className="space-y-4 sm:space-y-6">
            {calendarData.weeks.slice(0, 6).map((week) => (
              <div
                key={week.weekNumber}
                className="bg-white rounded-[24px] shadow-lg border border-black/5 overflow-hidden"
              >
                {/* WEEK HEADER */}
                <div className="bg-gray-50 border-b border-gray-200 p-3 sm:p-4">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">
                    {new Date(week.startDate).toLocaleDateString()} -{" "}
                    {new Date(week.endDate).toLocaleDateString()}
                  </p>
                </div>

                {/* WEEK DAYS */}
                <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
                  {week.days.map((day) => (
                    <div
                      key={day.date}
                      className={`border-r border-gray-100 p-2 sm:p-3 min-h-[100px] ${
                        !day.isCurrentMonth ? "bg-gray-50" : ""
                      } ${day.isToday ? "bg-yellow-50" : ""}`}
                    >
                      {/* DATE */}
                      <div
                        className={`text-xs sm:text-sm font-black mb-1 pb-1 border-b ${
                          day.isToday
                            ? "text-yellow-700 border-yellow-300"
                            : "text-gray-900 border-gray-200"
                        }`}
                      >
                        {new Date(day.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>

                      {/* EVENTS */}
                      <div className="space-y-1">
                        {day.events.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs px-1.5 py-0.5 rounded border truncate ${event.color}`}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {day.events.length > 2 && (
                          <div className="text-xs px-1.5 py-0.5 text-gray-600 font-semibold">
                            +{day.events.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LEGEND */}
        <div className="mt-8 sm:mt-10 bg-white rounded-[24px] shadow-lg border border-black/5 p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-black mb-4">📋 Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-blue-300 bg-blue-100" />
              <span className="text-sm font-semibold text-gray-700">
                Check-in
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-green-300 bg-green-100" />
              <span className="text-sm font-semibold text-gray-700">
                Stay
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-orange-300 bg-orange-100" />
              <span className="text-sm font-semibold text-gray-700">
                Check-out
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-gray-300 bg-gray-100" />
              <span className="text-sm font-semibold text-gray-700">
                Cleaning
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
