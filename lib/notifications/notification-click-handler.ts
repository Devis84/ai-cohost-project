const FALLBACK_ROUTE = '/dashboard'

/**
 * Builds an absolute deep-link URL from a notification route string.
 * Only accepts routes that begin with a single '/' (relative path) to prevent
 * open redirect via protocol-relative URLs (e.g. //evil.com).
 * Falls back to /dashboard when the route is empty, undefined, or unsafe.
 */
export function buildDeepLinkUrl(route: string | undefined): string {
  if (!route) {
    return FALLBACK_ROUTE
  }

  // Reject protocol-relative URLs (//host/path) and absolute URLs (https://…)
  // by requiring routes to begin with exactly one '/' followed by a non-'/'.
  if (!route.startsWith('/') || route.startsWith('//')) {
    return FALLBACK_ROUTE
  }

  return route
}

/**
 * Extracts the deep-link route string from a notification data payload.
 * Returns undefined when the payload has no valid string `route` field.
 */
export function extractRouteFromNotificationData(
  data: unknown,
): string | undefined {
  if (data === null || data === undefined) {
    return undefined
  }

  if (typeof data !== 'object') {
    return undefined
  }

  const record = data as Record<string, unknown>

  if (typeof record['route'] !== 'string') {
    return undefined
  }

  return record['route']
}
