/**
 * Integration types for the SellerCFO Dashboard
 * Covers all supported third-party integrations
 */

// ============================================================
// Core Integration Types
// ============================================================

export type IntegrationProvider =
  | 'quickbooks'
  | 'xero'
  | 'shopify'
  | 'amazon'
  | 'etsy'
  | 'woocommerce'
  | 'walmart'
  | 'tiktok_shop';

export type IntegrationCategory = 'accounting' | 'sales_channel';

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
  external_account_id: string | null;
  external_account_name: string | null;
  config: Record<string, any>; // Provider-specific config (e.g., shop domain, store URL)
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
 * Normalized product/SKU from any sales channel
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
  costs_to_date: number;
  billings_to_date: number;
  earned_revenue: number;
  over_under_billing: number;
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
// E-commerce Normalized Types
// ============================================================

/**
 * Normalized order from any sales channel
 */
export interface NormalizedServiceJob {
  id: string;
  source: IntegrationProvider;
  external_id: string;
  job_number: string;
  customer_name: string;
  address: string;
  job_type: string;
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
    features: ['P&L Reports', 'Balance Sheet', 'Invoices & Bills', 'Cash Flow', 'Chart of Accounts'],
    docsUrl: 'https://developer.intuit.com',
    tier: 'essential',
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Sync financial data, invoices, bills, and bank transactions from Xero',
    category: 'accounting',
    authType: 'oauth2',
    icon: 'BookOpen',
    color: '#13B5EA',
    features: ['P&L Reports', 'Balance Sheet', 'Invoices & Bills', 'Bank Reconciliation', 'Chart of Accounts'],
    docsUrl: 'https://developer.xero.com',
    tier: 'essential',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Sync orders, products, customers, and inventory from your Shopify store',
    category: 'sales_channel',
    authType: 'oauth2',
    icon: 'ShoppingBag',
    color: '#96BF48',
    features: ['Orders & Revenue', 'Product Analytics', 'Customer Data', 'Inventory Levels', 'Discount Tracking'],
    docsUrl: 'https://shopify.dev',
    tier: 'essential',
  },
  {
    id: 'amazon',
    name: 'Amazon Seller Central',
    description: 'Pull orders, FBA fees, inventory, and advertising data from Amazon SP-API',
    category: 'sales_channel',
    authType: 'oauth2',
    icon: 'Package',
    color: '#FF9900',
    features: ['Order History', 'FBA Fees & Settlement', 'Inventory & Restock', 'Advertising Metrics', 'Buy Box Tracking'],
    docsUrl: 'https://developer-docs.amazon.com/sp-api',
    tier: 'essential',
  },
  {
    id: 'etsy',
    name: 'Etsy',
    description: 'Import orders, listings, shop stats, and reviews from your Etsy shop',
    category: 'sales_channel',
    authType: 'oauth2',
    icon: 'Palette',
    color: '#F1641E',
    features: ['Receipts & Orders', 'Listing Performance', 'Shop Revenue', 'Review Analytics', 'Fee Tracking'],
    docsUrl: 'https://developers.etsy.com',
    tier: 'essential',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Connect your WordPress/WooCommerce store for order and customer data',
    category: 'sales_channel',
    authType: 'api_key',
    icon: 'Globe',
    color: '#96588A',
    features: ['Orders & Revenue', 'Customer Data', 'Product Analytics', 'Coupon Tracking', 'Tax Reports'],
    docsUrl: 'https://woocommerce.github.io/woocommerce-rest-api-docs',
    tier: 'pro',
  },
  {
    id: 'walmart',
    name: 'Walmart Marketplace',
    description: 'Sync orders, items, and returns from your Walmart Marketplace seller account',
    category: 'sales_channel',
    authType: 'oauth2_client_credentials',
    icon: 'Store',
    color: '#0071CE',
    features: ['Orders & Revenue', 'Item Performance', 'Returns & Refunds', 'Inventory Sync', 'Commission Tracking'],
    docsUrl: 'https://developer.walmart.com',
    tier: 'pro',
  },
  {
    id: 'tiktok_shop',
    name: 'TikTok Shop',
    description: 'Import orders, product data, and shop performance from TikTok Shop',
    category: 'sales_channel',
    authType: 'oauth2',
    icon: 'Video',
    color: '#000000',
    features: ['Orders & Revenue', 'Product Performance', 'Shop Analytics', 'Fulfillment Data', 'Commission Tracking'],
    docsUrl: 'https://partner.tiktokshop.com',
    tier: 'pro',
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
