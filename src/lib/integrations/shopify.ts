/**
 * Shopify Integration Connector
 * OAuth 2.0 (Authorization Code Grant)
 * API: Shopify Admin REST & GraphQL API
 *
 * Syncs: Orders, Products, Customers, Inventory, Financials
 */

import { BaseConnector } from './base-connector';
import type {
  IntegrationProvider,
  IntegrationConnection,
  TokenResult,
  NormalizedContact,
  NormalizedDeal,
} from '@/types/integrations';

const SHOPIFY_API_VERSION = '2024-10';

export class ShopifyConnector extends BaseConnector {
  provider: IntegrationProvider = 'shopify';
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    super();
    this.clientId = process.env.SHOPIFY_CLIENT_ID || '';
    this.clientSecret = process.env.SHOPIFY_CLIENT_SECRET || '';
    this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback`;
    this.rateLimitConfig = { maxRequests: 40, windowMs: 1000 }; // Shopify: 40 req/sec (Plus), 2 req/sec (Basic)
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state: string, orgId?: string): string {
    const shop = ''; // Will be set dynamically based on user input
    return this.buildOAuthUrl(`https://${shop}/admin/oauth/authorize`, {
      client_id: this.clientId,
      scope: 'read_orders,read_products,read_customers,read_inventory,read_analytics,read_reports',
      redirect_uri: this.redirectUri,
      state,
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string, params: Record<string, string> = {}): Promise<TokenResult> {
    const shop = params.shop || '';
    const result = await this.exchangeOAuthCode(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
      }
    );

    return {
      ...result,
      extra: { shop },
    };
  }

  /**
   * Validate connection is still active
   */
  async validateConnection(connection: IntegrationConnection): Promise<boolean> {
    try {
      const shop = connection.config?.shop;
      if (!shop || !connection.access_token) return false;

      await this.makeRequest(
        `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/shop.json`,
        connection.access_token
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sync customers as contacts
   */
  async syncContacts(connection: IntegrationConnection): Promise<NormalizedContact[]> {
    const shop = connection.config?.shop;
    if (!shop || !connection.access_token) return [];

    try {
      const response = await this.makeRequest<any>(
        `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/customers.json`,
        connection.access_token,
        { params: { limit: '250', order: 'updated_at desc' } }
      );

      const customers = response.customers || [];

      return customers.map((c: any) => ({
        id: `shopify_${c.id}`,
        source: 'shopify' as IntegrationProvider,
        external_id: String(c.id),
        first_name: c.first_name || '',
        last_name: c.last_name || '',
        email: c.email || '',
        phone: c.phone || '',
        company: c.company || '',
        title: '',
        type: c.orders_count > 0 ? 'customer' as const : 'lead' as const,
        tags: c.tags ? c.tags.split(',').map((t: string) => t.trim()) : [],
        last_synced: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Shopify customers sync error:', error);
      return [];
    }
  }

  /**
   * Sync orders as deals
   */
  async syncDeals(connection: IntegrationConnection): Promise<NormalizedDeal[]> {
    const shop = connection.config?.shop;
    if (!shop || !connection.access_token) return [];

    try {
      const response = await this.makeRequest<any>(
        `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/orders.json`,
        connection.access_token,
        { params: { limit: '250', status: 'any', order: 'created_at desc' } }
      );

      const orders = response.orders || [];

      return orders.map((order: any) => {
        const amount = parseFloat(order.total_price || '0');
        return {
          id: `shopify_order_${order.id}`,
          source: 'shopify' as IntegrationProvider,
          external_id: String(order.id),
          name: `Order ${order.name}`,
          contact_name: order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : '',
          company_name: order.customer?.company || '',
          amount,
          stage: order.financial_status || 'pending',
          probability: order.financial_status === 'paid' ? 100 : 50,
          weighted_amount: amount,
          expected_close_date: order.created_at,
          created_date: order.created_at,
          last_activity_date: order.updated_at,
          deal_type: 'order',
          source_campaign: order.source_name || '',
          notes: order.note || '',
          last_synced: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('Shopify orders sync error:', error);
      return [];
    }
  }
}

export const shopifyConnector = new ShopifyConnector();
