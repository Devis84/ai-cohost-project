import { supabaseServer } from '@/lib/supabase/supabase-server'
import { isValidRequestTransition } from '@/types/notification-system'
import type {
  GuestRequest,
  GuestRequestInsert,
  GuestRequestUpdate,
  RequestStatus,
} from '@/types/notification-system'

export async function createGuestRequest(data: GuestRequestInsert): Promise<GuestRequest> {
  const insertPayload: GuestRequestInsert & {
    status: RequestStatus
    category: string
    priority: string
  } = {
    ...data,
    status: 'new',
    category: data.category ?? 'general',
    priority: data.priority ?? 'normal',
  }

  const { data: request, error } = await supabaseServer
    .from('guest_requests')
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return request as GuestRequest
}

export async function listGuestRequests(hostId: string): Promise<GuestRequest[]> {
  const { data, error } = await supabaseServer
    .from('guest_requests')
    .select('*')
    .eq('assigned_host_id', hostId)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as GuestRequest[]
}

export async function getGuestRequest(id: string, hostId?: string): Promise<GuestRequest | null> {
  const { data: request, error } = await supabaseServer
    .from('guest_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(error.message)
  }

  const guestRequest = request as GuestRequest

  // Enforce ownership when a hostId is provided: reject requests that do not
  // belong to the authenticated host, returning null to the caller so it can
  // respond with 404 (same as not-found — avoids leaking existence of the ID).
  if (hostId !== undefined && guestRequest.assigned_host_id !== hostId) {
    return null
  }

  return guestRequest
}

export async function updateGuestRequestStatus(
  id: string,
  status: RequestStatus,
  updatedBy?: string,
): Promise<GuestRequest> {
  // Use updatedBy as the ownership check: the acting host must be assigned
  // to the request. Pass hostId only when provided (worker path may omit it).
  const existing = await getGuestRequest(id, updatedBy)

  if (!existing) {
    throw new Error(`Guest request not found: ${id}`)
  }

  if (!isValidRequestTransition(existing.status, status)) {
    throw new Error(
      `Invalid status transition from '${existing.status}' to '${status}'`,
    )
  }

  const updatePayload: GuestRequestUpdate = { status }

  if (status === 'acknowledged' && updatedBy) {
    updatePayload.acknowledged_by = updatedBy
    updatePayload.acknowledged_at = new Date().toISOString()
  }

  if (status === 'in_progress') {
    updatePayload.started_at = new Date().toISOString()
  }

  if (status === 'resolved') {
    updatePayload.resolved_at = new Date().toISOString()
  }

  if (status === 'escalated') {
    updatePayload.escalated_at = new Date().toISOString()
  }

  if (status === 'seen') {
    updatePayload.seen_at = new Date().toISOString()
  }

  const { data: updated, error } = await supabaseServer
    .from('guest_requests')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updated as GuestRequest
}
