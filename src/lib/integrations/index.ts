/**
 * Integration Manager
 * Central registry and orchestrator for all integration connectors.
 * Handles connector resolution, sync orchestration, and data aggregation.
 */

import type {
  IntegrationProvider,
  IntegrationConnection,
  NormalizedProject,
  NormalizedContact,
  NormalizedDeal,
  NormalizedActivity,
  NormalizedBudgetItem,
  NormalizedChangeOrder,
  NormalizedServiceJob,
  TokenResult,
  IntegrationConnector,
} from '@/types/integrations';

import { shopifyConnector } from './shopify';
import { amazonConnector } from './amazon';
import { etsyConnector } from './etsy';
import { woocommerceConnector } from './woocommerce';
import { walmartConnector } from './walmart';
import { tiktokShopConnector } from './tiktok-shop';
import { salesforceConnector } from './salesforce';
import { hubspotConnector } from './hubspot';

// ============================================================
// Connector Registry
// ============================================================

const connectors: Record<string, any> = {
  shopify: shopifyConnector,
  amazon: amazonConnector,
  etsy: etsyConnector,
  woocommerce: woocommerceConnector,
  walmart: walmartConnector,
  tiktok_shop: tiktokShopConnector,
  salesforce: salesforceConnector,
  hubspot: hubspotConnector,
};

/**
 * Get the connector instance for a given provider
 */
export function getConnector(provider: IntegrationProvider): any {
  const connector = connectors[provider];
  if (!connector) {
    throw new Error(`No connector registered for provider: ${provider}`);
  }
  return connector;
}

// ============================================================
// Auth Helpers
// ============================================================

/**
 * Generate OAuth URL for a provider
 */
export function getAuthUrl(provider: IntegrationProvider, state: string, orgId?: string): string {
  const connector = getConnector(provider);
  if (!connector.getAuthUrl) {
    throw new Error(`Provider ${provider} does not support OAuth flow`);
  }
  return connector.getAuthUrl(state, orgId);
}

/**
 * Exchange an auth code for tokens
 */
export async function exchangeCode(
  provider: IntegrationProvider,
  code: string,
  params: Record<string, string> = {}
): Promise<TokenResult> {
  const connector = getConnector(provider);
  if (!connector.exchangeCode) {
    throw new Error(`Provider ${provider} does not support code exchange`);
  }
  return connector.exchangeCode(code, params);
}

/**
 * Refresh an access token
 */
export async function refreshToken(
  provider: IntegrationProvider,
  refreshToken: string
): Promise<TokenResult> {
  const connector = getConnector(provider);
  if (!connector.refreshAccessToken) {
    throw new Error(`Provider ${provider} does not support token refresh`);
  }
  return connector.refreshAccessToken(refreshToken);
}

/**
 * Validate a connection is still active
 */
export async function validateConnection(
  provider: IntegrationProvider,
  connection: IntegrationConnection
): Promise<boolean> {
  const connector = getConnector(provider);
  if (!connector.validateConnection) return true;
  return connector.validateConnection(connection);
}

// ============================================================
// Sync Orchestration
// ============================================================

export interface SyncResult {
  provider: IntegrationProvider;
  success: boolean;
  projects: NormalizedProject[];
  contacts: NormalizedContact[];
  deals: NormalizedDeal[];
  activities: NormalizedActivity[];
  budgetItems: NormalizedBudgetItem[];
  changeOrders: NormalizedChangeOrder[];
  serviceJobs: NormalizedServiceJob[];
  recordsTotal: number;
  error?: string;
  duration: number;
}

/**
 * Run a full sync for a single integration
 */
export async function syncIntegration(
  provider: IntegrationProvider,
  connection: IntegrationConnection
): Promise<SyncResult> {
  const startTime = Date.now();
  const connector = getConnector(provider);

  const result: SyncResult = {
    provider,
    success: false,
    projects: [],
    contacts: [],
    deals: [],
    activities: [],
    budgetItems: [],
    changeOrders: [],
    serviceJobs: [],
    recordsTotal: 0,
    duration: 0,
  };

  try {
    // Sync projects (field management tools)
    if (connector.syncProjects) {
      result.projects = await connector.syncProjects(connection);
    }

    // Sync contacts (CRMs & sales channels)
    if (connector.syncContacts) {
      result.contacts = await connector.syncContacts(connection);
    }

    // Sync deals/orders (CRMs & sales channels)
    if (connector.syncDeals) {
      result.deals = await connector.syncDeals(connection);
    }

    // Sync activities (CRMs)
    if (connector.syncActivities) {
      result.activities = await connector.syncActivities(connection);
    }

    // Sync service jobs (if supported)
    if (connector.syncServiceJobs) {
      result.serviceJobs = await connector.syncServiceJobs(connection);
    }

    // Sync budget items for each project (if supported)
    if (connector.syncBudgetItems) {
      for (const project of result.projects) {
        try {
          const items = await connector.syncBudgetItems(connection, project.external_id);
          result.budgetItems.push(...items);
        } catch {
          // Skip individual project budget failures
        }
      }
    }

    // Sync change orders for each project (if supported)
    if (connector.syncChangeOrders) {
      for (const project of result.projects) {
        try {
          const orders = await connector.syncChangeOrders(connection, project.external_id);
          result.changeOrders.push(...orders);
        } catch {
          // Skip individual project CO failures
        }
      }
    }

    result.recordsTotal =
      result.projects.length +
      result.contacts.length +
      result.deals.length +
      result.activities.length +
      result.budgetItems.length +
      result.changeOrders.length +
      result.serviceJobs.length;

    result.success = true;
  } catch (error) {
    result.error = (error as Error).message;
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Run syncs for all connected integrations for an organization
 */
export async function syncAllIntegrations(
  connections: IntegrationConnection[]
): Promise<SyncResult[]> {
  const activeConnections = connections.filter(c => c.status === 'connected');

  const results = await Promise.allSettled(
    activeConnections.map(conn => syncIntegration(conn.provider, conn))
  );

  return results.map((result, idx) => {
    if (result.status === 'fulfilled') return result.value;
    return {
      provider: activeConnections[idx].provider,
      success: false,
      projects: [],
      contacts: [],
      deals: [],
      activities: [],
      budgetItems: [],
      changeOrders: [],
      serviceJobs: [],
      recordsTotal: 0,
      error: result.reason?.message || 'Unknown error',
      duration: 0,
    };
  });
}

// ============================================================
// Data Aggregation
// ============================================================

/**
 * Aggregate all projects from multiple sync results
 */
export function aggregateProjects(results: SyncResult[]): NormalizedProject[] {
  return results.flatMap(r => r.projects);
}

/**
 * Aggregate all contacts from multiple sync results
 */
export function aggregateContacts(results: SyncResult[]): NormalizedContact[] {
  return results.flatMap(r => r.contacts);
}

/**
 * Aggregate all deals from multiple sync results
 */
export function aggregateDeals(results: SyncResult[]): NormalizedDeal[] {
  return results.flatMap(r => r.deals);
}

// Re-export everything
export { shopifyConnector } from './shopify';
export { amazonConnector } from './amazon';
export { etsyConnector } from './etsy';
export { woocommerceConnector } from './woocommerce';
export { walmartConnector } from './walmart';
export { tiktokShopConnector } from './tiktok-shop';
export { salesforceConnector } from './salesforce';
export { hubspotConnector } from './hubspot';
