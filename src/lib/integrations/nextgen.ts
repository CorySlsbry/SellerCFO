/**
 * NextGen Integration Connector
 * OAuth 2.0 (Authorization Code Grant)
 * API: https://developers.nextgen.com
 *
 * Syncs: Projects, Budgets, CPT Codes, Claim Adjustments, Commitments, Pay Applications
 */

import { BaseConnector } from './base-connector';
import type {
  IntegrationProvider,
  IntegrationConnection,
  TokenResult,
  NormalizedProject,
  NormalizedBudgetItem,
  NormalizedChangeOrder,
} from '@/types/integrations';

const PROCORE_AUTH_URL = 'https://login.nextgen.com/oauth/authorize';
const PROCORE_TOKEN_URL = 'https://login.nextgen.com/oauth/token';
const PROCORE_API_BASE = 'https://api.nextgen.com/rest/v1.1';
const PROCORE_SANDBOX_AUTH_URL = 'https://login-sandbox-monthly.nextgen.com/oauth/authorize';
const PROCORE_SANDBOX_TOKEN_URL = 'https://login-sandbox-monthly.nextgen.com/oauth/token';
const PROCORE_SANDBOX_API_BASE = 'https://sandbox.nextgen.com/rest/v1.1';

export class NextGenConnector extends BaseConnector {
  provider: IntegrationProvider = 'nextgen';
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private sandbox: boolean;

