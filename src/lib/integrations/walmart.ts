/**
 * Walmart Marketplace Integration Connector
 * Auth: OAuth 2.0 Client Credentials — BYO (per-seller credentials)
 * API: Walmart Marketplace API
 *
 * Credential model:
 *   Walmart Marketplace API does not support a Partner/Solution-Provider
 *   OAuth-redirect flow by default. Each seller generates their own
 *   Client ID + Client Secret in Walmart Seller Center
 *   (Settings → API Key Management → Add Key) and pastes them into the
 *   SellerCFO Integrations page. Those credentials are stored encrypted
 *   per-organization in `integration_connections.config` and used to
 *   mint short-lived access tokens on demand.
 *
 *   → There are NO platform-level WALMART_CLIENT_ID / WALMART_CLIENT_SECRET
 *     env vars. All creds are per-tenant.
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

interface WalmartConfig {
  client_id?: string;
  client_secret?: string;
  seller_id?: string;
}

export class WalmartConnector extends BaseConnector {
  provider: IntegrationProvider = 'walmart';

  constructor() {
    super();
    // Walmart: 20 requests/second
    this.rateLimitConfig = { maxRequests: 20, windowMs: 1000 };
  }

  /**
   * Mint an access token using explicit BYO credentials.
   * Called during setup (before the connection is persisted) and
   * during token refresh (using creds pulled from connection.config).
   */
  async getAccessToken(clientId: string, clientSecret: string): Promise<TokenResult> {
    if (!clientId || !clientSecret) {
      throw new Error('Walmart credentials missing: client_id and client_secret are required.');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

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
   * Ensure the connection has a non-expired access token. If expired or
   * missing, mint a fresh one using the BYO credentials stored in config.
   * Returns the (possibly refreshed) access token string.
   */
  private async ensureFreshToken(connection: IntegrationConnection): Promise<string> {
    const config = (connection.config || {}) as WalmartConfig;
    const { client_id, client_secret } = config;

    if (!client_id || !client_secret) {
      throw new Error('Walmart connection missing BYO credentials in config.');
    }

    const expiresAt = connection.token_expires_at
      ? new Date(connection.token_expires_at).getTime()
      : 0;
    const isExpired = !connection.access_token || Date.now() >= expiresAt - 60_000; // 60s buffer

    if (!isExpired && connection.access_token) {
      return connection.access_token;
    }

    const token = await this.getAccessToken(client_id, client_secret);
    // Caller is responsible for persisting the refreshed token back to DB.
    connection.access_token = token.access_token;
    connection.token_expires_at = new Date(
      Date.now() + (token.expires_in || 900) * 1000
    ).toISOString();
    return token.access_token;
  }

  /**
   * Validate connection
   */
  async validateConnection(connection: IntegrationConnection): Promise<boolean> {
    try {
      const accessToken = await this.ensureFreshToken(connection);
      await this.makeRequest(
        `${WALMART_API_BASE}/items?limit=1`,
        accessToken,
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
    try {
      const accessToken = await this.ensureFreshToken(connection);
      const createdStartDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const response = await this.makeRequest<any>(
        `${WALMART_API_BASE}/orders`,
        accessToken,
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
