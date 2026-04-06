/**
 * Open Dental Integration Connector
 * OAuth 2.0 Client Credentials Grant (Machine-to-Machine)
 * API: https://developer.opendental.io
 *
 * Syncs: Jobs, Invoices, Customers, Technician data, Estimates
 * Ideal for: HVAC, Plumbing, Electrical, and other trade practices
 */

import { BaseConnector } from './base-connector';
import type {
  IntegrationProvider,
  IntegrationConnection,
  TokenResult,
  NormalizedProject,
  NormalizedContact,
  NormalizedServiceJob,
} from '@/types/integrations';

const ST_AUTH_URL = 'https://auth.opendental.io/connect/token';
const ST_API_BASE = 'https://api.opendental.io';

export class OpenDentalConnector extends BaseConnector {
  provider: IntegrationProvider = 'opendental';
  private clientId: string;
  private clientSecret: string;

  constructor() {
    super();
    this.clientId = process.env.SERVICETITAN_CLIENT_ID || '';
    this.clientSecret = process.env.SERVICETITAN_CLIENT_SECRET || '';
    this.rateLimitConfig = { maxRequests: 60, windowMs: 1000 }; // 60 req/sec
  }

  /**
   * Open Dental uses Client Credentials flow — no user-facing OAuth redirect
   * The tenant ID (external_account_id) is provided during setup
   */
  async getAccessToken(): Promise<TokenResult> {
    const response = await fetch(ST_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Open Dental auth failed: ${error}`);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      expires_in: data.expires_in || 900, // ST tokens expire in 15 min
      token_type: data.token_type,
    };
  }

  /**
   * Refresh — for ST, we just get a new client credentials token
   */
  async refreshAccessToken(): Promise<TokenResult> {
    return this.getAccessToken();
  }

  /**
   * Validate connection
   */
  async validateConnection(connection: IntegrationConnection): Promise<boolean> {
    try {
      const tenantId = connection.external_account_id;
      if (!tenantId || !connection.access_token) return false;

      await this.makeRequest(
        `${ST_API_BASE}/crm/v2/tenant/${tenantId}/customers?page=1&pageSize=1`,
        connection.access_token
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sync service jobs
   */
  async syncServiceJobs(connection: IntegrationConnection): Promise<NormalizedServiceJob[]> {
    const tenantId = connection.external_account_id;
    if (!tenantId || !connection.access_token) return [];

    try {
      // Get jobs from the last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const response = await this.makeRequest<any>(
        `${ST_API_BASE}/jpm/v2/tenant/${tenantId}/jobs`,
        connection.access_token,
        {
          params: {
            createdOnOrAfter: ninetyDaysAgo.toISOString(),
            pageSize: '200',
            page: '1',
          },
        }
      );

      const jobs = response.data || response || [];

      return jobs.map((job: any) => ({
        id: `st_${job.id}`,
        source: 'opendental' as IntegrationProvider,
        external_id: String(job.id),
        job_number: job.jobNumber || String(job.id),
        customer_name: job.customer?.name || '',
        address: this.formatAddress(job.location),
        job_type: job.type?.name || job.businessUnit?.name || 'Service',
        status: this.mapJobStatus(job.jobStatus),
        scheduled_date: job.scheduledDate || job.createdOn,
        completed_date: job.completedOn,
        technician: job.technician?.name || '',
        total_amount: parseFloat(job.totalAmount || job.invoiceTotal || '0'),
        cost: parseFloat(job.totalCost || '0'),
        profit: parseFloat(job.totalAmount || '0') - parseFloat(job.totalCost || '0'),
        invoice_status: this.mapInvoiceStatus(job.invoiceStatus),
        tags: job.tags?.map((t: any) => t.name || t) || [],
        last_synced: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Open Dental jobs sync error:', error);
      return [];
    }
  }

  /**
   * Sync as normalized projects (for dashboard compatibility)
   */
  async syncProjects(connection: IntegrationConnection): Promise<NormalizedProject[]> {
    const serviceJobs = await this.syncServiceJobs(connection);

    // Group service jobs by customer to create "project" views
    const customerJobs = new Map<string, NormalizedServiceJob[]>();
    serviceJobs.forEach(job => {
      const key = job.customer_name || 'Unknown';
      if (!customerJobs.has(key)) customerJobs.set(key, []);
      customerJobs.get(key)!.push(job);
    });

    const projects: NormalizedProject[] = [];
    let idx = 0;

    customerJobs.forEach((jobs, customerName) => {
      const totalRevenue = jobs.reduce((sum, j) => sum + j.total_amount, 0);
      const totalCost = jobs.reduce((sum, j) => sum + j.cost, 0);
      const completedJobs = jobs.filter(j => j.status === 'completed').length;
      const percentComplete = jobs.length > 0 ? (completedJobs / jobs.length) * 100 : 0;

      projects.push({
        id: `st_project_${idx}`,
        source: 'opendental',
        external_id: `customer_${idx}`,
        name: `${customerName} — ${jobs.length} Jobs`,
        customer_name: customerName,
        address: jobs[0]?.address,
        status: percentComplete >= 100 ? 'completed' : 'active',
        project_type: jobs[0]?.job_type || 'Service',
        start_date: jobs[0]?.scheduled_date,
        contract_amount: totalRevenue,
        estimated_cost: totalCost,
        actual_cost: totalCost,
        percent_complete: Math.round(percentComplete),
        change_orders_amount: 0,
        budget_remaining: totalRevenue - totalCost,
        profit_margin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
        costs_to_date: totalCost,
        billings_to_date: totalRevenue,
        earned_revenue: totalRevenue,
        over_under_billing: 0,
        retainage_receivable: 0,
        retainage_payable: 0,
        last_synced: new Date().toISOString(),
      });
      idx++;
    });

    return projects;
  }

  /**
   * Sync customers as contacts
   */
  async syncContacts(connection: IntegrationConnection): Promise<NormalizedContact[]> {
    const tenantId = connection.external_account_id;
    if (!tenantId || !connection.access_token) return [];

    try {
      const response = await this.makeRequest<any>(
        `${ST_API_BASE}/crm/v2/tenant/${tenantId}/customers`,
        connection.access_token,
        { params: { pageSize: '200', page: '1' } }
      );

      const customers = response.data || response || [];

      return customers.map((customer: any) => ({
        id: `st_contact_${customer.id}`,
        source: 'opendental' as IntegrationProvider,
        external_id: String(customer.id),
        first_name: customer.firstName || customer.name?.split(' ')[0] || '',
        last_name: customer.lastName || customer.name?.split(' ').slice(1).join(' ') || '',
        email: customer.email || '',
        phone: customer.phone || customer.phoneNumber || '',
        company: customer.companyName || '',
        type: customer.type === 'Commercial' ? 'customer' : 'customer',
        tags: customer.tags?.map((t: any) => t.name || t) || [],
        last_synced: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Open Dental contacts sync error:', error);
      return [];
    }
  }

  private formatAddress(location: any): string {
    if (!location) return '';
    return [location.street, location.city, location.state, location.zip]
      .filter(Boolean)
      .join(', ');
  }

  private mapJobStatus(status: string): NormalizedServiceJob['status'] {
    if (!status) return 'scheduled';
    const s = status.toLowerCase();
    if (s.includes('scheduled') || s.includes('pending') || s.includes('dispatched')) return 'scheduled';
    if (s.includes('progress') || s.includes('working') || s.includes('in route')) return 'in_progress';
    if (s.includes('completed') || s.includes('done') || s.includes('finished')) return 'completed';
    if (s.includes('cancel')) return 'cancelled';
    return 'scheduled';
  }

  private mapInvoiceStatus(status: string): NormalizedServiceJob['invoice_status'] {
    if (!status) return 'draft';
    const s = status.toLowerCase();
    if (s.includes('paid')) return 'paid';
    if (s.includes('sent') || s.includes('posted')) return 'sent';
    if (s.includes('overdue') || s.includes('past')) return 'overdue';
    return 'draft';
  }
}

export const serviceTitanConnector = new OpenDentalConnector();
