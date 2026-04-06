-- Migration: Add admin/owner platform management system
-- Description: Adds platform-level role management, error logging, metrics tracking, and admin audit trail

-- 1. Add platform_role column to profiles table
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS platform_role TEXT DEFAULT 'user' CHECK (platform_role IN ('user', 'admin', 'superadmin'));

-- 2. Create error_logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL CHECK (error_type IN ('integration_sync', 'billing', 'auth', 'data_quality', 'system')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  provider TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes on error_logs
CREATE INDEX IF NOT EXISTS idx_error_logs_organization_id ON public.error_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_composite ON public.error_logs(organization_id, error_type, resolved, created_at);

-- Enable RLS on error_logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy: Admins can SELECT all error logs
CREATE POLICY IF NOT EXISTS error_logs_admin_select ON public.error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role IN ('admin', 'superadmin')
    )
  );

-- RLS policy: Admins can INSERT error logs
CREATE POLICY IF NOT EXISTS error_logs_admin_insert ON public.error_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role IN ('admin', 'superadmin')
    )
  );

-- RLS policy: Users can SELECT error logs for their organization
CREATE POLICY IF NOT EXISTS error_logs_user_select ON public.error_logs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- 3. Create platform_metrics table
CREATE TABLE IF NOT EXISTS public.platform_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_organizations INT DEFAULT 0,
  active_subscriptions INT DEFAULT 0,
  mrr_cents INT DEFAULT 0,
  total_syncs INT DEFAULT 0,
  failed_syncs INT DEFAULT 0,
  new_signups INT DEFAULT 0,
  churned INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on date for platform_metrics
CREATE INDEX IF NOT EXISTS idx_platform_metrics_date ON public.platform_metrics(date);

-- Enable RLS on platform_metrics
ALTER TABLE public.platform_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policy: Only admins can SELECT platform metrics
CREATE POLICY IF NOT EXISTS platform_metrics_admin_select ON public.platform_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role IN ('admin', 'superadmin')
    )
  );

-- RLS policy: Only admins can INSERT platform metrics
CREATE POLICY IF NOT EXISTS platform_metrics_admin_insert ON public.platform_metrics
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role IN ('admin', 'superadmin')
    )
  );

-- RLS policy: Only admins can UPDATE platform metrics
CREATE POLICY IF NOT EXISTS platform_metrics_admin_update ON public.platform_metrics
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role IN ('admin', 'superadmin')
    )
  );

-- 4. Create admin_audit_log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes on admin_audit_log
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_organization_id ON public.admin_audit_log(target_organization_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);

-- Enable RLS on admin_audit_log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policy: Only admins can SELECT admin audit logs
CREATE POLICY IF NOT EXISTS admin_audit_log_admin_select ON public.admin_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role IN ('admin', 'superadmin')
    )
  );

-- RLS policy: Only admins can INSERT admin audit logs
CREATE POLICY IF NOT EXISTS admin_audit_log_admin_insert ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role IN ('admin', 'superadmin')
    )
  );

-- 5. Create helper function is_platform_admin()
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.platform_role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
