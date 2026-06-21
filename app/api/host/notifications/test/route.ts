import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/get-auth-user'
import { getNotificationProvider } from '@/lib/notifications/notification-service'
import { listActiveDevices } from '@/lib/services/device-service'
import { checkRateLimit, createRateLimiter } from '@/lib/rate-limiter/rate-limiter'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * 5 test notifications per minute per authenticated user.
 * Keyed on user ID (not IP) so that IP spoofing cannot bypass the limit.
 * Auth is resolved first; the rate-limit check follows immediately after.
 */
const testNotificationLimiter = createRateLimiter({
  maxRequests: Number(process.env.TEST_NOTIFICATION_RATE_LIMIT ?? 5),
  windowMs: 60_000,
})

export async function POST(): Promise<NextResponse> {
  // Authenticate first — rate limit is per user, so we need the user ID.
  let userId: string
  try {
    const user = await getAuthUser()
    userId = user.id
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    )
  }

  // Rate-limit by authenticated user ID — not spoofable via headers.
  const rateLimitResult = checkRateLimit(testNotificationLimiter, userId)
  if (!rateLimitResult.allowed) {
    const retryAfterSeconds = Math.ceil(rateLimitResult.retryAfterMs / 1000)
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSeconds) },
      },
    )
  }

  try {
    const devices = await listActiveDevices(userId)

    if (devices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No registered devices found' },
        { status: 400 },
      )
    }

    const tokens = devices.map((d) => d.notification_token)
    const provider = getNotificationProvider()

    await provider.sendMulticast(tokens, {
      title: 'AI Co-Host Test',
      body: 'Push notifications are working correctly.',
      data: {
        type: 'test',
        route: '/dashboard/notifications',
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to send test notification' },
      { status: 500 },
    )
  }
}
