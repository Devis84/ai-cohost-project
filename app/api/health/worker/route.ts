import { NextResponse } from 'next/server'
import { getWorkerHealth } from '@/lib/workers/worker-health'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(): Promise<NextResponse> {
  try {
    const health = getWorkerHealth()
    return NextResponse.json({ success: true, data: health }, { status: 200 })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Health check unavailable' },
      { status: 500 },
    )
  }
}
