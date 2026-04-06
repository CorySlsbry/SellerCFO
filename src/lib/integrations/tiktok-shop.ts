/**
 * TikTok Shop Integration Connector
 * OAuth 2.0 (Authorization Code Grant)
 * API: TikTok Shop Open Platform API
 *
 * Syncs: Orders, Products, Shop Performance, Financials
 */

import { BaseConnector } from './base-connector';
import type {
  IntegrationProvider,
  IntegrationConnection,
  TokenResult,
  NormalizedDeal,
} from '@/types/integrations';

const TIKTOK_AUTH_URL = 'https://services.tiktokshop.com/open/authorize';
const TIKTOK_TOKEN_URL = 'https://auth.tiktok-shops.com/api/v2/token/get';
const TIKTOK_API_BASE = 'https://open-api.tiktokglobalshop.com';

export class TikTokShopConnector extends BaseConnector {
  provider: IntegrationProvider = 'tiktok_shop';
  private appKey: string;
  private appSecret: string;
  private redirectUri: string;

  constructor() {
    super();
    this.appKey = process.env.TIKTOK_SHOP_APP_KEY || '';
    this.appSecret = process.env.TIKTOK_SHOP_APP_SECRET || '';
    this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback`;
    // TikTok Shop: conservative rate limit
    this.rateLimitConfig = { maxRequests: 30, windowMs: 1000 };
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    return this.buildOAuthUrl(TIKTOK_AUTH_URL, {
      app_key: this.appKey,
      state,
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string): Promise<TokenResult> {
    const response = await fetch(`${TIKTOK_TOKEN_URL}?app_key=${this.appKey}&app_secret=${this.appSecret}&auth_code=${code}&grant_type=authorized_code`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TikTok Shop token exchange failed: ${error}`);
    }

    const data = await response.json();
    const tokenData = data.data || {};

    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.access_token_expire_in,
      extra: {
        open_id: tokenData.open_id,
        seller_name: tokenData.seller_name,
      },
    };
  }

  /**
   * Refresh an expired access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResult> {
    const response = await fetch(`${TIKTOK_TOKEN_URL}?app_key=${this.appKey}&app_secret=${this.appSecret}&refresh_token=${refreshToken}&grant_type=refresh_token`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TikTok Shop token refresh failed: ${error}`);
    }

    const data = await response.json();
    const tokenData = data.data || {};

    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.access_token_expire_in,
    };
  }

  /**
   * Validate connection
   */
  async validateConnection(connection: IntegrationConnection): Promise<boolean> {
    try {
      if (!connection.access_token) return false;
      await this.makeRequest(
        `${TIKTOK_API_BASE}/product/202309/products/search`,
        connection.access_token,
        {
          method: 'POST',
          headers: { 'x-tts-access-token': connection.access_token },
          body: { page_size: 1 },
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
      const response = await this.makeRequest<any>(
        `${TIKTOK_API_BASE}/order/202309/orders/search`,
        connection.access_token,
        {
          method: 'POST',
          headers: { 'x-tts-access-token': connection.access_token },
          body: {
            page_size: 100,
            sort_by: 'CREATE_TIME',
            sort_type: 2, // DESC
          },
        }
      );

      const orders = response.data?.orders || [];

      return orders.map((order: any) => {
        const amount = parseFloat(order.payment?.total_amount || '0');
        return {
          id: `tiktok_order_${order.id}`,
          source: 'tiktok_shop' as IntegrationProvider,
          external_id: order.id,
          name: `TikTok Order ${order.id}`,
          contact_name: order.recipient_address?.name || '',
          company_name: '',
          amount,
          stage: order.status || 'UNPAID',
          probability: order.status === 'COMPLETED' ? 100 : 75,
          weighted_amount: amount,
          expected_close_date: new Date(order.create_time * 1000).toISOString(),
          created_date: new Date(order.create_time * 1000).toISOString(),
          last_activity_date: new Date(order.update_time * 1000).toISOString(),
          deal_type: 'tiktok_order',
          source_campaign: '',
          notes: '',
          last_synced: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('TikTok Shop orders sync error:', error);
      return [];
    }
  }
}

export const tiktokShopConnector = new TikTokShopConnector();
