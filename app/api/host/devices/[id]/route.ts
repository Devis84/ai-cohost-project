import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUser } from '@/lib/auth/get-auth-user'
import { deleteDevice } from '@/lib/services/device-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const uuidSchema = z.string().uuid('Device id must be a valid UUID')

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser()

    const { id } = await params

    const parseResult = uuidSchema.safeParse(id)
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.issues[0]?.message ?? 'Invalid device id' },
        { status: 400 },
      )
    }

    await deleteDevice(user.id, parseResult.data)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      )
    }

    return NextResponse.json(
      { success: false, error: 'Unable to delete device' },
      { status: 500 },
    )
  }
}
