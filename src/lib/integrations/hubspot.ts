/**
 * HubSpot CRM Integration Connector
 * OAuth 2.0 (Authorization Code Grant) or Private App Token
 * API: https://developers.hubspot.com
 *
 * Syncs: Contacts, Companies, Deals, Activities
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

const HS_AUTH_URL = 'https://app.hubspot.com/oauth/authorize';
const HS_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';
const HS_API_BASE = 'https://api.hubapi.com';

export class HubSpotConnector extends BaseConnector {
  provider: IntegrationProvider = 'hubspot';
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    super();
    this.clientId = process.env.HUBSPOT_CLIENT_ID || '';
    this.clientSecret = process.env.HUBSPOT_CLIENT_SECRET || '';
    this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback`;
    this.rateLimitConfig = { maxRequests: 100, windowMs: 10000 }; // HubSpot: 100/10s
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    return this.buildOAuthUrl(HS_AUTH_URL, {
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'crm.objects.contacts.read crm.objects.deals.read crm.objects.companies.read',
      state,
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string): Promise<TokenResult> {
    return this.exchangeOAuthCode(HS_TOKEN_URL, {
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
    return this.exchangeOAuthCode(HS_TOKEN_URL, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
  }

  /**
   * Validate connection
   */
  async validateConnection(connection: IntegrationConnection): Promise<boolean> {
    try {
      const token = connection.access_token || connection.api_key;
      if (!token) return false;

      await this.makeRequest(
        `${HS_API_BASE}/crm/v3/objects/contacts?limit=1`,
        token
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sync contacts from HubSpot
   */
  async syncContacts(connection: IntegrationConnection): Promise<NormalizedContact[]> {
    const token = connection.access_token || connection.api_key;
    if (!token) return [];

    try {
      const response = await this.makeRequest<any>(
        `${HS_API_BASE}/crm/v3/objects/contacts`,
        token,
        {
          params: {
            limit: '100',
            properties: 'firstname,lastname,email,phone,company,jobtitle,lifecyclestage,hs_lead_status,city,state',
          },
        }
      );

      const contacts = response.results || [];
      const allContacts: NormalizedContact[] = [];

      for (const contact of contacts) {
        const props = contact.properties || {};
        allContacts.push({
          id: `hs_${contact.id}`,
          source: 'hubspot',
          external_id: contact.id,
          first_name: props.firstname || '',
          last_name: props.lastname || '',
          email: props.email || '',
          phone: props.phone || '',
          company: props.company || '',
          title: props.jobtitle || '',
          type: this.mapLifecycleStage(props.lifecyclestage),
          tags: props.hs_lead_status ? [props.hs_lead_status] : [],
          last_synced: new Date().toISOString(),
          // Location data (used by location auto-discovery)
          _city: props.city || '',
          _state: props.state || '',
        });
      }

      // Paginate through all results
      let after = response.paging?.next?.after;
      while (after) {
        const nextPage = await this.makeRequest<any>(
          `${HS_API_BASE}/crm/v3/objects/contacts`,
          token,
          {
            params: {
              limit: '100',
              after,
              properties: 'firstname,lastname,email,phone,company,jobtitle,lifecyclestage,hs_lead_status,city,state',
            },
          }
        );

        for (const contact of (nextPage.results || [])) {
          const props = contact.properties || {};
          allContacts.push({
            id: `hs_${contact.id}`,
            source: 'hubspot',
            external_id: contact.id,
            first_name: props.firstname || '',
            last_name: props.lastname || '',
            email: props.email || '',
            phone: props.phone || '',
            company: props.company || '',
            title: props.jobtitle || '',
            type: this.mapLifecycleStage(props.lifecyclestage),
            tags: props.hs_lead_status ? [props.hs_lead_status] : [],
            last_synced: new Date().toISOString(),
          });
        }

        after = nextPage.paging?.next?.after;
        if (allContacts.length >= 500) break; // Safety limit
      }

      return allContacts;
    } catch (error) {
      console.error('HubSpot contacts sync error:', error);
      return [];
    }
  }

  /**
   * Sync deals from HubSpot
   */
  async syncDeals(connection: IntegrationConnection): Promise<NormalizedDeal[]> {
    const token = connection.access_token || connection.api_key;
    if (!token) return [];

    try {
      const response = await this.makeRequest<any>(
        `${HS_API_BASE}/crm/v3/objects/deals`,
        token,
        {
          params: {
            limit: '100',
            properties: 'dealname,amount,dealstage,pipeline,closedate,createdate,hs_lastmodifieddate,dealtype,hs_deal_stage_probability,description',
            associations: 'contacts,companies',
          },
        }
      );

      const deals = response.results || [];

      // Get pipeline stages for stage name mapping
      let stageMap: Record<string, string> = {};
      try {
        const pipelines = await this.makeRequest<any>(
          `${HS_API_BASE}/crm/v3/pipelines/deals`,
          token
        );
        for (const pipeline of (pipelines.results || [])) {
          for (const stage of (pipeline.stages || [])) {
            stageMap[stage.id] = stage.label;
          }
        }
      } catch {
        // Fall back to stage IDs if we can't get names
      }

      return deals.map((deal: any) => {
        const props = deal.properties || {};
        const amount = parseFloat(props.amount || '0');
        const probability = parseFloat(props.hs_deal_stage_probability || '0');

        // Get associated contact name
        const contactAssoc = deal.associations?.contacts?.results?.[0];
        const companyAssoc = deal.associations?.companies?.results?.[0];

        return {
          id: `hs_deal_${deal.id}`,
          source: 'hubspot' as IntegrationProvider,
          external_id: deal.id,
          name: props.dealname || `Deal ${deal.id}`,
          contact_name: contactAssoc?.id ? `Contact ${contactAssoc.id}` : '',
          company_name: companyAssoc?.id ? `Company ${companyAssoc.id}` : '',
          amount,
          stage: stageMap[props.dealstage] || props.dealstage || 'Unknown',
          probability: probability * 100,
          weighted_amount: amount * probability,
          expected_close_date: props.closedate,
          created_date: props.createdate,
          last_activity_date: props.hs_lastmodifieddate,
          deal_type: props.dealtype || '',
          source_campaign: '',
          notes: props.description || '',
          last_synced: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('HubSpot deals sync error:', error);
      return [];
    }
  }

  /**
   * Sync activities (engagements)
   */
  async syncActivities(connection: IntegrationConnection): Promise<NormalizedActivity[]> {
    const token = connection.access_token || connection.api_key;
    if (!token) return [];

    try {
      // Sync recent calls, emails, meetings
      const activities: NormalizedActivity[] = [];

      const types = ['calls', 'emails', 'meetings'] as const;
      const typeMap: Record<string, NormalizedActivity['type']> = {
        calls: 'call',
        emails: 'email',
        meetings: 'meeting',
      };

      for (const type of types) {
        try {
          const response = await this.makeRequest<any>(
            `${HS_API_BASE}/crm/v3/objects/${type}`,
            token,
            {
              params: {
                limit: '50',
                properties: type === 'calls'
                  ? 'hs_call_title,hs_call_body,hs_timestamp,hs_call_status'
                  : type === 'emails'
                  ? 'hs_email_subject,hs_email_text,hs_timestamp,hs_email_status'
                  : 'hs_meeting_title,hs_meeting_body,hs_timestamp,hs_meeting_outcome',
              },
            }
          );

          for (const item of (response.results || [])) {
            const props = item.properties || {};
            activities.push({
              id: `hs_${type}_${item.id}`,
              source: 'hubspot',
              external_id: item.id,
              type: typeMap[type],
              subject: props.hs_call_title || props.hs_email_subject || props.hs_meeting_title || '',
              description: props.hs_call_body || props.hs_email_text || props.hs_meeting_body || '',
              date: props.hs_timestamp || '',
              completed: true,
            });
          }
        } catch {
          // Skip individual activity types that fail
        }
      }

      return activities;
    } catch (error) {
      console.error('HubSpot activities sync error:', error);
      return [];
    }
  }

  private mapLifecycleStage(stage: string): NormalizedContact['type'] {
    if (!stage) return 'lead';
    const s = stage.toLowerCase();
    if (s === 'customer') return 'customer';
    if (s === 'lead' || s === 'subscriber') return 'lead';
    if (s === 'marketingqualifiedlead' || s === 'salesqualifiedlead' || s === 'opportunity') return 'prospect';
    return 'lead';
  }
}

export const hubspotConnector = new HubSpotConnector();
