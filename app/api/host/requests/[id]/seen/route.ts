import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUser } from '@/lib/auth/get-auth-user'
import { updateGuestRequestStatus } from '@/lib/services/guest-request-service'
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

  return handleIdempotentTransition(requestId, 'seen', user.id, async () => {
    try {
      const updated = await updateGuestRequestStatus(requestId, 'seen', user.id)
      return { success: true, data: updated }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { success: false, error: message }
    }
  })
}
