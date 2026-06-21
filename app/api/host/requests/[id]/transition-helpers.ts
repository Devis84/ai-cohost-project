import { NextResponse } from 'next/server'
import type { RequestStatus } from '@/types/notification-system'
import { getGuestRequest } from '@/lib/services/guest-request-service'

/**
 * Determines whether a thrown error message indicates an invalid state transition
 * (as opposed to a not-found or generic DB error).
 */
export function isTransitionError(message: string): boolean {
  return message.toLowerCase().includes('invalid status transition')
}

/**
 * Determines whether a thrown error message indicates a resource not found.
 */
export function isNotFoundError(message: string): boolean {
  return message.toLowerCase().includes('not found')
}

/**
 * Result type returned by the `runUpdate` callback supplied to
 * `handleIdempotentTransition`. Either carries the successfully updated
 * resource or an error message describing the failure.
 */
export type TransitionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Attempts an idempotent status-action route.
 *
 * - If the update succeeds, returns the updated request.
 * - If the transition fails and the current status already matches `targetStatus`,
 *   returns the current request as-is (idempotent success).
 * - If the transition fails and the current status is different, returns 409 Conflict.
 * - If the request is not found (or does not belong to hostId), returns 404.
 *
 * @param hostId - The authenticated host's user ID. Used to scope the idempotency
 *   re-fetch so that a host cannot observe another host's request state through the
 *   conflict-resolution path.
 */
export async function handleIdempotentTransition<T>(
  requestId: string,
  targetStatus: RequestStatus,
  hostId: string,
  runUpdate: () => Promise<TransitionResult<T>>,
): Promise<NextResponse> {
  const result = await runUpdate()

  if (result.success) {
    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  }

  const message = result.error

  if (isNotFoundError(message)) {
    return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
  }

  if (isTransitionError(message)) {
    // Check if idempotent: already at target status.
    // Pass hostId to ensure the re-fetch is ownership-scoped.
    try {
      const current = await getGuestRequest(requestId, hostId)
      if (current && current.status === targetStatus) {
        return NextResponse.json({ success: true, data: current }, { status: 200 })
      }
    } catch {
      // If lookup fails, fall through to 409
    }
    return NextResponse.json({ success: false, error: 'Request is in a conflicting state' }, { status: 409 })
  }

  return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
}
