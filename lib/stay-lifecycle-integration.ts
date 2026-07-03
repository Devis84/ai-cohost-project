/**
 * Stay Lifecycle Integration
 *
 * Helper functions to integrate the Stay Lifecycle system
 * with existing guest access, token validation, and chat endpoints.
 *
 * This ensures backward compatibility while adding state management.
 */

import {
  getStayStatus,
  parseStayDate,
  createStayConfig,
  type StayState,
} from "./stay-lifecycle";

import {
  validateAIAccess,
  type AccessValidationRequest,
} from "./stay-access-validator";

/**
 * Enrich a guest access token with stay lifecycle state
 *
 * Takes an existing token object and adds:
 * - stay_state: current lifecycle state
 * - stay_allowed: is access currently allowed
 * - ai_enabled: can guest use AI right now
 *
 * @param token Guest access token from database
 * @param config Optional configuration
 * @returns Token enriched with stay state information
 */
export function enrichTokenWithStayState(
  token: any,
  config?: { gracePeriodHours?: number }
) {
  if (!token) {
    return token;
  }

  const stayDates = {
    accessStartsAt: token.valid_from,
    checkoutDate: token.checkout_date || token.valid_until,
    accessEndsAt: token.valid_until,
  };

  const stayStatus = getStayStatus(
    {
      accessStartsAt: parseStayDate(stayDates.accessStartsAt),
      checkoutDate: parseStayDate(stayDates.checkoutDate),
      accessEndsAt: parseStayDate(stayDates.accessEndsAt),
    },
    createStayConfig(config)
  );

  return {
    ...token,
    stay_state: stayStatus.state,
    stay_allowed: stayStatus.isAllowed,
    stay_ai_enabled: stayStatus.aiEnabled,
    stay_reason: stayStatus.reason,
  };
}

/**
 * Get stay state for a guest access token
 *
 * Used in API responses to inform frontend about current stay state.
 *
 * @param token Token from database
 * @param config Optional configuration
 * @returns Object with state and allowed flags
 */
export function getTokenStayState(
  token: any,
  config?: { gracePeriodHours?: number }
) {
  if (!token) {
    return null;
  }

  const stayDates = {
    accessStartsAt: token.valid_from,
    checkoutDate: token.checkout_date || token.valid_until,
    accessEndsAt: token.valid_until,
  };

  const stayStatus = getStayStatus(
    {
      accessStartsAt: parseStayDate(stayDates.accessStartsAt),
      checkoutDate: parseStayDate(stayDates.checkoutDate),
      accessEndsAt: parseStayDate(stayDates.accessEndsAt),
    },
    createStayConfig(config)
  );

  return {
    state: stayStatus.state,
    allowed: stayStatus.isAllowed,
    aiEnabled: stayStatus.aiEnabled,
    reason: stayStatus.reason,
  };
}

/**
 * Validate AI access for a guest (for API protection)
 *
 * Can return "block_without_error" for graceful failures:
 * - Expired stays get a fake but helpful response instead of error
 *
 * @param token Guest access token
 * @param config Optional configuration
 * @returns Validation result with optional fake response
 */
export function validateGuestAIAccess(
  token: any,
  config?: { gracePeriodHours?: number }
) {
  if (!token) {
    return {
      allowed: false,
      reason: "No token provided",
    };
  }

  const request: AccessValidationRequest = {
    token: token.token,
    guestAccessToken: token,
    stayDates: {
      accessStartsAt: token.valid_from,
      checkoutDate: token.checkout_date || token.valid_until,
      accessEndsAt: token.valid_until,
    },
  };

  const validation = validateAIAccess(request, config);

  return {
    allowed: validation.allowed,
    blocked: validation.blocked,
    state: validation.state,
    reason: validation.reason,
    shouldReturnFakeResponse:
      validation.state === "expired" ||
      validation.state === "upcoming",
  };
}

/**
 * Generate a graceful AI response for non-active states
 *
 * When stay is expired or upcoming, instead of an error,
 * return a helpful message from "AI Concierge".
 *
 * @param state Current stay state
 * @param propertyName Optional property name for personalization
 * @returns Fake but helpful AI response
 */
export function generateGracefulAIResponse(
  state: StayState,
  propertyName?: string
): string {
  const responses: Record<StayState, string> = {
    upcoming: `Welcome! Your stay at ${propertyName || "our property"} hasn't started yet. The AI Concierge will be available once your check-in begins. Looking forward to helping you soon!`,
    active:
      "Your stay is active and the AI Concierge is here to help! This shouldn't happen - please refresh and try again.",
    grace_period: `Thank you for staying with us at ${propertyName || "our property"}! Your stay has ended. The AI Concierge is no longer available, but we hope you enjoyed your time.`,
    expired: `Thank you for visiting ${propertyName || "our property"}! Your access has ended. We hope you had a wonderful stay and would love to hear your feedback!`,
  };

  return responses[state];
}

/**
 * Create error response for protected guest endpoints
 *
 * Used when guest access validation fails.
 *
 * @param state Stay state that caused the block
 * @param reason Human-readable reason
 * @returns API error response object
 */
export function createGuestAccessErrorResponse(
  state: StayState,
  reason: string
) {
  const httpStatus =
    state === "upcoming" ? 425 : state === "expired" ? 410 : 403;

  return {
    success: false,
    error: reason,
    state,
    httpStatus,
  };
}

/**
 * Middleware-ready stay check
 *
 * Returns true/false for use in middleware auth decisions.
 *
 * @param token Token to check
 * @param config Optional configuration
 * @returns true if access allowed, false otherwise
 */
export function canAccessStay(
  token: any,
  config?: { gracePeriodHours?: number }
): boolean {
  if (!token) return false;

  const stayDates = {
    accessStartsAt: token.valid_from,
    checkoutDate: token.checkout_date || token.valid_until,
    accessEndsAt: token.valid_until,
  };

  const stayStatus = getStayStatus(
    {
      accessStartsAt: parseStayDate(stayDates.accessStartsAt),
      checkoutDate: parseStayDate(stayDates.checkoutDate),
      accessEndsAt: parseStayDate(stayDates.accessEndsAt),
    },
    createStayConfig(config)
  );

  return stayStatus.isAllowed;
}
