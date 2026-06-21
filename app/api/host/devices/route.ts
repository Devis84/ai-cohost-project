import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/get-auth-user'
import { listActiveDevices } from '@/lib/services/device-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const user = await getAuthUser()

    const devices = await listActiveDevices(user.id)

    return NextResponse.json(
      { success: true, data: devices },
      { status: 200 },
    )
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      )
    }

    return NextResponse.json(
      { success: false, error: 'Unable to list devices' },
      { status: 500 },
    )
  }
}
