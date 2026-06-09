-- Add owner_id to properties for multi-tenant support
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

-- Index for fast owner-scoped queries
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);

-- RLS: hosts can only see their own properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view own properties"
  ON properties FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Hosts can insert own properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Hosts can update own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Hosts can delete own properties"
  ON properties FOR DELETE
  USING (auth.uid() = owner_id);

-- Guest access: anyone can read properties by slug (for guest welcome page)
CREATE POLICY "Public can read properties by slug"
  ON properties FOR SELECT
  USING (true);
