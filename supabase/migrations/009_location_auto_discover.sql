-- ============================================================
-- 009: Location Auto-Discovery
-- Adds source tracking columns to locations table so that
-- integrations (QBO Classes/Departments, Procore, Buildertrend,
-- Salesforce, HubSpot) can auto-create and update locations
-- during sync without duplicates.
-- ============================================================

-- Add source tracking columns
ALTER TABLE locations ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Add comment for clarity
COMMENT ON COLUMN locations.source IS 'Integration source: qbo_class, qbo_department, procore, buildertrend, salesforce, hubspot, or NULL for manual';
COMMENT ON COLUMN locations.external_id IS 'ID from the source system (e.g. QBO Class Id, city:state composite key)';

-- Unique constraint for auto-discovered locations (prevents duplicates on re-sync)
-- Only applies when source IS NOT NULL (manual locations are excluded)
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_source_external
  ON locations(organization_id, source, external_id)
  WHERE source IS NOT NULL;
