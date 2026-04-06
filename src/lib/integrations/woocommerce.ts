/**
 * WooCommerce Integration Connector
 * REST API with API Key/Secret authentication
 * API: WooCommerce REST API v3
 *
 * Syncs: Orders, Products, Customers, Coupons
 */

import { BaseConnector } from './base-connector';
import type {
  IntegrationProvider,
  IntegrationConnection,
  TokenResult,
  NormalizedContact,
  NormalizedDeal,
} from '@/types/integrations';

export class WooCommerceConnector extends BaseConnector {
  provider: IntegrationProvider = 'woocommerce';

  constructor() {
    super();
    // WooCommerce rate limits depend on hosting; conservative default
    this.rateLimitConfig = { maxRequests: 25, windowMs: 1000 };
  }

  /**
   * WooCommerce uses API key auth, not OAuth.
   * The store URL + consumer key + consumer secret are stored in connection.config
   */

  /**
   * Validate connection
   */
  async validateConnection(connection: IntegrationConnection): Promise<boolean> {
    try {
      const storeUrl = connection.config?.store_url;
      const consumerKey = connection.config?.consumer_key;
      const consumerSecret = connection.config?.consumer_secret;
      if (!storeUrl || !consumerKey || !consumerSecret) return false;

      const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
      await this.makeRequest(
        `${storeUrl}/wp-json/wc/v3/system_status`,
        auth,
        { headers: { 'Authorization': `Basic ${auth}` } }
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
    const { store_url, consumer_key, consumer_secret } = connection.config || {};
    if (!store_url || !consumer_key || !consumer_secret) return [];

    try {
      const auth = Buffer.from(`${consumer_key}:${consumer_secret}`).toString('base64');

      const response = await this.makeRequest<any[]>(
        `${store_url}/wp-json/wc/v3/customers`,
        auth,
        {
          headers: { 'Authorization': `Basic ${auth}` },
          params: { per_page: '100', orderby: 'registered_date', order: 'desc' },
        }
      );

      const customers = response || [];

      return customers.map((c: any) => ({
        id: `woo_${c.id}`,
        source: 'woocommerce' as IntegrationProvider,
        external_id: String(c.id),
        first_name: c.first_name || '',
        last_name: c.last_name || '',
        email: c.email || '',
        phone: c.billing?.phone || '',
        company: c.billing?.company || '',
        title: '',
        type: 'customer' as const,
        tags: [],
        last_synced: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('WooCommerce customers sync error:', error);
      return [];
    }
  }

  /**
   * Sync orders as deals
   */
  async syncDeals(connection: IntegrationConnection): Promise<NormalizedDeal[]> {
    const { store_url, consumer_key, consumer_secret } = connection.config || {};
    if (!store_url || !consumer_key || !consumer_secret) return [];

    try {
      const auth = Buffer.from(`${consumer_key}:${consumer_secret}`).toString('base64');

      const response = await this.makeRequest<any[]>(
        `${store_url}/wp-json/wc/v3/orders`,
        auth,
        {
          headers: { 'Authorization': `Basic ${auth}` },
          params: { per_page: '100', order: 'desc', orderby: 'date' },
        }
      );

      const orders = response || [];

      return orders.map((order: any) => {
        const amount = parseFloat(order.total || '0');
        return {
          id: `woo_order_${order.id}`,
          source: 'woocommerce' as IntegrationProvider,
          external_id: String(order.id),
          name: `WooCommerce Order #${order.number}`,
          contact_name: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
          company_name: order.billing?.company || '',
          amount,
          stage: order.status || 'pending',
          probability: order.status === 'completed' ? 100 : 75,
          weighted_amount: amount,
          expected_close_date: order.date_created,
          created_date: order.date_created,
          last_activity_date: order.date_modified,
          deal_type: 'woo_order',
          source_campaign: '',
          notes: order.customer_note || '',
          last_synced: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('WooCommerce orders sync error:', error);
      return [];
    }
  }
}

export const woocommerceConnector = new WooCommerceConnector();
