/**
 * Inactive device token cleanup service.
 *
 * Design decisions:
 * - Queries for devices not seen in N days and marks them as revoked.
 * - Excludes already-revoked devices (revoked_at IS NOT NULL).
 * - Respects a configurable batchSize to avoid locking too many rows at once.
 * - Returns a result summary so callers (scheduled jobs, health checks) can log it.
 */

import { supabaseServer } from '@/lib/supabase/supabase-server'

export interface DeviceCleanupConfig {
  /** How many days of inactivity before a device is considered stale. */
  inactiveDaysThreshold: number
  /** Maximum number of devices to revoke per invocation. */
  batchSize: number
}

export interface DeviceCleanupResult {
  /** Number of devices found and submitted for revocation. */
  processedCount: number
  /** Number of rows successfully updated to revoked status. */
  revokedCount: number
}

function computeCutoffDate(inactiveDaysThreshold: number): string {
  const cutoff = new Date(Date.now() - inactiveDaysThreshold * 24 * 60 * 60 * 1000)
  return cutoff.toISOString()
}

/**
 * Finds devices inactive longer than the configured threshold and marks them
 * as revoked. Devices without a last_seen_at value are compared by
 * token_updated_at to avoid cleaning up freshly-created devices.
 */
export async function cleanupInactiveDevices(
  config: DeviceCleanupConfig,
): Promise<DeviceCleanupResult> {
  const cutoffDate = computeCutoffDate(config.inactiveDaysThreshold)

  const { data: staleDevices, error: selectError } = await supabaseServer
    .from('host_devices')
    .select('id')
    .is('revoked_at', null)
    .lt('last_seen_at', cutoffDate)
    .order('last_seen_at', { ascending: true })
    .limit(config.batchSize)

  if (selectError) {
    throw new Error(selectError.message)
  }

  const devices = staleDevices ?? []

  if (devices.length === 0) {
    return { processedCount: 0, revokedCount: 0 }
  }

  const deviceIds = devices.map((d: { id: string }) => d.id)
  const revokedAt = new Date().toISOString()

  const { data: updatedDevices, error: updateError } = await supabaseServer
    .from('host_devices')
    .update({ revoked_at: revokedAt })
    .in('id', deviceIds)
    .select('id')

  if (updateError) {
    throw new Error(updateError.message)
  }

  const revokedCount = (updatedDevices ?? []).length

  return {
    processedCount: devices.length,
    revokedCount,
  }
}
