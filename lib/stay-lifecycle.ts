/**
 * Stay Lifecycle Engine
 *
 * Core module for managing guest stay states.
 * Single source of truth for stay status across the application.
 *
 * States:
 * - upcoming: Before access window (welcome only)
 * - active: During stay (full access)
 * - grace_period: After checkout + grace hours (limited access)
 * - expired: After grace period (no access)
 *
 * Design goals:
 * - Reusable across API and frontend
 * - Configurable grace periods
 * - Backward compatible with legacy data
 * - Production-ready with comprehensive error handling
 */

export type StayState =
  | "upcoming"
  | "active"
  | "grace_period"
  | "expired";

export interface StayLifecycleConfig {
  gracePeriodHours: number;
  timezone?: string;
}

export interface StayDates {
  accessStartsAt?: Date | null;
  checkinDate?: Date | null;
  checkoutDate?: Date | null;
  accessEndsAt?: Date | null;
}

export interface StayStatus {
  state: StayState;
  isAllowed: boolean;
  aiEnabled: boolean;
  reason: string;
  details: {
    now: Date;
    accessStartsAt?: Date | null;
    checkinDate?: Date | null;
    checkoutDate?: Date | null;
    graceEndsAt?: Date | null;
    accessEndsAt?: Date | null;
  };
}

/**
 * Determine stay state based on dates
 *
 * @param dates Stay dates (can be incomplete for backward compatibility)
 * @param config Configuration including grace period
 * @returns Stay status with state, permissions, and details
 *
 * @example
 * const status = getStayStatus(
 *   {
 *     accessStartsAt: new Date("2026-07-03T15:00:00Z"),
 *     checkoutDate: new Date("2026-07-10"),
 *   },
 *   { gracePeriodHours: 4 }
 * );
 * // Returns: { state: 'active', isAllowed: true, ... }
 */
export function getStayStatus(
  dates: StayDates,
  config: StayLifecycleConfig
): StayStatus {
  const now = new Date();
  const { gracePeriodHours } = config;

  // Fail gracefully: legacy data without dates
  if (!dates.accessStartsAt && !dates.checkoutDate) {
    return {
      state: "active",
      isAllowed: true,
      aiEnabled: true,
      reason:
        "Legacy data without stay dates - allowing access for backward compatibility",
      details: { now },
    };
  }

  // Calculate effective checkout time (default 11:00 UTC if only date provided)
  let checkoutTime = dates.checkoutDate;
  if (dates.checkoutDate && typeof dates.checkoutDate === "object") {
    if (dates.checkoutDate.getHours() === 0) {
      // If midnight, assume 11:00 UTC checkout
      checkoutTime = new Date(dates.checkoutDate);
      checkoutTime.setUTCHours(11, 0, 0, 0);
    }
  }

  // Grace period ends at checkout time + N hours
  const graceEndsAt = checkoutTime
    ? new Date(checkoutTime.getTime() + gracePeriodHours * 60 * 60 * 1000)
    : null;

  // Determine state
  let state: StayState;
  let isAllowed: boolean;
  let aiEnabled: boolean;
  let reason: string;

  if (dates.accessStartsAt && now < dates.accessStartsAt) {
    // Before access window - upcoming
    state = "upcoming";
    isAllowed = false;
    aiEnabled = false;
    reason = `Stay starts on ${dates.accessStartsAt.toISOString()}`;
  } else if (checkoutTime && now >= checkoutTime && graceEndsAt && now < graceEndsAt) {
    // After checkout but within grace period
    state = "grace_period";
    isAllowed = true;
    aiEnabled = true;
    reason = `In grace period until ${graceEndsAt.toISOString()}`;
  } else if (graceEndsAt && now >= graceEndsAt) {
    // After grace period - expired
    state = "expired";
    isAllowed = false;
    aiEnabled = false;
    reason = `Stay expired on ${graceEndsAt.toISOString()}`;
  } else {
    // During stay (before checkout)
    state = "active";
    isAllowed = true;
    aiEnabled = true;
    reason = "Stay is active";
  }

  return {
    state,
    isAllowed,
    aiEnabled,
    reason,
    details: {
      now,
      accessStartsAt: dates.accessStartsAt,
      checkinDate: dates.checkinDate,
      checkoutDate: dates.checkoutDate,
      graceEndsAt,
      accessEndsAt: dates.accessEndsAt,
    },
  };
}

/**
 * Check if guest can access the property right now
 *
 * @param dates Stay dates
 * @param config Configuration
 * @returns true if access is allowed, false otherwise
 */
export function isStayAccessAllowed(
  dates: StayDates,
  config: StayLifecycleConfig
): boolean {
  const status = getStayStatus(dates, config);
  return status.isAllowed;
}

/**
 * Check if AI can respond for this stay
 *
 * Follows different rules than basic access:
 * - Upcoming: false (show welcome only)
 * - Active: true (normal)
 * - Grace period: true (continue assistance)
 * - Expired: false (show thank you)
 *
 * @param dates Stay dates
 * @param config Configuration
 * @returns true if AI should respond, false otherwise
 */
export function isAIEnabled(
  dates: StayDates,
  config: StayLifecycleConfig
): boolean {
  const status = getStayStatus(dates, config);
  return status.aiEnabled;
}

/**
 * Get human-readable message for a stay state
 *
 * Used for UI display, guest notifications, etc.
 *
 * @param state Stay state
 * @returns User-friendly message
 */
export function getStateMessage(state: StayState): string {
  const messages: Record<StayState, string> = {
    upcoming:
      "Welcome! Your stay will begin shortly. Check back soon.",
    active:
      "Welcome to your stay. Our AI concierge is here to help!",
    grace_period:
      "Thank you for staying with us. You can still reach our concierge.",
    expired:
      "Thank you for staying with us. Your access has ended.",
  };
  return messages[state];
}

/**
 * Parse date from various formats
 *
 * Supports:
 * - ISO strings (2026-07-03T15:00:00Z)
 * - Date objects
 * - Date strings (2026-07-03)
 * - timestamps
 *
 * @param date Date in various formats
 * @returns Date object or null if invalid
 */
export function parseStayDate(
  date: string | number | Date | undefined | null
): Date | null {
  if (!date) return null;

  try {
    if (typeof date === "object" && date instanceof Date) {
      return date;
    }
    if (typeof date === "string" || typeof date === "number") {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Default configuration
 * Can be overridden per integration point
 */
export const DEFAULT_STAY_CONFIG: StayLifecycleConfig = {
  gracePeriodHours: 4,
  timezone: "UTC",
};

/**
 * Create custom configuration
 * @param overrides Partial configuration to override defaults
 * @returns Complete configuration
 */
export function createStayConfig(
  overrides?: Partial<StayLifecycleConfig>
): StayLifecycleConfig {
  return {
    ...DEFAULT_STAY_CONFIG,
    ...overrides,
  };
}
