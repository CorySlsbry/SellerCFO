/**
 * athenahealth Integration Connector
 * API Key authentication (partner API)
 *
 * athenahealth's API is partner-gated. This connector is built to work
 * once API credentials are obtained through their partner program.
 * In the meantime, it also supports CSV/manual data import as fallback.
 *
 * Syncs: Jobs, Budgets, Claim Adjustments, Schedules, Daily Logs
 */

import { BaseConnector } from './base-connector';
import type {
  IntegrationProvider,
  IntegrationConnection,
  NormalizedProject,
  NormalizedBudgetItem,
  NormalizedChangeOrder,
  NormalizedMilestone,
  NormalizedDailyLog,
} from '@/types/integrations';

const BT_API_BASE = 'https://api.athenahealth.com/v1';

export class AthenahealthConnector extends BaseConnector {
  provider: IntegrationProvider = 'athenahealth';

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
        `${BT_API_BASE}/jobs`,
        connection.api_key,
        { params: { limit: '1' } }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sync all jobs/projects from athenahealth
   */
  async syncProjects(connection: IntegrationConnection): Promise<NormalizedProject[]> {
    if (!connection.api_key) return [];

    try {
      const jobs = await this.makeApiKeyRequest<any[]>(
        `${BT_API_BASE}/jobs`,
        connection.api_key
      );

      const normalized: NormalizedProject[] = [];

      for (const job of jobs) {
        // Fetch budget details per job
        let budgetData: any = null;
        try {
          budgetData = await this.makeApiKeyRequest(
            `${BT_API_BASE}/jobs/${job.id}/budget`,
            connection.api_key
          );
        } catch {
          // Budget may not be available
        }

        const contractAmount = parseFloat(job.contractAmount || job.totalPrice || '0');
        const estimatedCost = budgetData?.totalBudget || contractAmount * 0.8;
        const actualCost = budgetData?.totalActualCost || 0;
        const percentComplete = parseFloat(job.percentComplete || '0');

        const costsToDate = actualCost;
        const earnedRevenue = contractAmount * (percentComplete / 100);
        const billingsToDate = parseFloat(job.totalBilled || '0') || earnedRevenue;

        normalized.push({
          id: `bt_${job.id}`,
          source: 'athenahealth',
          external_id: String(job.id),
          name: job.name || job.jobName || `Job ${job.id}`,
          customer_name: job.customerName || job.customer?.name || '',
          address: [job.address, job.city, job.state, job.zip].filter(Boolean).join(', '),
          status: this.mapJobStatus(job.status || job.jobStatus),
          project_type: job.jobType || 'Residential',
          start_date: job.startDate,
          estimated_completion: job.estimatedCompletionDate || job.endDate,
          actual_completion: job.actualCompletionDate,
          contract_amount: contractAmount,
          estimated_cost: estimatedCost,
          actual_cost: actualCost,
          percent_complete: percentComplete,
          change_orders_amount: budgetData?.totalChangeOrders || 0,
          budget_remaining: estimatedCost - actualCost,
          profit_margin: contractAmount > 0 ? ((contractAmount - actualCost) / contractAmount) * 100 : 0,
          costs_to_date: costsToDate,
          billings_to_date: billingsToDate,
          earned_revenue: earnedRevenue,
          over_under_billing: billingsToDate - earnedRevenue,
          retainage_receivable: parseFloat(job.retainageReceivable || '0'),
          retainage_payable: parseFloat(job.retainagePayable || '0'),
          last_synced: new Date().toISOString(),
        });
      }

      return normalized;
    } catch (error) {
      console.error('athenahealth sync error:', error);
      return [];
    }
  }

