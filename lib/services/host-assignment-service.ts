import { supabaseServer } from '@/lib/supabase/supabase-server'
import type { GuestRequest } from '@/types/notification-system'

export interface HostRecipient {
  hostId: string
  propertyId: string
}

export interface HostAssignmentService {
  findRecipients(request: GuestRequest): Promise<HostRecipient[]>
}

type PropertyRow = {
  id: string
  owner_id: string | null
}

export class PropertyBasedAssignmentService implements HostAssignmentService {
  async findRecipients(request: GuestRequest): Promise<HostRecipient[]> {
    const { data, error } = await supabaseServer
      .from('properties')
      .select('id, owner_id')
      .eq('id', request.property_id)
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return []
      }
      throw new Error(error.message)
    }

    const row = data as PropertyRow | null

    if (!row || row.owner_id === null) {
      return []
    }

    return [
      {
        hostId: row.owner_id,
        propertyId: row.id,
      },
    ]
  }
}

export function getHostAssignmentService(): HostAssignmentService {
  return new PropertyBasedAssignmentService()
}
