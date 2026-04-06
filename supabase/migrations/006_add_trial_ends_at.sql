-- Add trial_ends_at column to organizations table
-- Tracks when the 14-day free trial ends for each subscription
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN organizations.trial_ends_at IS 'Timestamp when the free trial period ends, set by Stripe webhook on checkout.session.completed';