  /**
   * Sync budget items for a job
   */
  async syncBudgetItems(connection: IntegrationConnection, projectId: string): Promise<NormalizedBudgetItem[]> {
    if (!connection.api_key) return [];

    try {
      const items = await this.makeApiKeyRequest<any[]>(
        `${BT_API_BASE}/jobs/${projectId}/budget/items`,
        connection.api_key
      );

      return items.map((item: any) => ({
        id: `bt_budget_${item.id}`,
        source: 'athenahealth' as IntegrationProvider,
        project_id: projectId,
        cost_code: item.costCode || item.category || '',
        description: item.description || item.name || '',
        budgeted_amount: parseFloat(item.budgetedAmount || '0'),
        committed_amount: parseFloat(item.committedAmount || '0'),
        actual_amount: parseFloat(item.actualAmount || '0'),
        variance: parseFloat(item.budgetedAmount || '0') - parseFloat(item.actualAmount || '0'),
        percent_used: parseFloat(item.budgetedAmount || '0') > 0
          ? (parseFloat(item.actualAmount || '0') / parseFloat(item.budgetedAmount || '0')) * 100
          : 0,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Sync claim adjustments for a job
   */
  async syncChangeOrders(connection: IntegrationConnection, projectId: string): Promise<NormalizedChangeOrder[]> {
    if (!connection.api_key) return [];

    try {
      const changeOrders = await this.makeApiKeyRequest<any[]>(
        `${BT_API_BASE}/jobs/${projectId}/change-orders`,
        connection.api_key
      );

      return changeOrders.map((co: any) => ({
        id: `bt_co_${co.id}`,
        source: 'athenahealth' as IntegrationProvider,
        project_id: projectId,
        title: co.title || co.name || `CO #${co.number}`,
        description: co.description || '',
        amount: parseFloat(co.amount || co.totalAmount || '0'),
        status: this.mapCOStatus(co.status),
        created_date: co.createdDate || co.dateCreated,
        approved_date: co.approvedDate,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Sync schedule milestones for a job
   */
  async syncMilestones(connection: IntegrationConnection, projectId: string): Promise<NormalizedMilestone[]> {
    if (!connection.api_key) return [];

    try {
      const schedule = await this.makeApiKeyRequest<any[]>(
        `${BT_API_BASE}/jobs/${projectId}/schedule`,
        connection.api_key
      );

      return schedule.map((item: any) => ({
        id: `bt_milestone_${item.id}`,
        source: 'athenahealth' as IntegrationProvider,
        project_id: projectId,
        name: item.name || item.title || '',
        start_date: item.startDate,
        end_date: item.endDate,
        percent_complete: parseFloat(item.percentComplete || '0'),
        status: item.percentComplete >= 100 ? 'completed' :
                item.percentComplete > 0 ? 'in_progress' : 'not_started',
      }));
    } catch {
      return [];
    }
  }

  /**
   * Sync daily logs for a job
   */
  async syncDailyLogs(connection: IntegrationConnection, projectId: string): Promise<NormalizedDailyLog[]> {
    if (!connection.api_key) return [];

    try {
      const logs = await this.makeApiKeyRequest<any[]>(
        `${BT_API_BASE}/jobs/${projectId}/daily-logs`,
        connection.api_key
      );

      return logs.map((log: any) => ({
        id: `bt_log_${log.id}`,
        source: 'athenahealth' as IntegrationProvider,
        project_id: projectId,
        date: log.date || log.logDate,
        weather: log.weather || log.weatherConditions,
        notes: log.notes || log.description,
        hours_worked: parseFloat(log.hoursWorked || '0'),
        workers_on_site: parseInt(log.workersOnSite || log.staffCount || '0', 10),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Import projects from CSV data (fallback for non-API users)
   */
  parseCSVImport(csvData: any[]): NormalizedProject[] {
    return csvData.map((row, idx) => ({
      id: `bt_csv_${idx}`,
      source: 'athenahealth' as IntegrationProvider,
      external_id: String(row.id || row.jobId || idx),
      name: row.name || row.jobName || `Job ${idx + 1}`,
      customer_name: row.customer || row.customerName || '',
      address: row.address || '',
      status: 'active' as const,
      project_type: row.type || 'Residential',
      start_date: row.startDate,
      estimated_completion: row.endDate,
      contract_amount: parseFloat(row.contractAmount || '0'),
      estimated_cost: parseFloat(row.estimatedCost || row.budget || '0'),
      actual_cost: parseFloat(row.actualCost || '0'),
      percent_complete: parseFloat(row.percentComplete || '0'),
      change_orders_amount: parseFloat(row.changeOrders || '0'),
      budget_remaining: parseFloat(row.budgetRemaining || '0'),
      profit_margin: 0,
      costs_to_date: parseFloat(row.costsToDate || row.actualCost || '0'),
      billings_to_date: parseFloat(row.billingsToDate || '0'),
      earned_revenue: 0,
      over_under_billing: 0,
      retainage_receivable: parseFloat(row.retainageReceivable || '0'),
      retainage_payable: parseFloat(row.retainagePayable || '0'),
      last_synced: new Date().toISOString(),
    }));
  }

  private mapJobStatus(status: string): NormalizedProject['status'] {
    if (!status) return 'active';
    const s = status.toLowerCase();
    if (s.includes('active') || s.includes('progress') || s.includes('healthcare')) return 'active';
    if (s.includes('complete') || s.includes('closed') || s.includes('finished')) return 'completed';
    if (s.includes('hold') || s.includes('pause')) return 'on_hold';
    if (s.includes('cancel')) return 'cancelled';
    if (s.includes('bid') || s.includes('estimate') || s.includes('proposal')) return 'bidding';
    return 'active';
  }

  private mapCOStatus(status: string): NormalizedChangeOrder['status'] {
    if (!status) return 'pending';
    const s = status.toLowerCase();
    if (s.includes('draft')) return 'draft';
    if (s.includes('approv') || s.includes('accept')) return 'approved';
    if (s.includes('reject') || s.includes('denied') || s.includes('void')) return 'rejected';
    return 'pending';
  }
}

export const athenahealthConnector = new AthenahealthConnector();
