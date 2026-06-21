-- Notification system: host_devices, guest_requests, notification_attempts
-- Phase 1 of Cross-Platform Host Notification System

-- ============================================================
-- Safety: warn if properties.owner_id has NULLs (guest_requests
-- RLS depends on it for host access)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.properties WHERE owner_id IS NULL) THEN
    RAISE WARNING 'properties rows with NULL owner_id exist; guest_requests RLS will silently exclude them';
  END IF;
END $$;

-- ============================================================
-- Reusable updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- host_devices
-- ============================================================
CREATE TABLE IF NOT EXISTS public.host_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  platform text NOT NULL DEFAULT 'unknown'
    CHECK (platform IN ('ios', 'android', 'web', 'unknown')),
  app_type text NOT NULL DEFAULT 'browser'
    CHECK (app_type IN ('native', 'pwa', 'browser')),
  notification_token text NOT NULL,
  notifications_enabled boolean NOT NULL DEFAULT true,
  permission_status text NOT NULL DEFAULT 'default'
    CHECK (permission_status IN ('default', 'granted', 'denied')),
  device_name text,
  app_version text,
  last_seen_at timestamptz,
  token_updated_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

-- Token uniqueness only for active (non-revoked) devices
CREATE UNIQUE INDEX IF NOT EXISTS uq_host_devices_active_token
  ON public.host_devices(host_id, notification_token)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_host_devices_host_id_active
  ON public.host_devices(host_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_host_devices_property_id
  ON public.host_devices(property_id);

CREATE INDEX IF NOT EXISTS idx_host_devices_notification_token
  ON public.host_devices(notification_token);

CREATE TRIGGER trg_host_devices_updated_at
  BEFORE UPDATE ON public.host_devices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE public.host_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view own devices"
  ON public.host_devices FOR SELECT
  USING ((SELECT auth.uid()) = host_id);

CREATE POLICY "Hosts can register own devices"
  ON public.host_devices FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = host_id);

CREATE POLICY "Hosts can update own devices"
  ON public.host_devices FOR UPDATE
  USING ((SELECT auth.uid()) = host_id);

CREATE POLICY "Hosts can remove own devices"
  ON public.host_devices FOR DELETE
  USING ((SELECT auth.uid()) = host_id);

-- ============================================================
-- guest_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS public.guest_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_id text,
  guest_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id text,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'medium', 'high', 'urgent')),
  title text NOT NULL
    CHECK (char_length(title) <= 500),
  description text
    CHECK (char_length(description) <= 5000),
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN (
      'new', 'notified', 'seen', 'acknowledged',
      'in_progress', 'resolved', 'cancelled', 'escalated'
    )),
  assigned_host_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  seen_at timestamptz,
  started_at timestamptz,
  resolved_at timestamptz,
  escalated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_requests_property_id
  ON public.guest_requests(property_id);

CREATE INDEX IF NOT EXISTS idx_guest_requests_assigned_host_id
  ON public.guest_requests(assigned_host_id);

CREATE INDEX IF NOT EXISTS idx_guest_requests_status
  ON public.guest_requests(status);

CREATE INDEX IF NOT EXISTS idx_guest_requests_created_at
  ON public.guest_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guest_requests_property_status
  ON public.guest_requests(property_id, status);

CREATE INDEX IF NOT EXISTS idx_guest_requests_host_status
  ON public.guest_requests(assigned_host_id, status);

CREATE INDEX IF NOT EXISTS idx_guest_requests_guest_id
  ON public.guest_requests(guest_id)
  WHERE guest_id IS NOT NULL;

CREATE TRIGGER trg_guest_requests_updated_at
  BEFORE UPDATE ON public.guest_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enforce that new rows must start with status = 'new'
CREATE OR REPLACE FUNCTION validate_request_status_on_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.status != 'new' THEN
    RAISE EXCEPTION 'guest_requests must be created with status = ''new'', got "%"', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_guest_requests_status_insert
  BEFORE INSERT ON public.guest_requests
  FOR EACH ROW EXECUTE FUNCTION validate_request_status_on_insert();

-- State-transition trigger (UPDATE only)
CREATE OR REPLACE FUNCTION validate_request_status_transition()
RETURNS trigger AS $$
DECLARE
  valid boolean;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  valid := CASE OLD.status
    WHEN 'new'          THEN NEW.status IN ('notified', 'cancelled')
    WHEN 'notified'     THEN NEW.status IN ('seen', 'acknowledged', 'escalated', 'cancelled')
    WHEN 'seen'         THEN NEW.status IN ('acknowledged', 'escalated', 'cancelled')
    WHEN 'acknowledged' THEN NEW.status IN ('in_progress', 'resolved', 'cancelled')
    WHEN 'in_progress'  THEN NEW.status IN ('resolved', 'escalated', 'cancelled')
    WHEN 'escalated'    THEN NEW.status IN ('acknowledged', 'in_progress', 'resolved', 'cancelled')
    WHEN 'resolved'     THEN false
    WHEN 'cancelled'    THEN false
    ELSE false
  END;

  IF NOT valid THEN
    RAISE EXCEPTION 'Invalid status transition from "%" to "%"', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_guest_requests_status_transition
  BEFORE UPDATE OF status ON public.guest_requests
  FOR EACH ROW EXECUTE FUNCTION validate_request_status_transition();

-- RLS
ALTER TABLE public.guest_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit guest requests"
  ON public.guest_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Hosts can view requests for own properties"
  ON public.guest_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = guest_requests.property_id
        AND properties.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Hosts can update requests for own properties"
  ON public.guest_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = guest_requests.property_id
        AND properties.owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- notification_attempts
-- Written exclusively by backend services using the service role
-- key (which bypasses RLS). No INSERT/UPDATE policies are needed.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_request_id uuid NOT NULL REFERENCES public.guest_requests(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_device_id uuid REFERENCES public.host_devices(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'push'
    CHECK (channel IN ('push', 'sms', 'whatsapp', 'email')),
  attempt_number integer NOT NULL DEFAULT 1,
  provider_message_id text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'sent', 'failed', 'invalid_token', 'acknowledged', 'cancelled'
    )),
  failure_code text,
  failure_message text,
  sent_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_attempts_request_id
  ON public.notification_attempts(guest_request_id);

CREATE INDEX IF NOT EXISTS idx_notification_attempts_host_id
  ON public.notification_attempts(host_id);

CREATE INDEX IF NOT EXISTS idx_notification_attempts_device_id
  ON public.notification_attempts(host_device_id);

CREATE INDEX IF NOT EXISTS idx_notification_attempts_status
  ON public.notification_attempts(status);

CREATE INDEX IF NOT EXISTS idx_notification_attempts_request_status
  ON public.notification_attempts(guest_request_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_notification_attempts_request_host_attempt
  ON public.notification_attempts(guest_request_id, host_id, attempt_number);

CREATE TRIGGER trg_notification_attempts_updated_at
  BEFORE UPDATE ON public.notification_attempts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: hosts can read their own attempts; writes are service-role only
ALTER TABLE public.notification_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view own notification attempts"
  ON public.notification_attempts FOR SELECT
  USING ((SELECT auth.uid()) = host_id);
