/**
 * Amazon Seller Central Integration Connector
 * OAuth 2.0 (Login with Amazon / SP-API)
 * API: Amazon Selling Partner API (SP-API)
 *
 * Syncs: Orders, Inventory, Financials, FBA Fees, Advertising
 */

import { BaseConnector } from './base-connector';
import type {
  IntegrationProvider,
  IntegrationConnection,
  TokenResult,
  NormalizedContact,
  NormalizedDeal,
} from '@/types/integrations';

const AMAZON_AUTH_URL = 'https://sellercentral.amazon.com/apps/authorize/consent';
const AMAZON_TOKEN_URL = 'https://api.amazon.com/auth/o2/token';
const SP_API_BASE = 'https://sellingpartnerapi-na.amazon.com';

export class AmazonConnector extends BaseConnector {
  provider: IntegrationProvider = 'amazon';
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    super();
    this.clientId = process.env.AMAZON_SP_CLIENT_ID || '';
    this.clientSecret = process.env.AMAZON_SP_CLIENT_SECRET || '';
    this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback`;
    // SP-API rate limits vary by endpoint; conservative default
    this.rateLimitConfig = { maxRequests: 30, windowMs: 1000 };
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    return this.buildOAuthUrl(AMAZON_AUTH_URL, {
      application_id: this.clientId,
      state,
      redirect_uri: this.redirectUri,
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string): Promise<TokenResult> {
    return this.exchangeOAuthCode(AMAZON_TOKEN_URL, {
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
    return this.exchangeOAuthCode(AMAZON_TOKEN_URL, {
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
      if (!connection.access_token) return false;
      // Test with a lightweight API call
      await this.makeRequest(
        `${SP_API_BASE}/sellers/v1/marketplaceParticipations`,
        connection.access_token
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sync orders as deals
   */
  async syncDeals(connection: IntegrationConnection): Promise<NormalizedDeal[]> {
    if (!connection.access_token) return [];

    try {
      const createdAfter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const response = await this.makeRequest<any>(
        `${SP_API_BASE}/orders/v0/orders`,
        connection.access_token,
        {
          params: {
            MarketplaceIds: 'ATVPDKIKX0DER', // US marketplace
            CreatedAfter: createdAfter,
            MaxResultsPerPage: '100',
          },
        }
      );

      const orders = response.payload?.Orders || [];

      return orders.map((order: any) => {
        const amount = parseFloat(order.OrderTotal?.Amount || '0');
        return {
          id: `amazon_order_${order.AmazonOrderId}`,
          source: 'amazon' as IntegrationProvider,
          external_id: order.AmazonOrderId,
          name: `Amazon Order ${order.AmazonOrderId}`,
          contact_name: order.BuyerInfo?.BuyerName || '',
          company_name: '',
          amount,
          stage: order.OrderStatus || 'Pending',
          probability: order.OrderStatus === 'Shipped' ? 100 : 75,
          weighted_amount: amount,
          expected_close_date: order.PurchaseDate,
          created_date: order.PurchaseDate,
          last_activity_date: order.LastUpdateDate,
          deal_type: order.FulfillmentChannel === 'AFN' ? 'FBA' : 'FBM',
          source_campaign: '',
          notes: '',
          last_synced: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('Amazon orders sync error:', error);
      return [];
    }
  }

  /**
   * Sync buyer contacts
   */
  async syncContacts(connection: IntegrationConnection): Promise<NormalizedContact[]> {
    // Amazon SP-API has limited buyer PII access; return empty by default
    return [];
  }
}

export const amazonConnector = new AmazonConnector();