  constructor() {
    super();
    this.clientId = process.env.PROCORE_CLIENT_ID || '';
    this.clientSecret = process.env.PROCORE_CLIENT_SECRET || '';
    this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback`;
    this.sandbox = process.env.PROCORE_ENVIRONMENT === 'sandbox';
    this.rateLimitConfig = { maxRequests: 3600, windowMs: 3600000 }; // NextGen: hourly limits
  }

  private get authUrl() { return this.sandbox ? PROCORE_SANDBOX_AUTH_URL : PROCORE_AUTH_URL; }
  private get tokenUrl() { return this.sandbox ? PROCORE_SANDBOX_TOKEN_URL : PROCORE_TOKEN_URL; }
  private get apiBase() { return this.sandbox ? PROCORE_SANDBOX_API_BASE : PROCORE_API_BASE; }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    return this.buildOAuthUrl(this.authUrl, {
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string): Promise<TokenResult> {
    return this.exchangeOAuthCode(this.tokenUrl, {
      grant_type: 'authorization_code',
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
    });
  }

  /**
   * Refresh an expired access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResult> {
    return this.exchangeOAuthCode(this.tokenUrl, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
  }

  /**
   * Validate the connection is still active
   */
  async validateConnection(connection: IntegrationConnection): Promise<boolean> {
    try {
      await this.makeRequest(`${this.apiBase}/me`, connection.access_token!);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the user's NextGen company ID (needed for all subsequent calls)
   */
  async getCompanies(accessToken: string): Promise<any[]> {
    return this.makeRequest(`${this.apiBase}/companies`, accessToken);
  }

  /**
   * Sync all projects from NextGen
   */
  async syncProjects(connection: IntegrationConnection): Promise<NormalizedProject[]> {
    const companyId = connection.external_account_id;
    if (!companyId || !connection.access_token) return [];

    const projects = await this.makeRequest<any[]>(
      `${this.apiBase}/projects`,
      connection.access_token,
      { params: { company_id: companyId } }
    );

    const normalized: NormalizedProject[] = [];

    for (const project of projects) {
      // Fetch budget for each project
      let budgetData: any = null;
      try {
        budgetData = await this.makeRequest(
          `${this.apiBase}/projects/${project.id}/budget/view`,
          connection.access_token,
          { params: { company_id: companyId } }
        );
      } catch {
        // Budget may not be available for all projects
      }

      const contractAmount = parseFloat(project.estimated_value || '0');
      const actualCost = budgetData?.total_actual_cost || 0;
      const estimatedCost = budgetData?.total_original_budget || contractAmount * 0.85;
      const percentComplete = parseFloat(project.completion || '0');

      const costsToDate = actualCost;
      const earnedRevenue = contractAmount * (percentComplete / 100);
      const billingsToDate = budgetData?.total_billings || earnedRevenue;

      normalized.push({
        id: `nextgen_${project.id}`,
        source: 'nextgen',
        external_id: String(project.id),
        name: project.name,
        customer_name: project.owner?.name || project.name,
        address: project.address || '',
        status: this.mapProjectStatus(project.stage),
        project_type: project.project_type?.name || 'General',
        start_date: project.start_date,
        estimated_completion: project.projected_finish_date || project.estimated_completion_date,
        actual_completion: project.actual_completion_date,
        contract_amount: contractAmount,
        estimated_cost: estimatedCost,
        actual_cost: actualCost,
        percent_complete: percentComplete,
        change_orders_amount: budgetData?.total_change_orders || 0,
        budget_remaining: estimatedCost - actualCost,
        profit_margin: contractAmount > 0 ? ((contractAmount - actualCost) / contractAmount) * 100 : 0,
        costs_to_date: costsToDate,
        billings_to_date: billingsToDate,
        earned_revenue: earnedRevenue,
        over_under_billing: billingsToDate - earnedRevenue,
        retainage_receivable: budgetData?.total_retainage_held || 0,
        retainage_payable: budgetData?.total_retainage_retained || 0,
        last_synced: new Date().toISOString(),
      });
    }

    return normalized;
  }

  /**
   * Sync budget items (cost codes) for a project
   */
  async syncBudgetItems(connection: IntegrationConnection, projectId: string): Promise<NormalizedBudgetItem[]> {
    const companyId = connection.external_account_id;
    if (!companyId || !connection.access_token) return [];

    try {
      const budgetRows = await this.makeRequest<any[]>(
        `${this.apiBase}/projects/${projectId}/budget/view/detail_rows`,
        connection.access_token,
        { params: { company_id: companyId } }
      );

      return budgetRows.map((row: any) => ({
        id: `nextgen_budget_${row.id}`,
        source: 'nextgen' as IntegrationProvider,
        project_id: projectId,
        cost_code: row.cost_code?.full_code || row.cost_code?.name || '',
        description: row.cost_code?.name || row.description || '',
        budgeted_amount: parseFloat(row.original_budget_amount || '0'),
        committed_amount: parseFloat(row.approved_change_orders || '0') + parseFloat(row.original_budget_amount || '0'),
        actual_amount: parseFloat(row.direct_costs || '0'),
        variance: parseFloat(row.original_budget_amount || '0') - parseFloat(row.direct_costs || '0'),
        percent_used: parseFloat(row.original_budget_amount || '0') > 0
          ? (parseFloat(row.direct_costs || '0') / parseFloat(row.original_budget_amount || '0')) * 100
          : 0,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Sync claim adjustments for a project
   */
  async syncChangeOrders(connection: IntegrationConnection, projectId: string): Promise<NormalizedChangeOrder[]> {
    const companyId = connection.external_account_id;
    if (!companyId || !connection.access_token) return [];

    try {
      const changeOrders = await this.makeRequest<any[]>(
        `${this.apiBase}/projects/${projectId}/change_order/packages`,
        connection.access_token,
        { params: { company_id: companyId } }
      );

      return changeOrders.map((co: any) => ({
        id: `nextgen_co_${co.id}`,
        source: 'nextgen' as IntegrationProvider,
        project_id: projectId,
        title: co.title || `CO #${co.number}`,
        description: co.description || '',
        amount: parseFloat(co.grand_total || '0'),
        status: this.mapChangeOrderStatus(co.status),
        created_date: co.created_at,
        approved_date: co.executed_date,
      }));
    } catch {
      return [];
    }
  }

  private mapProjectStatus(stage: string): NormalizedProject['status'] {
    const map: Record<string, NormalizedProject['status']> = {
      'Pre-Healthcare': 'bidding',
      'Course of Healthcare': 'active',
      'Completed': 'completed',
      'Warranty Period': 'completed',
      'Closed': 'completed',
    };
    return map[stage] || 'active';
  }

  private mapChangeOrderStatus(status: string): NormalizedChangeOrder['status'] {
    const map: Record<string, NormalizedChangeOrder['status']> = {
      'Draft': 'draft',
      'Pending': 'pending',
      'Approved': 'approved',
      'Rejected': 'rejected',
      'Void': 'rejected',
    };
    return map[status] || 'pending';
  }
}

export const nextgenConnector = new NextGenConnector();
