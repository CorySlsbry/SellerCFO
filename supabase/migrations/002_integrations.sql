-- ============================================================
-- Integration tables for multi-source data
-- Contractor CFO Dashboard
-- ============================================================

-- Integration connections table
-- Stores OAuth tokens and API keys for each provider per organization
CREATE TABLE IF NOT EXISTS integration_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN (
    'quickbooks', 'procore', 'buildertrend', 'servicetitan',
    'salesforce', 'hubspot', 'jobnimbus'
  )),
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN (
    'connected', 'disconnected', 'error', 'syncing', 'pending'
  )),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  api_key TEXT,
  external_account_id TEXT,
  external_account_name TEXT,
  config JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT DEFAULT 'idle' CHECK (last_sync_status IN (
    'idle', 'syncing', 'completed', 'failed'
  )),
  last_sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, provider)
);

-- Sync jobs log table
-- Tracks every sync operation for debugging and auditing
CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'syncing' CHECK (status IN (
    'idle', 'syncing', 'completed', 'failed'
  )),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  sync_type TEXT DEFAULT 'full' CHECK (sync_type IN ('full', 'incremental')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Normalized projects table
-- Stores project/job data from any field management tool
CREATE TABLE IF NOT EXISTS normalized_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  customer_name TEXT,
  address TEXT,
  status TEXT DEFAULT 'active',
  project_type TEXT,
  start_date DATE,
  estimated_completion DATE,
  actual_completion DATE,
  contract_amount NUMERIC(14,2) DEFAULT 0,
  estimated_cost NUMERIC(14,2) DEFAULT 0,
  actual_cost NUMERIC(14,2) DEFAULT 0,
  percent_complete NUMERIC(5,2) DEFAULT 0,
  change_orders_amount NUMERIC(14,2) DEFAULT 0,
  budget_remaining NUMERIC(14,2) DEFAULT 0,
  profit_margin NUMERIC(5,2) DEFAULT 0,
  costs_to_date NUMERIC(14,2) DEFAULT 0,
  billings_to_date NUMERIC(14,2) DEFAULT 0,
  earned_revenue NUMERIC(14,2) DEFAULT 0,
  over_under_billing NUMERIC(14,2) DEFAULT 0,
  retainage_receivable NUMERIC(14,2) DEFAULT 0,
  retainage_payable NUMERIC(14,2) DEFAULT 0,
  raw_data JSONB DEFAULT '{}',
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, source, external_id)
);

-- Normalized budget items
CREATE TABLE IF NOT EXISTS normalized_budget_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES normalized_projects(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  external_id TEXT,
  cost_code TEXT,
  description TEXT,
  budgeted_amount NUMERIC(14,2) DEFAULT 0,
  committed_amount NUMERIC(14,2) DEFAULT 0,
  actual_amount NUMERIC(14,2) DEFAULT 0,
  variance NUMERIC(14,2) DEFAULT 0,
  percent_used NUMERIC(5,2) DEFAULT 0,
  raw_data JSONB DEFAULT '{}',
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, source, external_id)
);

-- Normalized CRM contacts
CREATE TABLE IF NOT EXISTS normalized_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  contact_type TEXT DEFAULT 'lead',
  tags TEXT[] DEFAULT '{}',
  raw_data JSONB DEFAULT '{}',
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, source, external_id)
);

-- Normalized CRM deals/opportunities
CREATE TABLE IF NOT EXISTS normalized_deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_name TEXT,
  company_name TEXT,
  amount NUMERIC(14,2) DEFAULT 0,
  stage TEXT,
  probability NUMERIC(5,2) DEFAULT 0,
  weighted_amount NUMERIC(14,2) DEFAULT 0,
  expected_close_date DATE,
  created_date DATE,
  last_activity_date DATE,
  deal_type TEXT,
  source_campaign TEXT,
  notes TEXT,
  raw_data JSONB DEFAULT '{}',
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, source, external_id)
);

-- Normalized change orders
CREATE TABLE IF NOT EXISTS normalized_change_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES normalized_projects(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  external_id TEXT,
  title TEXT,
  description TEXT,
  amount NUMERIC(14,2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_date DATE,
  approved_date DATE,
  raw_data JSONB DEFAULT '{}',
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, source, external_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_integration_connections_org ON integration_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_integration_connections_provider ON integration_connections(provider);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_integration ON sync_jobs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_org ON sync_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_normalized_projects_org ON normalized_projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_normalized_projects_source ON normalized_projects(source);
CREATE INDEX IF NOT EXISTS idx_normalized_contacts_org ON normalized_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_normalized_deals_org ON normalized_deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_normalized_budget_items_project ON normalized_budget_items(project_id);

-- Row Level Security
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE normalized_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE normalized_budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE normalized_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE normalized_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE normalized_change_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their organization's data
CREATE POLICY "Users can view own org integrations" ON integration_connections
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view own org sync jobs" ON sync_jobs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view own org projects" ON normalized_projects
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view own org budget items" ON normalized_budget_items
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view own org contacts" ON normalized_contacts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view own org deals" ON normalized_deals
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view own org change orders" ON normalized_change_orders
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );
