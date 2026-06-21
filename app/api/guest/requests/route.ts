import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createGuestRequestWithNotification } from '@/lib/services/create-guest-request-with-notification'
import { processPendingJobs } from '@/lib/workers/notification-worker'
import { checkRateLimit, createRateLimiter } from '@/lib/rate-limiter/rate-limiter'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** 10 requests per minute per IP address. */
const guestRequestLimiter = createRateLimiter({
  maxRequests: Number(process.env.GUEST_REQUEST_RATE_LIMIT ?? 10),
  windowMs: 60_000,
})

const createRequestSchema = z.object({
  property_id: z.string().uuid('property_id must be a valid UUID'),
  title: z.string().min(1, 'title is required').max(500, 'title must be at most 500 characters'),
  room_id: z.string().nullable().optional(),
  guest_id: z.string().nullable().optional(),
  category: z.string().optional(),
  priority: z
    .enum(['low', 'normal', 'medium', 'high', 'urgent'])
    .optional(),
  description: z.string().nullable().optional(),
})

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIp(request)
  const rateLimitResult = checkRateLimit(guestRequestLimiter, clientIp)

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

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  const parseResult = createRequestSchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(', '),
      },
      { status: 400 },
    )
  }

  try {
    const { request: guestRequest } = await createGuestRequestWithNotification(parseResult.data)

    // Fire-and-forget: kick off the notification worker without blocking the response.
    // Errors from the worker are isolated and do not affect the HTTP response.
    void processPendingJobs().catch(() => {
      // Worker errors are handled internally; silence the unhandled rejection.
    })

    return NextResponse.json({ success: true, data: guestRequest }, { status: 201 })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to create guest request' },
      { status: 500 },
    )
  }
}
