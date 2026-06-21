-- Notification system RPCs
-- Adds two server-side functions:
--   1. create_guest_request_with_jobs  — atomic outbox insert (request + pending jobs)
--   2. claim_pending_notification_jobs — SKIP LOCKED batch claim for workers

-- ============================================================
-- Add 'processing' to the status CHECK on notification_attempts
-- so the claim function can transition rows atomically.
-- ============================================================
ALTER TABLE public.notification_attempts
  DROP CONSTRAINT IF EXISTS notification_attempts_status_check;

ALTER TABLE public.notification_attempts
  ADD CONSTRAINT notification_attempts_status_check
  CHECK (status IN (
    'pending', 'processing', 'sent', 'failed', 'invalid_token', 'acknowledged', 'cancelled'
  ));

-- ============================================================
-- Partial index for the worker's hot path: pending jobs only.
-- Replaces the full-column status index for this query pattern.
-- ============================================================
DROP INDEX IF EXISTS public.idx_notification_attempts_status;

CREATE INDEX IF NOT EXISTS idx_notification_attempts_pending
  ON public.notification_attempts(created_at ASC)
  WHERE status = 'pending';

-- Keep the general status index for analytics / admin queries.
CREATE INDEX IF NOT EXISTS idx_notification_attempts_status
  ON public.notification_attempts(status);

-- ============================================================
-- RPC: create_guest_request_with_jobs
--
-- Wraps the two-step insert (guest_requests + notification_attempts)
-- in a single transaction so the outbox is always consistent.
--
-- Parameters:
--   p_property_id  uuid
--   p_title        text
--   p_category     text  (default 'general')
--   p_priority     text  (default 'normal')
--   p_description  text  (nullable)
--   p_room_id      text  (nullable)
--   p_guest_id     uuid  (nullable)
--   p_host_ids     uuid[]  — recipients determined by the caller
--
-- Returns the new guest_request row as JSON.
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_guest_request_with_jobs(
  p_property_id  uuid,
  p_title        text,
  p_category     text    DEFAULT 'general',
  p_priority     text    DEFAULT 'normal',
  p_description  text    DEFAULT NULL,
  p_room_id      text    DEFAULT NULL,
  p_guest_id     uuid    DEFAULT NULL,
  p_host_ids     uuid[]  DEFAULT '{}'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request   public.guest_requests;
  v_host_id   uuid;
BEGIN
  -- Insert the guest request (status defaults to 'new' via DB trigger/check).
  INSERT INTO public.guest_requests (
    property_id,
    title,
    category,
    priority,
    description,
    room_id,
    guest_id
  ) VALUES (
    p_property_id,
    p_title,
    p_category,
    p_priority,
    p_description,
    p_room_id,
    p_guest_id
  )
  RETURNING * INTO v_request;

  -- Insert one pending outbox job per recipient host.
  IF array_length(p_host_ids, 1) IS NOT NULL THEN
    FOREACH v_host_id IN ARRAY p_host_ids
    LOOP
      INSERT INTO public.notification_attempts (
        guest_request_id,
        host_id,
        status,
        channel,
        attempt_number
      ) VALUES (
        v_request.id,
        v_host_id,
        'pending',
        'push',
        1
      )
      ON CONFLICT (guest_request_id, host_id, attempt_number) DO NOTHING;
    END LOOP;
  END IF;

  RETURN row_to_json(v_request);
END;
$$;

-- ============================================================
-- RPC: claim_pending_notification_jobs
--
-- Atomically claims up to `batch_size` pending jobs by:
--   1. Selecting rows WHERE status = 'pending' FOR UPDATE SKIP LOCKED
--   2. Updating their status to 'processing'
--   3. Returning the claimed rows
--
-- SKIP LOCKED ensures concurrent workers never process the same row.
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_pending_notification_jobs(
  batch_size integer DEFAULT 50
)
RETURNS SETOF public.notification_attempts
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    UPDATE public.notification_attempts
    SET    status     = 'processing',
           updated_at = now()
    WHERE  id IN (
      SELECT id
      FROM   public.notification_attempts
      WHERE  status = 'pending'
      ORDER  BY created_at ASC
      LIMIT  batch_size
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
END;
$$;

-- Grant execute to the service role (used by supabaseServer).
-- Revoke from anon/authenticated so guests cannot invoke these directly.
REVOKE ALL ON FUNCTION public.create_guest_request_with_jobs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_pending_notification_jobs  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_guest_request_with_jobs TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_pending_notification_jobs  TO service_role;
