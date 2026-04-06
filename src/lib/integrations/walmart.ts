/**
 * Walmart Marketplace Integration Connector
 * OAuth 2.0 (Client Credentials)
 * API: Walmart Marketplace API
 *
 * Syncs: Orders, Items, Inventory, Returns
 */

import { BaseConnector } from './base-connector';
import type {
  IntegrationProvider,
  IntegrationConnection,
  TokenResult,
  NormalizedDeal,
} from '@/types/integrations';

const WALMART_TOKEN_URL = 'https://marketplace.walmartapis.com/v3/token';
const WALMART_API_BASE = 'https://marketplace.walmartapis.com/v3';

export class WalmartConnector extends BaseConnector {
  provider: IntegrationProvider = 'walmart';
  private clientId: string;
  private clientSecret: string;

  constructor() {
    super();
    this.clientId = process.env.WALMART_CLIENT_ID || '';
    this.clientSecret = process.env.WALMART_CLIENT_SECRET || '';
    // Walmart: 20 requests/second
    this.rateLimitConfig = { maxRequests: 20, windowMs: 1000 };
  }

  /**
   * Exchange credentials for access token (client credentials flow)
   */
  async exchangeCode(): Promise<TokenResult> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(WALMART_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'WM_SVC.NAME': 'SellerCFO',
        'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Walmart token exchange failed: ${error}`);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    };
  }

  /**
   * Validate connection
   */
  async validateConnection(connection: IntegrationConnection): Promise<boolean> {
    try {
      if (!connection.access_token) return false;
      await this.makeRequest(
        `${WALMART_API_BASE}/items?limit=1`,
        connection.access_token,
        {
          headers: {
            'WM_SVC.NAME': 'SellerCFO',
            'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
          },
        }
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
      const createdStartDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const response = await this.makeRequest<any>(
        `${WALMART_API_BASE}/orders`,
        connection.access_token,
        {
          headers: {
            'WM_SVC.NAME': 'SellerCFO',
            'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
          },
          params: {
            createdStartDate,
            limit: '200',
          },
        }
      );

      const orders = response.list?.elements?.order || [];

      return orders.map((order: any) => {
        const amount = parseFloat(order.orderLines?.orderLine?.[0]?.charges?.charge?.[0]?.chargeAmount?.amount || '0');
        return {
          id: `walmart_order_${order.purchaseOrderId}`,
          source: 'walmart' as IntegrationProvider,
          external_id: order.purchaseOrderId,
          name: `Walmart Order ${order.purchaseOrderId}`,
          contact_name: order.shippingInfo?.postalAddress?.name || '',
          company_name: '',
          amount,
          stage: order.orderLines?.orderLine?.[0]?.orderLineStatuses?.orderLineStatus?.[0]?.status || 'Created',
          probability: 90,
          weighted_amount: amount,
          expected_close_date: order.orderDate,
          created_date: order.orderDate,
          last_activity_date: order.orderDate,
          deal_type: 'walmart_order',
          source_campaign: '',
          notes: '',
          last_synced: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('Walmart orders sync error:', error);
      return [];
    }
  }
}

export const walmartConnector = new WalmartConnector();
