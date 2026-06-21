import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUser } from '@/lib/auth/get-auth-user'
import { registerDevice } from '@/lib/services/device-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const registerSchema = z.object({
  notification_token: z
    .string()
    .min(1, 'notification_token is required')
    .max(4096, 'notification_token exceeds maximum length'),
  platform: z.enum(['ios', 'android', 'web', 'unknown']).optional(),
  app_type: z.enum(['native', 'pwa', 'browser']).optional(),
  property_id: z.string().uuid().nullable().optional(),
  notifications_enabled: z.boolean().optional(),
  permission_status: z.enum(['default', 'granted', 'denied']).optional(),
  device_name: z.string().nullable().optional(),
  app_version: z.string().nullable().optional(),
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

    const parseResult = registerSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues.map((i) => i.message).join(', '),
        },
        { status: 400 },
      )
    }

    const device = await registerDevice(user.id, {
      ...parseResult.data,
      host_id: user.id,
    })

    return NextResponse.json({ success: true, data: device }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      )
    }

    return NextResponse.json(
      { success: false, error: 'Unable to register device' },
      { status: 500 },
    )
  }
}
