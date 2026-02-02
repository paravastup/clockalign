-- Add subscription fields to users table for Stripe integration
-- Migration: 00003_subscriptions.sql

-- Add subscription-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Create indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Add check constraints for valid status values
-- subscription_status: 'free' (no subscription), 'trialing', 'active', 'past_due', 'canceled', 'incomplete'
-- subscription_tier: 'free' or 'pro'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_subscription_status'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT check_subscription_status
            CHECK (subscription_status IN ('free', 'active', 'past_due', 'canceled', 'trialing', 'incomplete'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_subscription_tier'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT check_subscription_tier
            CHECK (subscription_tier IN ('free', 'pro'));
    END IF;
END $$;

-- Comment for documentation
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe Customer ID (cus_xxx)';
COMMENT ON COLUMN users.subscription_status IS 'Current subscription status: free, trialing, active, past_due, canceled, incomplete';
COMMENT ON COLUMN users.subscription_tier IS 'Subscription tier: free or pro';
COMMENT ON COLUMN users.subscription_id IS 'Stripe Subscription ID (sub_xxx)';
COMMENT ON COLUMN users.current_period_end IS 'End of current billing period';
COMMENT ON COLUMN users.trial_ends_at IS 'When the trial period ends (if trialing)';
