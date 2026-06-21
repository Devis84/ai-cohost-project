export type DevicePlatform = 'ios' | 'android' | 'web' | 'unknown'

export type DeviceAppType = 'native' | 'pwa' | 'browser'

export type RequestStatus =
  | 'new'
  | 'notified'
  | 'seen'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'cancelled'
  | 'escalated'

export type DeliveryStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'invalid_token'
  | 'acknowledged'
  | 'cancelled'

export type RequestPriority = 'low' | 'normal' | 'medium' | 'high' | 'urgent'

export type NotificationChannel = 'push' | 'sms' | 'whatsapp' | 'email'

export type PermissionStatus = 'default' | 'granted' | 'denied'

// ── host_devices ──────────────────────────────────────────────

export interface HostDevice {
  readonly id: string
  readonly host_id: string
  readonly property_id: string | null
  readonly platform: DevicePlatform
  readonly app_type: DeviceAppType
  readonly notification_token: string
  readonly notifications_enabled: boolean
  readonly permission_status: PermissionStatus
  readonly device_name: string | null
  readonly app_version: string | null
  readonly last_seen_at: string | null
  readonly token_updated_at: string | null
  readonly created_at: string
  readonly updated_at: string
  readonly revoked_at: string | null
}

export interface HostDeviceInsert {
  host_id: string
  notification_token: string
  property_id?: string | null
  platform?: DevicePlatform
  app_type?: DeviceAppType
  notifications_enabled?: boolean
  permission_status?: PermissionStatus
  device_name?: string | null
  app_version?: string | null
  last_seen_at?: string | null
}

export interface HostDeviceUpdate {
  property_id?: string | null
  platform?: DevicePlatform
  app_type?: DeviceAppType
  notification_token?: string
  notifications_enabled?: boolean
  permission_status?: PermissionStatus
  device_name?: string | null
  app_version?: string | null
  last_seen_at?: string | null
  token_updated_at?: string | null
  revoked_at?: string | null
}

// ── guest_requests ────────────────────────────────────────────

export interface GuestRequest {
  readonly id: string
  readonly property_id: string
  readonly room_id: string | null
  readonly guest_id: string | null
  readonly conversation_id: string | null
  readonly category: string
  readonly priority: RequestPriority
  readonly title: string
  readonly description: string | null
  readonly status: RequestStatus
  readonly assigned_host_id: string | null
  readonly acknowledged_by: string | null
  readonly acknowledged_at: string | null
  readonly seen_at: string | null
  readonly started_at: string | null
  readonly resolved_at: string | null
  readonly escalated_at: string | null
  readonly created_at: string
  readonly updated_at: string
}

export interface GuestRequestInsert {
  property_id: string
  title: string
  room_id?: string | null
  guest_id?: string | null
  conversation_id?: string | null
  category?: string
  priority?: RequestPriority
  description?: string | null
  assigned_host_id?: string | null
}

export interface GuestRequestUpdate {
  room_id?: string | null
  guest_id?: string | null
  conversation_id?: string | null
  category?: string
  priority?: RequestPriority
  title?: string
  description?: string | null
  status?: RequestStatus
  assigned_host_id?: string | null
  acknowledged_by?: string | null
  acknowledged_at?: string | null
  seen_at?: string | null
  started_at?: string | null
  resolved_at?: string | null
  escalated_at?: string | null
}

// ── notification_attempts ─────────────────────────────────────

export interface NotificationAttempt {
  readonly id: string
  readonly guest_request_id: string
  readonly host_id: string
  readonly host_device_id: string | null
  readonly channel: NotificationChannel
  readonly attempt_number: number
  readonly provider_message_id: string | null
  readonly status: DeliveryStatus
  readonly failure_code: string | null
  readonly failure_message: string | null
  readonly sent_at: string | null
  readonly acknowledged_at: string | null
  readonly created_at: string
  readonly updated_at: string
}

export interface NotificationAttemptInsert {
  guest_request_id: string
  host_id: string
  host_device_id?: string | null
  channel?: NotificationChannel
  attempt_number?: number
  provider_message_id?: string | null
  status?: DeliveryStatus
  failure_code?: string | null
  failure_message?: string | null
  sent_at?: string | null
}

export interface NotificationAttemptUpdate {
  host_device_id?: string | null
  channel?: NotificationChannel
  attempt_number?: number
  provider_message_id?: string | null
  status?: DeliveryStatus
  failure_code?: string | null
  failure_message?: string | null
  sent_at?: string | null
  acknowledged_at?: string | null
}

// ── State machine ─────────────────────────────────────────────

export const VALID_REQUEST_TRANSITIONS: Readonly<
  Record<RequestStatus, readonly RequestStatus[]>
> = {
  new: ['notified', 'cancelled'],
  notified: ['seen', 'acknowledged', 'escalated', 'cancelled'],
  seen: ['acknowledged', 'escalated', 'cancelled'],
  acknowledged: ['in_progress', 'resolved', 'cancelled'],
  in_progress: ['resolved', 'escalated', 'cancelled'],
  escalated: ['acknowledged', 'in_progress', 'resolved', 'cancelled'],
  resolved: [],
  cancelled: [],
} as const

export function isValidRequestTransition(
  from: RequestStatus,
  to: RequestStatus,
): boolean {
  const allowed = VALID_REQUEST_TRANSITIONS[from]
  return allowed.includes(to)
}
