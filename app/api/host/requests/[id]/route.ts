import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUser } from '@/lib/auth/get-auth-user'
import { getGuestRequest } from '@/lib/services/guest-request-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const idSchema = z.string().uuid('id must be a valid UUID')

export async function GET(
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

  try {
    const request = await getGuestRequest(parseResult.data, user.id)
    if (!request) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: request }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to get request'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
