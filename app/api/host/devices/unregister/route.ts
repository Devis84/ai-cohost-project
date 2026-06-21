import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUser } from '@/lib/auth/get-auth-user'
import { unregisterDevice } from '@/lib/services/device-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const unregisterSchema = z.object({
  device_id: z.string().uuid('device_id must be a valid UUID'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 },
      )
    }

    const parseResult = unregisterSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues.map((i) => i.message).join(', '),
        },
        { status: 400 },
      )
    }

    const device = await unregisterDevice(user.id, parseResult.data.device_id)

    return NextResponse.json({ success: true, data: device }, { status: 200 })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      )
    }

    return NextResponse.json(
      { success: false, error: 'Unable to unregister device' },
      { status: 500 },
    )
  }
}
