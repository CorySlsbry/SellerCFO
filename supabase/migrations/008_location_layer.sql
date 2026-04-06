-- ============================================================================
-- Location Layer Migration
-- Adds multi-location support for construction companies with multiple
-- job sites, offices, or regional divisions.
--
-- All columns added to existing tables are NULLABLE — fully backward compatible.
-- ============================================================================

-- ============================================================================
-- TABLE: locations
-- Represents a physical or logical location within an organization.
-- Supports self-referential hierarchy: Company → Region → Job Site
-- ============================================================================
CREATE TABLE IF NOT EXISTS locations (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id        UUID REFERENCES locations(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  address          TEXT,
  city             TEXT,
  state            TEXT,
  zip              TEXT,
  is_default       BOOLEAN NOT NULL DEFAULT false,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_locations_org        ON locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_locations_parent     ON locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_is_active  ON locations(organization_id, is_active);

-- ============================================================================
-- TABLE: location_members
-- Maps profiles (users) to locations with an optional role override.
-- Allows scoping which users see which locations.
-- ============================================================================
CREATE TABLE IF NOT EXISTS location_members (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'viewer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(location_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_location_members_location ON location_members(location_id);
CREATE INDEX IF NOT EXISTS idx_location_members_profile  ON location_members(profile_id);

-- ============================================================================
-- ADD NULLABLE location_id TO EXISTING TABLES
-- All additions are nullable so existing rows and code are unaffected.
-- ============================================================================

ALTER TABLE normalized_projects
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_normalized_projects_location
  ON normalized_projects(location_id);

ALTER TABLE dashboard_snapshots
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_dashboard_snapshots_location
  ON dashboard_snapshots(location_id);

ALTER TABLE normalized_contacts
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_normalized_contacts_location
  ON normalized_contacts(location_id);

ALTER TABLE normalized_deals
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_normalized_deals_location
  ON normalized_deals(location_id);

ALTER TABLE integration_connections
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_integration_connections_location
  ON integration_connections(location_id);

-- ============================================================================
-- TRIGGER: keep updated_at current on locations
-- ============================================================================
CREATE OR REPLACE FUNCTION update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS location_updated_at ON locations;
CREATE TRIGGER location_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE PROCEDURE update_location_timestamp();

-- ============================================================================
-- TRIGGER: enforce only one default location per org
-- When a location is set as default, unset any existing default for that org.
-- ============================================================================
CREATE OR REPLACE FUNCTION enforce_single_default_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE locations
    SET is_default = false
    WHERE organization_id = NEW.organization_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS single_default_location ON locations;
CREATE TRIGGER single_default_location
  BEFORE INSERT OR UPDATE OF is_default ON locations
  FOR EACH ROW EXECUTE PROCEDURE enforce_single_default_location();

-- ============================================================================
-- BACKFILL: create a default "Main Office" location for every existing org
-- so that existing organizations immediately have a location context.
-- Only inserts if the org has no locations yet.
-- ============================================================================
INSERT INTO locations (organization_id, name, is_default, is_active)
SELECT id, 'Main Office', true, true
FROM organizations
WHERE id NOT IN (SELECT DISTINCT organization_id FROM locations);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE locations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_members ENABLE ROW LEVEL SECURITY;

-- locations: any member of the org can read; owners/admins can write
CREATE POLICY "Users can view own org locations" ON locations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can insert locations" ON locations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update locations" ON locations
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners can delete locations" ON locations
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- location_members: members can view; owners/admins can manage
CREATE POLICY "Users can view location members for own org" ON location_members
  FOR SELECT USING (
    location_id IN (
      SELECT id FROM locations WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Owners and admins can manage location members" ON location_members
  FOR ALL USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN profiles p ON p.organization_id = l.organization_id
      WHERE p.id = auth.uid() AND p.role IN ('owner', 'admin')
    )
  );
