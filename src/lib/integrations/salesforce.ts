/**
 * Salesforce CRM Integration Connector
 * OAuth 2.0 (Web Server / Authorization Code Grant)
 * API: https://developer.salesforce.com
 *
 * Syncs: Accounts, Contacts, Opportunities, Activities
 */

import { BaseConnector } from './base-connector';
import type {
  IntegrationProvider,
  IntegrationConnection,
  TokenResult,
  NormalizedContact,
  NormalizedDeal,
  NormalizedActivity,
} from '@/types/integrations';

const SF_AUTH_URL = 'https://login.salesforce.com/services/oauth2/authorize';
const SF_TOKEN_URL = 'https://login.salesforce.com/services/oauth2/token';
const SF_SANDBOX_AUTH_URL = 'https://test.salesforce.com/services/oauth2/authorize';
const SF_SANDBOX_TOKEN_URL = 'https://test.salesforce.com/services/oauth2/token';
const SF_API_VERSION = 'v59.0';

export class SalesforceConnector extends BaseConnector {
  provider: IntegrationProvider = 'salesforce';
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private sandbox: boolean;

  constructor() {
    super();
    this.clientId = process.env.SALESFORCE_CLIENT_ID || '';
    this.clientSecret = process.env.SALESFORCE_CLIENT_SECRET || '';
    this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback`;
    this.sandbox = process.env.SALESFORCE_ENVIRONMENT === 'sandbox';
    // SF rate limits: 100,000/day for Enterprise, we'll keep conservative
    this.rateLimitConfig = { maxRequests: 100, windowMs: 60000 };
  }

  private get authUrl() { return this.sandbox ? SF_SANDBOX_AUTH_URL : SF_AUTH_URL; }
  private get tokenUrl() { return this.sandbox ? SF_SANDBOX_TOKEN_URL : SF_TOKEN_URL; }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    return this.buildOAuthUrl(this.authUrl, {
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
      scope: 'api refresh_token',
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string): Promise<TokenResult> {
    const result = await this.exchangeOAuthCode(this.tokenUrl, {
      grant_type: 'authorization_code',
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
    });

    // Salesforce returns instance_url which we need for API calls
    return {
      ...result,
      extra: {
        ...result.extra,
        instance_url: result.extra?.instance_url,
      },
    };
  }

  /**
   * Refresh an expired access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResult> {
    const result = await this.exchangeOAuthCode(this.tokenUrl, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    return {
      ...result,
      refresh_token: refreshToken, // SF doesn't return new refresh token
      extra: { ...result.extra, instance_url: result.extra?.instance_url },
    };
  }

  /**
   * Validate connection
   */
  async validateConnection(connection: IntegrationConnection): Promise<boolean> {
    try {
      const instanceUrl = connection.config?.instance_url;
      if (!instanceUrl || !connection.access_token) return false;

      await this.makeRequest(
        `${instanceUrl}/services/data/${SF_API_VERSION}/sobjects/`,
        connection.access_token
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sync contacts from Salesforce
   */
  async syncContacts(connection: IntegrationConnection): Promise<NormalizedContact[]> {
    const instanceUrl = connection.config?.instance_url;
    if (!instanceUrl || !connection.access_token) return [];

    try {
      const query = encodeURIComponent(
        `SELECT Id, FirstName, LastName, Email, Phone, Account.Name, Title,
         Account.BillingCity, Account.BillingState, Account.BillingStreet,
         LeadSource, Description
         FROM Contact
         WHERE CreatedDate = LAST_N_DAYS:365
         ORDER BY LastModifiedDate DESC
         LIMIT 500`
      );

      const response = await this.makeRequest<any>(
        `${instanceUrl}/services/data/${SF_API_VERSION}/query?q=${query}`,
        connection.access_token
      );

      const contacts = response.records || [];

      return contacts.map((contact: any) => ({
        id: `sf_${contact.Id}`,
        source: 'salesforce' as IntegrationProvider,
        external_id: contact.Id,
        first_name: contact.FirstName || '',
        last_name: contact.LastName || '',
        email: contact.Email || '',
        phone: contact.Phone || '',
        company: contact.Account?.Name || '',
        title: contact.Title || '',
        type: 'customer' as const,
        tags: contact.LeadSource ? [contact.LeadSource] : [],
        last_synced: new Date().toISOString(),
        // Location data from Account (used by location auto-discovery)
        _billingCity: contact.Account?.BillingCity || '',
        _billingState: contact.Account?.BillingState || '',
        _billingStreet: contact.Account?.BillingStreet || '',
      }));
    } catch (error) {
      console.error('Salesforce contacts sync error:', error);
      return [];
    }
  }

  /**
   * Sync opportunities as deals
   */
  async syncDeals(connection: IntegrationConnection): Promise<NormalizedDeal[]> {
    const instanceUrl = connection.config?.instance_url;
    if (!instanceUrl || !connection.access_token) return [];

    try {
      const query = encodeURIComponent(
        `SELECT Id, Name, Amount, StageName, Probability, CloseDate,
         CreatedDate, LastActivityDate, Type, LeadSource, Description,
         Account.Name,
         (SELECT Contact.Name FROM OpportunityContactRoles WHERE IsPrimary = true LIMIT 1)
         FROM Opportunity
         WHERE IsClosed = false OR CloseDate >= LAST_N_DAYS:180
         ORDER BY CloseDate ASC
         LIMIT 500`
      );

      const response = await this.makeRequest<any>(
        `${instanceUrl}/services/data/${SF_API_VERSION}/query?q=${query}`,
        connection.access_token
      );

      const opportunities = response.records || [];

      return opportunities.map((opp: any) => {
        const amount = parseFloat(opp.Amount || '0');
        const probability = parseFloat(opp.Probability || '0');
        const primaryContact = opp.OpportunityContactRoles?.records?.[0]?.Contact?.Name || '';

        return {
          id: `sf_deal_${opp.Id}`,
          source: 'salesforce' as IntegrationProvider,
          external_id: opp.Id,
          name: opp.Name,
          contact_name: primaryContact,
          company_name: opp.Account?.Name || '',
          amount,
          stage: opp.StageName,
          probability,
          weighted_amount: amount * (probability / 100),
          expected_close_date: opp.CloseDate,
          created_date: opp.CreatedDate,
          last_activity_date: opp.LastActivityDate,
          deal_type: opp.Type || '',
          source_campaign: opp.LeadSource || '',
          notes: opp.Description || '',
          last_synced: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('Salesforce deals sync error:', error);
      return [];
    }
  }

  /**
   * Sync recent activities
   */
  async syncActivities(connection: IntegrationConnection): Promise<NormalizedActivity[]> {
    const instanceUrl = connection.config?.instance_url;
    if (!instanceUrl || !connection.access_token) return [];

    try {
      const query = encodeURIComponent(
        `SELECT Id, Subject, Description, ActivityDate, Status, Type,
         Who.Name, What.Name
         FROM Task
         WHERE CreatedDate >= LAST_N_DAYS:90
         ORDER BY ActivityDate DESC
         LIMIT 200`
      );

      const response = await this.makeRequest<any>(
        `${instanceUrl}/services/data/${SF_API_VERSION}/query?q=${query}`,
        connection.access_token
      );

      const tasks = response.records || [];

      return tasks.map((task: any) => ({
        id: `sf_activity_${task.Id}`,
        source: 'salesforce' as IntegrationProvider,
        external_id: task.Id,
        type: this.mapActivityType(task.Type),
        subject: task.Subject || '',
        description: task.Description || '',
        date: task.ActivityDate || '',
        contact_id: task.Who?.Name || '',
        deal_id: task.What?.Name || '',
        completed: task.Status === 'Completed',
      }));
    } catch (error) {
      console.error('Salesforce activities sync error:', error);
      return [];
    }
  }

  private mapActivityType(type: string): NormalizedActivity['type'] {
    if (!type) return 'task';
    const t = type.toLowerCase();
    if (t.includes('call')) return 'call';
    if (t.includes('email')) return 'email';
    if (t.includes('meeting')) return 'meeting';
    return 'task';
  }
}

export const salesforceConnector = new SalesforceConnector();
