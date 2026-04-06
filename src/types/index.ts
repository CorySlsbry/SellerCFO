/**
 * Core TypeScript types for the SellerCFO Dashboard
 */

/**
 * Organization (tenant) type
 * Represents a company using the platform
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  qbo_realm_id: string | null;
  qbo_access_token: string | null;
  qbo_refresh_token: string | null;
  qbo_token_expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: "trialing" | "active" | "past_due" | "canceled";
  plan: "basic" | "pro" | "enterprise";
  created_at: string;
  updated_at: string;
}

/**
 * User profile type
 * Extends Supabase auth.users with additional profile information
 */
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  organization_id: string | null;
  role: "owner" | "admin" | "viewer";
  avatar_url: string | null;
  created_at: string;
}

/**
 * Job/Project data
 * Represents a specific job or project
 */
export interface JobData {
  id: string;
  name: string;
  customer: string;
  estimated_cost: number;
  actual_cost: number;
  revenue: number;
  profit_margin: number;
  status: "not_started" | "in_progress" | "completed" | "on_hold";
  percent_complete: number;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

/**
 * Monthly cash flow data
 */
export interface CashFlowData {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
}

/**
 * Invoice data
 */
export interface Invoice {
  id: string;
  customer_name: string;
  amount: number;
  balance: number;
  due_date: string;
  status: "draft" | "sent" | "viewed" | "paid" | "overdue";
  days_overdue: number;
  invoice_number?: string;
}

/**
 * Bill data (accounts payable)
 */
export interface Bill {
  id: string;
  vendor_name: string;
  amount: number;
  balance: number;
  due_date: string;
  txn_date: string;
  status: "unpaid" | "paid" | "overdue";
  days_overdue: number;
  doc_number?: string;
}

/**
 * Financial metric for dashboard display
 */
export interface FinancialMetric {
  label: string;
  value: number;
  change: number;
  changeType: "positive" | "negative" | "neutral";
  icon?: React.ComponentType<{ className?: string }>;
  format?: "currency" | "percent" | "number";
}

/**
 * Complete dashboard data snapshot
 */
export interface DashboardData {
  revenue: number;
  expenses: number;
  profit: number;
  cash_balance: number;
  accounts_receivable: number;
  accounts_payable: number;
  jobs: JobData[];
  invoices: Invoice[];
  bills: Bill[];
  cash_flow: CashFlowData[];
  metrics: FinancialMetric[];
  last_updated: string;
}

/**
 * QBO API error response
 */
export interface QBOError {
  error: string;
  error_description: string;
  error_uri?: string;
}

/**
 * QBO token response
 */
export interface QBOTokenResponse {
  access_token: string;
  refresh_token: string;
  x_refresh_token_expires_in: number;
  token_type: string;
  expires_in: number;
  realm_id: string;
}

/**
 * Stripe webhook event
 */
export interface StripeWebhookEvent {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: {
    object: Record<string, any>;
    previous_attributes?: Record<string, any>;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
  type: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

/**
 * Dashboard cache snapshot
 */
export interface DashboardSnapshot {
  id: string;
  organization_id: string;
  data: DashboardData;
  pulled_at: string;
}

/**
 * Location — a physical or logical location within an organization.
 * Supports self-referential hierarchy: Company → Region → Job Site.
 */
export interface Location {
  id: string;
  organization_id: string;
  parent_id: string | null;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Location member — links a user profile to a location with a role.
 */
export interface LocationMember {
  id: string;
  location_id: string;
  profile_id: string;
  role: 'owner' | 'admin' | 'viewer';
  created_at: string;
}
