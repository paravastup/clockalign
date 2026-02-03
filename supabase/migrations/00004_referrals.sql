-- Add referral system to ClockAlign
-- Migration: 00004_referrals.sql

-- Add referral fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Create referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_promo_code_id VARCHAR(255),  -- Stripe promo code used
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ,  -- When referred user subscribed

  -- Ensure a user can only be referred once
  CONSTRAINT unique_referred_user UNIQUE (referred_id)
);

-- Create indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code: REF_ + 8 random alphanumeric characters
    new_code := 'REF_' || substr(md5(random()::text), 1, 8);

    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = new_code) INTO code_exists;

    -- Exit loop if unique
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to increment referral count (called from webhook)
CREATE OR REPLACE FUNCTION increment_referral_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET referral_count = referral_count + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on referrals table
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see referrals they made
CREATE POLICY "Users can view their own referrals"
  ON referrals FOR SELECT
  USING (referrer_id = auth.uid());

-- Policy: Users can see if they were referred
CREATE POLICY "Users can view if they were referred"
  ON referrals FOR SELECT
  USING (referred_id = auth.uid());

-- Comments for documentation
COMMENT ON COLUMN users.referral_code IS 'Unique referral code (e.g., REF_abc12345)';
COMMENT ON COLUMN users.referred_by IS 'User ID who referred this user';
COMMENT ON COLUMN users.referral_count IS 'Number of successful referrals made by this user';
COMMENT ON TABLE referrals IS 'Tracks referral relationships and conversions';
