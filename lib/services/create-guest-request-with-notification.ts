/**
 * Transactional guest request creation with outbox pattern.
 *
 * Uses the `create_guest_request_with_jobs` Postgres RPC which wraps
 * both the guest_requests INSERT and the notification_attempts INSERT
 * in a single transaction. This guarantees that either both succeed or
 * neither does — no orphaned requests without notification jobs.
 */

import { supabaseServer } from '@/lib/supabase/supabase-server'
import { getHostAssignmentService } from '@/lib/services/host-assignment-service'
import type { GuestRequest, GuestRequestInsert } from '@/types/notification-system'

export interface CreateRequestResult {
  request: GuestRequest
  jobCount: number
}

export async function createGuestRequestWithNotification(
  data: GuestRequestInsert,
): Promise<CreateRequestResult> {
  const assignmentService = getHostAssignmentService()

  // Resolve recipients before opening the transaction so the RPC
  // receives a complete host list in a single call.
  const recipients = await assignmentService.findRecipients({
    property_id: data.property_id,
  } as GuestRequest)

  const hostIds = recipients.map((r) => r.hostId)

  const { data: requestJson, error } = await supabaseServer.rpc(
    'create_guest_request_with_jobs',
    {
      p_property_id: data.property_id,
      p_title: data.title,
      p_category: data.category ?? 'general',
      p_priority: data.priority ?? 'normal',
      p_description: data.description ?? null,
      p_room_id: data.room_id ?? null,
      p_guest_id: data.guest_id ?? null,
      p_host_ids: hostIds,
    },
  )

  if (error) {
    throw new Error(`Failed to create guest request: ${error.message}`)
  }

  const request = requestJson as GuestRequest

  return {
    request,
    jobCount: hostIds.length,
  }
}
