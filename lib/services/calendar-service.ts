/**
 * Calendar Service
 * 
 * Reusable service for aggregating booking, cleaning, and occupancy data
 * into a calendar-friendly format. Designed to be OTA-agnostic and support
 * future integrations with Airbnb, Booking.com, VRBO, and direct bookings.
 */

export type CalendarEvent = {
  id: string;
  type: "stay" | "checkin" | "checkout" | "cleaning";
  propertyId: string;
  propertyName: string | null;
  date: string; // YYYY-MM-DD
  startDate?: string;
  endDate?: string;
  guestName?: string;
  title: string;
  status: string;
  color: string;
  metadata?: Record<string, unknown>;
};

export type CalendarDay = {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
};

export type CalendarWeek = {
  weekNumber: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: CalendarDay[];
};

export type CalendarMonth = {
  year: number;
  month: number; // 1-12
  days: CalendarDay[];
  weeks: CalendarWeek[];
};

/**
 * Get all days in a month with event data
 */
export function buildCalendarMonth(
  bookings: Array<{
    id: string;
    propertyId: string;
    propertyName: string | null;
    guestName: string;
    checkinDate: string;
    checkoutDate: string;
    status: string;
    aiAccessStatus: string;
  }>,
  cleaningTasks: Array<{
    id: string;
    propertyId: string;
    propertyName: string | null;
    cleaningDate: string;
    status: string;
  }>,
  year: number,
  month: number,
  propertyFilter?: string
): CalendarMonth {
  // Get first and last day of month
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  
  // Get first day of week for month (0 = Sunday)
  const startingDayOfWeek = firstDay.getDay();
  
  // Build array of all days to display (including previous/next month dates)
  const days: CalendarDay[] = [];
  
  // Add previous month's days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, -i);
    days.push({
      date: formatDate(date),
      dayOfWeek: date.getDay(),
      isCurrentMonth: false,
      isToday: isToday(date),
      events: [],
    });
  }
  
  // Add current month's days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month - 1, day);
    days.push({
      date: formatDate(date),
      dayOfWeek: date.getDay(),
      isCurrentMonth: true,
      isToday: isToday(date),
      events: [],
    });
  }
  
  // Add next month's days to complete the grid
  const remainingDays = 42 - days.length; // 6 weeks * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month, i);
    days.push({
      date: formatDate(date),
      dayOfWeek: date.getDay(),
      isCurrentMonth: false,
      isToday: isToday(date),
      events: [],
    });
  }
  
  // Add booking events
  bookings.forEach((booking) => {
    // Skip if property filter is active and doesn't match
    if (propertyFilter && booking.propertyName !== propertyFilter) {
      return;
    }
    
    const checkinDate = new Date(booking.checkinDate);
    const checkoutDate = new Date(booking.checkoutDate);
    
    // Add checkin event
    const checkinDay = days.find((d) => d.date === formatDate(checkinDate));
    if (checkinDay) {
      checkinDay.events.push({
        id: `${booking.id}-checkin`,
        type: "checkin",
        propertyId: booking.propertyId,
        propertyName: booking.propertyName,
        date: formatDate(checkinDate),
        guestName: booking.guestName,
        title: `✓ ${booking.guestName} Check-in`,
        status: "checkin",
        color: "bg-blue-100 text-blue-700 border-blue-300",
        metadata: { bookingId: booking.id },
      });
    }
    
    // Add stay events (multi-day)
    const dayAfterCheckin = new Date(checkinDate);
    dayAfterCheckin.setDate(dayAfterCheckin.getDate() + 1);
    
    const daysToAdd: string[] = [];
    let dayIterator = new Date(dayAfterCheckin);
    while (dayIterator < checkoutDate) {
      daysToAdd.push(formatDate(dayIterator));
      dayIterator = new Date(dayIterator);
      dayIterator.setDate(dayIterator.getDate() + 1);
    }
    
    daysToAdd.forEach((dateStr) => {
      const day = days.find((d) => d.date === dateStr);
      
      if (day) {
        day.events.push({
          id: `${booking.id}-stay-${dateStr}`,
          type: "stay",
          propertyId: booking.propertyId,
          propertyName: booking.propertyName,
          date: dateStr,
          startDate: formatDate(checkinDate),
          endDate: formatDate(checkoutDate),
          guestName: booking.guestName,
          title: `🏠 ${booking.guestName}`,
          status: booking.status,
          color: "bg-green-100 text-green-700 border-green-300",
          metadata: { bookingId: booking.id, aiAccessStatus: booking.aiAccessStatus },
        });
      }
    });
    
    // Add checkout event
    const checkoutDay = days.find((d) => d.date === formatDate(checkoutDate));
    if (checkoutDay) {
      checkoutDay.events.push({
        id: `${booking.id}-checkout`,
        type: "checkout",
        propertyId: booking.propertyId,
        propertyName: booking.propertyName,
        date: formatDate(checkoutDate),
        guestName: booking.guestName,
        title: `✗ ${booking.guestName} Check-out`,
        status: "checkout",
        color: "bg-orange-100 text-orange-700 border-orange-300",
        metadata: { bookingId: booking.id },
      });
    }
  });
  
  // Add cleaning events
  cleaningTasks.forEach((task) => {
    // Skip if property filter is active and doesn't match
    if (propertyFilter && task.propertyName !== propertyFilter) {
      return;
    }
    
    const taskDate = new Date(task.cleaningDate);
    const day = days.find((d) => d.date === formatDate(taskDate));
    
    if (day) {
      day.events.push({
        id: `${task.id}-cleaning`,
        type: "cleaning",
        propertyId: task.propertyId,
        propertyName: task.propertyName,
        date: formatDate(taskDate),
        title: `🧹 Cleaning - ${task.status}`,
        status: task.status,
        color:
          task.status === "completed"
            ? "bg-green-100 text-green-700 border-green-300"
            : task.status === "in_progress"
              ? "bg-yellow-100 text-yellow-700 border-yellow-300"
              : "bg-gray-100 text-gray-700 border-gray-300",
        metadata: { cleaningTaskId: task.id },
      });
    }
  });
  
  // Remove duplicate stay events (keep only one per day per booking)
  days.forEach((day) => {
    const stayEventIds = new Set<string>();
    day.events = day.events.filter((event) => {
      if (event.type !== "stay") {
        return true;
      }
      
      const stayId = `${event.metadata?.bookingId}-stay`;
      if (stayEventIds.has(stayId)) {
        return false;
      }
      
      stayEventIds.add(stayId);
      return true;
    });
  });
  
  // Build weeks
  const weeks: CalendarWeek[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const weekDays = days.slice(i, i + 7);
    weeks.push({
      weekNumber: weeks.length + 1,
      startDate: weekDays[0].date,
      endDate: weekDays[6].date,
      days: weekDays,
    });
  }
  
  return {
    year,
    month,
    days,
    weeks,
  };
}

