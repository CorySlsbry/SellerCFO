/**
 * Integration types for the MedicalCFO Dashboard
 * Covers all supported third-party integrations
 */

// ============================================================
// Core Integration Types
// ============================================================

export type IntegrationProvider =
  | 'quickbooks'
  | 'nextgen'
  | 'athenahealth'
  | 'opendental'
  | 'salesforce'
  | 'hubspot'
  | 'kareo';

export type IntegrationCategory = 'accounting' | 'project_management' | 'crm'; // project_management = EHR/PM systems

export type IntegrationAuthType = 'oauth2' | 'api_key' | 'oauth2_client_credentials';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'syncing' | 'pending';

export type SyncStatus = 'idle' | 'syncing' | 'completed' | 'failed';

/**
 * Integration provider metadata — static config for each provider
 */
export interface IntegrationProviderConfig {
  id: IntegrationProvider;
  name: string;
  description: string;
  category: IntegrationCategory;
  authType: IntegrationAuthType;
  icon: string; // Lucide icon name or URL
  color: string; // Brand color
  features: string[];
  docsUrl: string;
  tier: 'essential' | 'pro'; // Which subscription plan includes this
}

/**
 * Integration connection record (stored in DB)
 */
export interface IntegrationConnection {
  id: string;
  organization_id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  api_key: string | null;
  external_account_id: string | null; // e.g., NextGen company ID, SF org ID
  external_account_name: string | null;
  config: Record<string, any>; // Provider-specific config
  last_sync_at: string | null;
  last_sync_status: SyncStatus;
  last_sync_error: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Sync job record (stored in DB)
 */
export interface SyncJob {
  id: string;
  organization_id: string;
  integration_id: string;
  provider: IntegrationProvider;
  status: SyncStatus;
  started_at: string;
  completed_at: string | null;
  records_synced: number;
  error_message: string | null;
  sync_type: 'full' | 'incremental';
  metadata: Record<string, any>;
}

// ============================================================
// Normalized Data Types (provider-agnostic)
// ============================================================

/**
 * Normalized project/job from any field management tool
 */
export interface NormalizedProject {
  id: string;
  source: IntegrationProvider;
  external_id: string;
  name: string;
  customer_name: string;
  address?: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled' | 'bidding';
  project_type?: string;
  start_date?: string;
  estimated_completion?: string;
  actual_completion?: string;
  contract_amount: number;
  estimated_cost: number;
  actual_cost: number;
  percent_complete: number;
  change_orders_amount: number;
  budget_remaining: number;
  profit_margin: number;
  // Claims Pending tracking
  costs_to_date: number;
  billings_to_date: number;
  earned_revenue: number;
  over_under_billing: number;
  // Patient Balance
  retainage_receivable: number;
  retainage_payable: number;
  last_synced: string;
}

/**
 * Normalized budget line item
 */
export interface NormalizedBudgetItem {
  id: string;
  source: IntegrationProvider;
  project_id: string;
  cost_code: string;
  description: string;
  budgeted_amount: number;
  committed_amount: number;
  actual_amount: number;
  variance: number;
  percent_used: number;
}

/**
 * Normalized change order
 */
export interface NormalizedChangeOrder {
  id: string;
  source: IntegrationProvider;
  project_id: string;
  title: string;
  description: string;
  amount: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  created_date: string;
  approved_date?: string;
}

/**
 * Normalized schedule milestone
 */
export interface NormalizedMilestone {
  id: string;
  source: IntegrationProvider;
  project_id: string;
  name: string;
  start_date: string;
  end_date: string;
  percent_complete: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
}

/**
 * Normalized daily log entry
 */
export interface NormalizedDailyLog {
  id: string;
  source: IntegrationProvider;
  project_id: string;
  date: string;
  weather?: string;
  notes?: string;
  hours_worked?: number;
  workers_on_site?: number;
}

// ============================================================
// CRM Normalized Types
// ============================================================

/**
 * Normalized CRM contact
 */
export interface NormalizedContact {
  id: string;
  source: IntegrationProvider;
  external_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  type: 'lead' | 'prospect' | 'customer' | 'partner' | 'other';
  tags: string[];
  last_synced: string;
}

/**
 * Normalized CRM deal/opportunity
 */
export interface NormalizedDeal {
  id: string;
  source: IntegrationProvider;
  external_id: string;
  name: string;
  contact_name: string;
  company_name?: string;
  amount: number;
  stage: string;
  probability: number;
  weighted_amount: number;
  expected_close_date?: string;
  created_date: string;
  last_activity_date?: string;
  deal_type?: string;
  source_campaign?: string;
  notes?: string;
  last_synced: string;
}

/**
 * Normalized CRM activity
 */
export interface NormalizedActivity {
  id: string;
  source: IntegrationProvider;
  external_id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  subject: string;
  description?: string;
  date: string;
  contact_id?: string;
  deal_id?: string;
  completed: boolean;
}

// ============================================================
// Open Dental-specific normalized types
// ============================================================

/**
 * Normalized service job (from Open Dental, Jobber, HousecallPro)
 */
export interface NormalizedServiceJob {
  id: string;
  source: IntegrationProvider;
  external_id: string;
  job_number: string;
  customer_name: string;
  address: string;
  job_type: string; // HVAC, Plumbing, Electrical, etc.
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  completed_date?: string;
  technician?: string;
  total_amount: number;
  cost: number;
  profit: number;
  invoice_status: 'draft' | 'sent' | 'paid' | 'overdue';
  tags: string[];
  last_synced: string;
}

// ============================================================
// Integration Connector Interface
// ============================================================

/**
 * Base interface that all integration connectors must implement
 */
export interface IntegrationConnector {
  provider: IntegrationProvider;

