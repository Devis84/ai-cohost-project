/**
 * Stay Access Validator
 *
 * Centralized validation for all guest access requests.
 * Every guest request (API, frontend, WebSocket) should pass through here.
 *
 * Returns standardized response structure:
 * - allowed: boolean (can guest access?)
 * - state: StayState (upcoming/active/grace/expired)
 * - reason: string (why allowed/blocked)
 *
 * Designed for:
 * - API endpoint protection
 * - Frontend state management
 * - Future: middleware, webhooks, audit logging
 */

import {
  getStayStatus,
  parseStayDate,
  createStayConfig,
  type StayState,
  type StayLifecycleConfig,
} from "./stay-lifecycle";

export interface AccessValidationRequest {
  token?: string;
  propertySlug?: string;
  guestAccessToken?: any;
  stayDates?: {
    accessStartsAt?: string | Date | null;
    checkinDate?: string | Date | null;
    checkoutDate?: string | Date | null;
    accessEndsAt?: string | Date | null;
  };
  config?: Partial<StayLifecycleConfig>;
}

export interface AccessValidationResponse {
  allowed: boolean;
  blocked: boolean;
  status: "allowed" | "blocked" | "pending";
  reason: string;
  state?: StayState;
  details?: {
    tokenValid: boolean;
    propertyValid: boolean;
    dateValid: boolean;
    stayAllowed: boolean;
  };
}

/**
 * Validate guest access to a property
 *
 * This is the central validation point for all guest requests.
 * It combines:
 * - Token validation (does token exist and is it valid?)
 * - Date validation (are dates in correct format?)
 * - Stay state validation (is stay in allowed state?)
 *
 * @param request Access request with token, property, dates
 * @param config Optional custom configuration
 * @returns Standardized validation response
 *
 * @example
 * // API endpoint protection
 * const validation = await validateGuestAccess({
 *   token: request.query.token,
 *   propertySlug: request.query.property,
 *   stayDates: {
 *     checkoutDate: token.checkout_date,
 *     accessStartsAt: token.valid_from,
 *   }
 * });
 *
 * if (!validation.allowed) {
 *   return res.status(403).json(validation);
 * }
 */
export function validateGuestAccess(
  request: AccessValidationRequest,
  config?: Partial<StayLifecycleConfig>
): AccessValidationResponse {
  const fullConfig = createStayConfig(config);

  // Step 1: Token validation
  const tokenValid = !!(request.token || request.guestAccessToken);

  if (!tokenValid && !request.propertySlug) {
    return {
      allowed: false,
      blocked: true,
      status: "blocked",
      reason:
        "No guest token or property identifier provided",
      details: {
        tokenValid: false,
        propertyValid: false,
        dateValid: false,
        stayAllowed: false,
      },
    };
  }

  // Step 2: Date validation
  const stayDates = request.stayDates || {};
  const dateValid =
    stayDates.checkinDate ||
    stayDates.accessStartsAt ||
    stayDates.checkoutDate;

  if (!dateValid) {
    // No dates provided - allow for backward compatibility
    return {
      allowed: true,
      blocked: false,
      status: "allowed",
      reason:
        "No stay dates provided - allowing for backward compatibility",
      state: "active",
      details: {
        tokenValid,
        propertyValid: !!request.propertySlug,
        dateValid: false,
        stayAllowed: true,
      },
    };
  }

  // Step 3: Parse dates
  const parsedDates = {
    accessStartsAt: parseStayDate(stayDates.accessStartsAt),
    checkinDate: parseStayDate(stayDates.checkinDate),
    checkoutDate: parseStayDate(stayDates.checkoutDate),
    accessEndsAt: parseStayDate(stayDates.accessEndsAt),
  };

  // Step 4: Get stay status
  const stayStatus = getStayStatus(parsedDates, fullConfig);

  return {
    allowed: stayStatus.isAllowed,
    blocked: !stayStatus.isAllowed,
    status: stayStatus.isAllowed ? "allowed" : "blocked",
    reason: stayStatus.reason,
    state: stayStatus.state,
    details: {
      tokenValid,
      propertyValid: !!request.propertySlug,
      dateValid: true,
      stayAllowed: stayStatus.isAllowed,
    },
  };
}

/**
 * Validate guest can use AI features
 *
 * Similar to validateGuestAccess but specifically for AI endpoints.
 * Returns different rules (grace period allows AI, upcoming doesn't).
 *
 * @param request Access request
 * @param config Optional configuration
 * @returns Validation response for AI access
 */
export function validateAIAccess(
  request: AccessValidationRequest,
  config?: Partial<StayLifecycleConfig>
): AccessValidationResponse {
  const fullConfig = createStayConfig(config);

  // First pass through standard validation
  const baseValidation = validateGuestAccess(request, fullConfig);

  if (!baseValidation.allowed) {
    return baseValidation;
  }

  // Additional check: AI-specific rules
  if (baseValidation.state === "upcoming") {
    return {
      allowed: false,
      blocked: true,
      status: "blocked",
      reason: "AI is not available before your stay begins",
      state: "upcoming",
      details: baseValidation.details,
    };
  }

  if (baseValidation.state === "expired") {
    return {
      allowed: false,
      blocked: true,
      status: "blocked",
      reason: "Your stay has ended. Thank you for visiting!",
      state: "expired",
      details: baseValidation.details,
    };
  }

  // Active and grace_period allow AI
  return {
    allowed: true,
    blocked: false,
    status: "allowed",
    reason:
      baseValidation.state === "grace_period"
        ? "AI available during grace period"
        : "AI available during your stay",
    state: baseValidation.state,
    details: baseValidation.details,
  };
}

/**
 * Create validation response for a revoked/expired token
 *
 * @param reason Why token is invalid
 * @returns Blocked validation response
 */
export function createBlockedResponse(
  reason: string
): AccessValidationResponse {
  return {
    allowed: false,
    blocked: true,
    status: "blocked",
    reason,
    details: {
      tokenValid: false,
      propertyValid: false,
      dateValid: false,
      stayAllowed: false,
    },
  };
}

/**
 * Create allowed response for backward compatibility cases
 *
 * @param reason Why access is allowed
 * @param state Optional stay state
 * @returns Allowed validation response
 */
export function createAllowedResponse(
  reason: string,
  state?: StayState
): AccessValidationResponse {
  return {
    allowed: true,
    blocked: false,
    status: "allowed",
    reason,
    state: state || "active",
    details: {
      tokenValid: true,
      propertyValid: true,
      dateValid: false,
      stayAllowed: true,
    },
  };
}