/**
 * Get occupancy stats for a property in a given month
 */
export function calculateOccupancy(
  bookings: Array<{
    checkinDate: string;
    checkoutDate: string;
    propertyId: string;
  }>,
  propertyId: string,
  year: number,
  month: number
): {
  occupiedDays: number;
  totalDays: number;
  occupancyRate: number;
} {
  const lastDay = new Date(year, month, 0);
  const totalDays = lastDay.getDate();
  
  let occupiedDays = 0;
  
  for (let day = 1; day <= totalDays; day++) {
    const currentDate = new Date(year, month - 1, day);
    const isOccupied = bookings.some((booking) => {
      if (booking.propertyId !== propertyId) {
        return false;
      }
      
      const checkinDate = new Date(booking.checkinDate);
      const checkoutDate = new Date(booking.checkoutDate);
      
      return currentDate >= checkinDate && currentDate < checkoutDate;
    });
    
    if (isOccupied) {
      occupiedDays++;
    }
  }
  
  return {
    occupiedDays,
    totalDays,
    occupancyRate: (occupiedDays / totalDays) * 100,
  };
}

/**
 * Get next checkout date for a property
 */
export function getNextCheckout(
  bookings: Array<{
    checkoutDate: string;
    propertyId: string;
  }>,
  propertyId: string
): string | null {
  const now = new Date();
  const futureCheckouts = bookings
    .filter((b) => b.propertyId === propertyId)
    .filter((b) => new Date(b.checkoutDate) > now)
    .sort((a, b) => new Date(a.checkoutDate).getTime() - new Date(b.checkoutDate).getTime());
  
  return futureCheckouts[0]?.checkoutDate || null;
}

/**
 * Get next checkin date for a property
 */
export function getNextCheckin(
  bookings: Array<{
    checkinDate: string;
    propertyId: string;
  }>,
  propertyId: string
): string | null {
  const now = new Date();
  const futureCheckins = bookings
    .filter((b) => b.propertyId === propertyId)
    .filter((b) => new Date(b.checkinDate) > now)
    .sort((a, b) => new Date(a.checkinDate).getTime() - new Date(b.checkinDate).getTime());
  
  return futureCheckins[0]?.checkinDate || null;
}

// Helper functions

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function getMonthName(month: number): string {
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return names[month - 1];
}

export function getPreviousMonth(year: number, month: number) {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

export function getNextMonth(year: number, month: number) {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}
