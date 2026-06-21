import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/get-auth-user'
import { listGuestRequests } from '@/lib/services/guest-request-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(): Promise<NextResponse> {
  let user
  try {
    user = await getAuthUser()
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const requests = await listGuestRequests(user.id)
    return NextResponse.json({ success: true, data: requests }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to list requests'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
