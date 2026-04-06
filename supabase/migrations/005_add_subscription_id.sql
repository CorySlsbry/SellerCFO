-- ============================================================================
-- Migration: Add stripe_subscription_id to organizations
-- Purpose: Store the Stripe subscription ID for scoping billing portal sessions
-- ============================================================================

-- Add stripe_subscription_id column to organizations table
ALTER TABLE organizations
ADD COLUMN stripe_subscription_id text;

-- Create index on stripe_subscription_id for fast lookups
CREATE INDEX organizations_stripe_subscription_id_idx ON organizations(stripe_subscription_id);

-- Add comment for documentation
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'Stripe subscription ID for the CFO Dashboard subscription. Used to scope billing portal sessions.';
