import { describe, it, expect } from 'vitest'
import {
  buildDeepLinkUrl,
  extractRouteFromNotificationData,
} from '@/lib/notifications/notification-click-handler'

describe('notification-click-handler', () => {
  describe('buildDeepLinkUrl', () => {
    it('returns the route directly when it starts with /', () => {
      const result = buildDeepLinkUrl('/host/requests/abc-123')
      expect(result).toBe('/host/requests/abc-123')
    })

    it('returns /dashboard as fallback when route does not start with /', () => {
      // Routes without a leading '/' are not safe relative paths from our server;
      // the server always emits absolute paths. Fall back to prevent open redirect.
      const result = buildDeepLinkUrl('host/requests/abc-123')
      expect(result).toBe('/dashboard')
    })

    it('returns /dashboard as fallback for protocol-relative URLs', () => {
      // //evil.com starts with '/' but would be treated as an absolute URL by browsers.
      const result = buildDeepLinkUrl('//evil.com/steal-data')
      expect(result).toBe('/dashboard')
    })

    it('returns /dashboard as fallback for absolute URLs', () => {
      const result = buildDeepLinkUrl('https://evil.com')
      expect(result).toBe('/dashboard')
    })

    it('returns /dashboard as fallback when route is empty', () => {
      const result = buildDeepLinkUrl('')
      expect(result).toBe('/dashboard')
    })

    it('returns /dashboard as fallback when route is undefined', () => {
      const result = buildDeepLinkUrl(undefined)
      expect(result).toBe('/dashboard')
    })

    it('preserves query parameters', () => {
      const result = buildDeepLinkUrl('/host/requests/abc-123?tab=details')
      expect(result).toBe('/host/requests/abc-123?tab=details')
    })

    it('handles deeply nested routes', () => {
      const result = buildDeepLinkUrl('/host/requests/abc/details')
      expect(result).toBe('/host/requests/abc/details')
    })
  })

  describe('extractRouteFromNotificationData', () => {
    it('extracts route from notification data object', () => {
      const data = { route: '/host/requests/req-1' }
      expect(extractRouteFromNotificationData(data)).toBe('/host/requests/req-1')
    })

    it('returns undefined when data has no route', () => {
      const data = { title: 'New Request' }
      expect(extractRouteFromNotificationData(data)).toBeUndefined()
    })

    it('returns undefined when data is null', () => {
      expect(extractRouteFromNotificationData(null)).toBeUndefined()
    })

    it('returns undefined when data is undefined', () => {
      expect(extractRouteFromNotificationData(undefined)).toBeUndefined()
    })

    it('returns undefined when route is not a string', () => {
      const data = { route: 123 }
      expect(extractRouteFromNotificationData(data)).toBeUndefined()
    })

    it('handles empty data object', () => {
      expect(extractRouteFromNotificationData({})).toBeUndefined()
    })

    it('extracts request id from route', () => {
      const data = { route: '/host/requests/550e8400-e29b-41d4-a716-446655440000' }
      const route = extractRouteFromNotificationData(data)
      expect(route).toBe('/host/requests/550e8400-e29b-41d4-a716-446655440000')
    })
  })
})
