import { supabaseServer } from '@/lib/supabase/supabase-server'
import type { HostDevice, HostDeviceInsert, HostDeviceUpdate } from '@/types/notification-system'

export async function registerDevice(
  hostId: string,
  data: HostDeviceInsert,
): Promise<HostDevice> {
  // Revoke any stale entries for this token on other hosts
  const { error: revokeError } = await supabaseServer
    .from('host_devices')
    .update({ revoked_at: new Date().toISOString() } satisfies HostDeviceUpdate)
    .eq('notification_token', data.notification_token)
    .neq('host_id', hostId)
    .is('revoked_at', null)

  if (revokeError) {
    throw new Error(`Failed to revoke stale device tokens: ${revokeError.message}`)
  }

  const upsertPayload: HostDeviceInsert & { token_updated_at: string } = {
    ...data,
    host_id: hostId,
    token_updated_at: new Date().toISOString(),
  }

  const { data: device, error } = await supabaseServer
    .from('host_devices')
    .upsert(upsertPayload, {
      onConflict: 'host_id,notification_token',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to register device: ${error.message}`)
  }

  return device as HostDevice
}

export async function unregisterDevice(hostId: string, deviceId: string): Promise<HostDevice> {
  const { data: device, error } = await supabaseServer
    .from('host_devices')
    .update({ revoked_at: new Date().toISOString() } satisfies HostDeviceUpdate)
    .eq('id', deviceId)
    .eq('host_id', hostId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to unregister device: ${error.message}`)
  }

  return device as HostDevice
}

export async function listActiveDevices(hostId: string): Promise<HostDevice[]> {
  const { data: devices, error } = await supabaseServer
    .from('host_devices')
    .select('*')
    .eq('host_id', hostId)
    .is('revoked_at', null)

  if (error) {
    throw new Error(`Failed to list devices: ${error.message}`)
  }

  return (devices ?? []) as HostDevice[]
}

export async function deleteDevice(hostId: string, deviceId: string): Promise<void> {
  const { data, error } = await supabaseServer
    .from('host_devices')
    .delete()
    .eq('id', deviceId)
    .eq('host_id', hostId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to delete device: ${error.message}`)
  }

  // If no row returned, the device didn't exist or didn't belong to host
  if (!data) {
    throw new Error('Device not found or access denied')
  }
}

export async function rotateToken(
  hostId: string,
  deviceId: string,
  newToken: string,
): Promise<HostDevice> {
  if (!newToken) {
    throw new Error('New token must not be empty')
  }

  const { data: device, error } = await supabaseServer
    .from('host_devices')
    .update({
      notification_token: newToken,
      token_updated_at: new Date().toISOString(),
    } satisfies HostDeviceUpdate)
    .eq('id', deviceId)
    .eq('host_id', hostId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to rotate token: ${error.message}`)
  }

  return device as HostDevice
}