  // Auth
  getAuthUrl?(state: string, orgId: string): string;
  exchangeCode?(code: string, params: Record<string, string>): Promise<TokenResult>;
  refreshAccessToken?(refreshToken: string): Promise<TokenResult>;
  validateConnection?(connection: IntegrationConnection): Promise<boolean>;
  disconnect?(connection: IntegrationConnection): Promise<void>;

  // Data sync
  syncProjects?(connection: IntegrationConnection): Promise<NormalizedProject[]>;
  syncBudgetItems?(connection: IntegrationConnection, projectId: string): Promise<NormalizedBudgetItem[]>;
  syncChangeOrders?(connection: IntegrationConnection, projectId: string): Promise<NormalizedChangeOrder[]>;
  syncMilestones?(connection: IntegrationConnection, projectId: string): Promise<NormalizedMilestone[]>;
  syncDailyLogs?(connection: IntegrationConnection, projectId: string): Promise<NormalizedDailyLog[]>;

  // CRM sync
  syncContacts?(connection: IntegrationConnection): Promise<NormalizedContact[]>;
  syncDeals?(connection: IntegrationConnection): Promise<NormalizedDeal[]>;
  syncActivities?(connection: IntegrationConnection): Promise<NormalizedActivity[]>;

  // Service jobs
  syncServiceJobs?(connection: IntegrationConnection): Promise<NormalizedServiceJob[]>;
}

/**
 * Token result from OAuth exchange or refresh
 */
export interface TokenResult {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  extra?: Record<string, any>;
}

// ============================================================
// Provider Registry
// ============================================================

export const INTEGRATION_PROVIDERS: IntegrationProviderConfig[] = [
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    description: 'Sync financial data, invoices, bills, and accounts from QuickBooks Online',
    category: 'accounting',
    authType: 'oauth2',
    icon: 'BookOpen',
    color: '#2CA01C',
    features: ['P&L Reports', 'Balance Sheet', 'Invoices & Bills', 'Cash Flow', 'Accounts'],
    docsUrl: 'https://developer.intuit.com',
    tier: 'essential',
  },
  {
    id: 'athenahealth',
    name: 'athenahealth',
    description: 'Sync patient records, claims, scheduling, and revenue cycle data from athenahealth',
    category: 'project_management',
    authType: 'oauth2',
    icon: 'Building2',
    color: '#00B4D8',
    features: ['Patient Records', 'Claims', 'Scheduling', 'Revenue Cycle', 'Eligibility Verification'],
    docsUrl: 'https://developer.athenahealth.com',
    tier: 'essential',
  },
  {
    id: 'nextgen',
    name: 'NextGen Healthcare',
    description: 'Pull patient demographics, encounters, claims, and financial data from NextGen EHR/PM',
    category: 'project_management',
    authType: 'api_key',
    icon: 'Stethoscope',
    color: '#F47E20',
    features: ['Patient Demographics', 'Encounters', 'Claims', 'Financial Reports', 'Scheduling'],
    docsUrl: 'https://developer.nextgen.com',
    tier: 'essential',
  },
  {
    id: 'opendental',
    name: 'Open Dental',
    description: 'Import patient records, dental claims, treatment plans, and billing data from Open Dental',
    category: 'project_management',
    authType: 'oauth2_client_credentials',
    icon: 'Wrench',
    color: '#002B5C',
    features: ['Patient Records', 'Dental Claims', 'Treatment Plans', 'Billing', 'Insurance Verification'],
    docsUrl: 'https://opendental.com/site/apikeys.html',
    tier: 'pro',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Sync leads, opportunities, accounts, and pipeline data from Salesforce CRM',
    category: 'crm',
    authType: 'oauth2',
    icon: 'Cloud',
    color: '#00A1E0',
    features: ['Leads & Contacts', 'Opportunities', 'Pipeline', 'Activities', 'Reports'],
    docsUrl: 'https://developer.salesforce.com',
    tier: 'pro',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Import contacts, deals, pipeline stages, and marketing data from HubSpot',
    category: 'crm',
    authType: 'oauth2',
    icon: 'Zap',
    color: '#FF7A59',
    features: ['Contacts', 'Deals', 'Pipeline', 'Activities', 'Email Tracking'],
    docsUrl: 'https://developers.hubspot.com',
    tier: 'essential',
  },
  {
    id: 'kareo',
    name: 'Kareo (Tebra)',
    description: 'Sync patient records, claims, billing, and practice analytics from Kareo/Tebra',
    category: 'crm',
    authType: 'api_key',
    icon: 'ClipboardList',
    color: '#4CAF50',
    features: ['Patient Records', 'Claims', 'Billing', 'Analytics', 'Scheduling'],
    docsUrl: 'https://developer.kareo.com',
    tier: 'essential',
  },
];

/**
 * Get provider config by ID
 */
export function getProviderConfig(provider: IntegrationProvider): IntegrationProviderConfig | undefined {
  return INTEGRATION_PROVIDERS.find(p => p.id === provider);
}

/**
 * Get providers by category
 */
export function getProvidersByCategory(category: IntegrationCategory): IntegrationProviderConfig[] {
  return INTEGRATION_PROVIDERS.filter(p => p.category === category);
}
