/**
 * Kareo CRM Integration Connector
 * API Key Authentication (Bearer Token)
 * API: https://app.kareo.com/api1/
 *
 * Popular with roofing, exterior, and storm restoration practices.
 * Syncs: Contacts, Jobs, Estimates, Invoices, Tasks
 */

import { BaseConnector } from './base-connector';
import type {
  IntegrationProvider,
  IntegrationConnection,
  NormalizedContact,
  NormalizedDeal,
  NormalizedProject,
  NormalizedActivity,
} from '@/types/integrations';

const JN_API_BASE = 'https://app.kareo.com/api1';

export class KareoConnector extends BaseConnector {
  provider: IntegrationProvider = 'kareo';

  constructor() {
    super();
    this.rateLimitConfig = { maxRequests: 60, windowMs: 60000 };
  }

  /**
   * Validate API key connection
   */
  async validateConnection(connection: IntegrationConnection): Promise<boolean> {
    if (!connection.api_key) return false;
    try {
      await this.makeApiKeyRequest(
        `${JN_API_BASE}/contacts?limit=1`,
        connection.api_key
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sync contacts from Kareo
   */
  async syncContacts(connection: IntegrationConnection): Promise<NormalizedContact[]> {
    if (!connection.api_key) return [];

    try {
      const response = await this.makeApiKeyRequest<any>(
        `${JN_API_BASE}/contacts`,
        connection.api_key,
        { params: { limit: '500' } }
      );

      const contacts = response.results || response || [];

      return contacts.map((contact: any) => ({
        id: `jn_${contact.jnid}`,
        source: 'kareo' as IntegrationProvider,
        external_id: contact.jnid || contact.id || '',
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.home_phone || contact.mobile_phone || contact.work_phone || '',
        company: contact.company || '',
        title: '',
        type: this.mapContactType(contact.status_name, contact.record_type_name),
        tags: contact.tags || [],
        last_synced: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Kareo contacts sync error:', error);
      return [];
    }
  }

  /**
   * Sync jobs as deals (for the Sales pipeline tab)
   */
  async syncDeals(connection: IntegrationConnection): Promise<NormalizedDeal[]> {
    if (!connection.api_key) return [];

    try {
      const response = await this.makeApiKeyRequest<any>(
        `${JN_API_BASE}/jobs`,
        connection.api_key,
        { params: { limit: '200' } }
      );

      const jobs = response.results || response || [];

      return jobs.map((job: any) => {
        const amount = parseFloat(job.amount || job.total || '0');
        const probability = this.estimateProbability(job.status_name);

        return {
          id: `jn_deal_${job.jnid}`,
          source: 'kareo' as IntegrationProvider,
          external_id: job.jnid || job.id || '',
          name: job.name || job.description || `Job ${job.number || ''}`,
          contact_name: [job.first_name, job.last_name].filter(Boolean).join(' '),
          company_name: job.company || '',
          amount,
          stage: job.status_name || 'Unknown',
          probability,
          weighted_amount: amount * (probability / 100),
          expected_close_date: job.date_end || job.date_estimated_end,
          created_date: job.date_created,
          last_activity_date: job.date_updated,
          deal_type: job.record_type_name || job.type || '',
          source_campaign: job.source_name || job.lead_source || '',
          notes: job.description || job.notes || '',
          last_synced: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('Kareo deals sync error:', error);
      return [];
    }
  }

  /**
   * Sync jobs as projects (for the Claims Pending/project tracking tabs)
   */
  async syncProjects(connection: IntegrationConnection): Promise<NormalizedProject[]> {
    if (!connection.api_key) return [];

    try {
      const response = await this.makeApiKeyRequest<any>(
        `${JN_API_BASE}/jobs`,
        connection.api_key,
        { params: { limit: '200' } }
      );

      const jobs = response.results || response || [];

      return jobs.map((job: any) => {
        const contractAmount = parseFloat(job.amount || job.total || '0');
        const estimatedCost = contractAmount * 0.65; // Default estimate if not provided
        const actualCost = parseFloat(job.actual_cost || '0') || estimatedCost * 0.7;

        return {
          id: `jn_project_${job.jnid}`,
          source: 'kareo' as IntegrationProvider,
          external_id: job.jnid || job.id || '',
          name: job.name || job.description || `Job ${job.number || ''}`,
          customer_name: [job.first_name, job.last_name].filter(Boolean).join(' '),
          address: [job.address_line1, job.city, job.state_text, job.zip].filter(Boolean).join(', '),
          status: this.mapJobStatus(job.status_name),
          project_type: job.record_type_name || 'General',
          start_date: job.date_start,
          estimated_completion: job.date_end || job.date_estimated_end,
          contract_amount: contractAmount,
          estimated_cost: estimatedCost,
          actual_cost: actualCost,
          percent_complete: this.estimatePercentComplete(job.status_name),
          change_orders_amount: 0,
          budget_remaining: estimatedCost - actualCost,
          profit_margin: contractAmount > 0 ? ((contractAmount - actualCost) / contractAmount) * 100 : 0,
          costs_to_date: actualCost,
          billings_to_date: parseFloat(job.amount_invoiced || '0'),
          earned_revenue: contractAmount * (this.estimatePercentComplete(job.status_name) / 100),
          over_under_billing: 0,
          retainage_receivable: 0,
          retainage_payable: 0,
          last_synced: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('Kareo projects sync error:', error);
      return [];
    }
  }

  /**
   * Sync tasks as activities
   */
  async syncActivities(connection: IntegrationConnection): Promise<NormalizedActivity[]> {
    if (!connection.api_key) return [];

    try {
      const response = await this.makeApiKeyRequest<any>(
        `${JN_API_BASE}/tasks`,
        connection.api_key,
        { params: { limit: '100' } }
      );

      const tasks = response.results || response || [];

      return tasks.map((task: any) => ({
        id: `jn_task_${task.jnid}`,
        source: 'kareo' as IntegrationProvider,
        external_id: task.jnid || task.id || '',
        type: this.mapTaskType(task.type || task.record_type_name),
        subject: task.title || task.description || '',
        description: task.note || task.notes || '',
        date: task.date_start || task.date_created || '',
        contact_id: task.related?.[0]?.jnid || '',
        deal_id: task.parent_jnid || '',
        completed: task.is_complete || task.status === 'Completed',
      }));
    } catch (error) {
      console.error('Kareo activities sync error:', error);
      return [];
    }
  }

  private mapContactType(status: string, recordType: string): NormalizedContact['type'] {
    if (!status && !recordType) return 'lead';
    const s = (status || '').toLowerCase();
    const r = (recordType || '').toLowerCase();
    if (s.includes('customer') || s.includes('won') || s.includes('sold')) return 'customer';
    if (s.includes('lead') || r.includes('lead')) return 'lead';
    if (s.includes('prospect') || s.includes('qualified')) return 'prospect';
    return 'lead';
  }

  private mapJobStatus(status: string): NormalizedProject['status'] {
    if (!status) return 'active';
    const s = status.toLowerCase();
    if (s.includes('complete') || s.includes('closed') || s.includes('won') || s.includes('finished')) return 'completed';
    if (s.includes('hold') || s.includes('pause')) return 'on_hold';
    if (s.includes('cancel') || s.includes('lost')) return 'cancelled';
    if (s.includes('estimate') || s.includes('bid') || s.includes('proposal') || s.includes('lead')) return 'bidding';
    return 'active';
  }

  private estimateProbability(status: string): number {
    if (!status) return 50;
    const s = status.toLowerCase();
    if (s.includes('won') || s.includes('closed') || s.includes('complete') || s.includes('sold')) return 100;
    if (s.includes('contract') || s.includes('signed') || s.includes('approved')) return 90;
    if (s.includes('proposal') || s.includes('negotiat')) return 60;
    if (s.includes('qualified') || s.includes('estimate')) return 40;
    if (s.includes('lead') || s.includes('new')) return 20;
    if (s.includes('lost') || s.includes('cancel')) return 0;
    return 50;
  }

  private estimatePercentComplete(status: string): number {
    if (!status) return 0;
    const s = status.toLowerCase();
    if (s.includes('complete') || s.includes('closed') || s.includes('finished')) return 100;
    if (s.includes('progress') || s.includes('active') || s.includes('work')) return 50;
    if (s.includes('scheduled') || s.includes('approved')) return 10;
    return 0;
  }

  private mapTaskType(type: string): NormalizedActivity['type'] {
    if (!type) return 'task';
    const t = type.toLowerCase();
    if (t.includes('call') || t.includes('phone')) return 'call';
    if (t.includes('email')) return 'email';
    if (t.includes('meeting') || t.includes('appointment')) return 'meeting';
    if (t.includes('note')) return 'note';
    return 'task';
  }
}

export const jobNimbusConnector = new KareoConnector();
