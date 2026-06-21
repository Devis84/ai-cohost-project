import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUser } from '@/lib/auth/get-auth-user'
import { updateGuestRequestStatus } from '@/lib/services/guest-request-service'
import { cancelEscalation } from '@/lib/services/escalation-service'
import { handleIdempotentTransition } from '../transition-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const idSchema = z.string().uuid('id must be a valid UUID')

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let user
  try {
    user = await getAuthUser()
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const parseResult = idSchema.safeParse(id)
  if (!parseResult.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid request id' },
      { status: 400 },
    )
  }

  const requestId = parseResult.data

  return handleIdempotentTransition(requestId, 'acknowledged', user.id, async () => {
    let updated
    try {
      updated = await updateGuestRequestStatus(requestId, 'acknowledged', user.id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { success: false, error: message }
    }

    // Cancel pending escalation jobs after a successful status update.
    // A cancellation failure does not roll back the status change — it is logged
    // and the response still reflects the committed acknowledged state.
    try {
      await cancelEscalation(requestId)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'cancelEscalation failed'
      console.error('[acknowledge] cancelEscalation failed after status update', {
        requestId,
        error: message,
      })
    }

    return { success: true, data: updated }
  })
}
