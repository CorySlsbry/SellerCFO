/**
 * Error Logger — writes to `error_logs` table in Supabase
 * Used across integrations, billing, sync, and auth flows
 * so admins can see all failures (and successes) in /admin/errors
 */

import { createAdminClient } from '@/lib/supabase/admin';

type Severity = 'info' | 'warning' | 'error' | 'critical';

interface LogErrorParams {
  organizationId?: string;
  errorType: string;        // e.g. 'integration_sync', 'oauth_callback', 'stripe_webhook', 'billing_portal'
  severity: Severity;
  title: string;
  message?: string;
  provider?: string;        // e.g. 'quickbooks', 'nextgen', 'stripe'
  metadata?: Record<string, any>;
}

/**
 * Log an error (or info/success event) to the error_logs table.
 * Non-throwing — swallows its own failures to avoid masking the original error.
 */
export async function logError(params: LogErrorParams): Promise<void> {
  try {
    const admin = createAdminClient();
    await (admin as any)
      .from('error_logs')
      .insert({
        organization_id: params.organizationId || null,
        error_type: params.errorType,
        severity: params.severity,
        title: params.title,
        message: params.message || null,
        provider: params.provider || null,
        metadata: params.metadata || {},
        resolved: false,
        created_at: new Date().toISOString(),
      });
  } catch (err) {
    // Never throw from the logger — just warn
    console.error('[error-logger] Failed to write to error_logs:', err);
  }
}

/**
 * Convenience: log a successful integration event (severity: info)
 */
export async function logSuccess(params: Omit<LogErrorParams, 'severity'>): Promise<void> {
  return logError({ ...params, severity: 'info' });
}
