-- ============================================================
-- Locations table for multi-location support
-- Contractor CFO Dashboard — Migration 008
-- ============================================================
-- Backward compatible: all FKs referencing this table should
-- be nullable so existing rows are unaffected.
-- ============================================================

CREATE TABLE IF NOT EXISTS locations (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  address     TEXT,
  city        TEXT,
  state       TEXT,
  zip         TEXT,
  phone       TEXT,
  notes       TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS locations_organization_id_idx ON locations(organization_id);
CREATE INDEX IF NOT EXISTS locations_is_active_idx       ON locations(organization_id, is_active);

-- ── Auto-update updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_locations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS locations_updated_at ON locations;
CREATE TRIGGER locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE PROCEDURE public.update_locations_timestamp();

-- ── Row-Level Security ───────────────────────────────────────
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Users can view locations that belong to their organization
CREATE POLICY "Users can view own org locations" ON locations
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can create locations for their organization
CREATE POLICY "Users can insert own org locations" ON locations
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can update locations in their organization
CREATE POLICY "Users can update own org locations" ON locations
  FOR UPDATE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Only owners/admins can delete locations
CREATE POLICY "Owners and admins can delete org locations" ON locations
  FOR DELETE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) IN ('owner', 'admin')
  );

COMMENT ON TABLE locations IS 'Physical locations/offices for contractor organizations. FK references from other tables should be nullable for backward compatibility.';
