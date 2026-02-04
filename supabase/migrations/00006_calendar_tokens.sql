-- Calendar Tokens Table
-- Migration: 00006_calendar_tokens.sql
-- Description: Separate table for OAuth tokens with proper security
--
-- SECURITY NOTE: This migration creates a dedicated table for storing
-- Google Calendar OAuth tokens. In the previous implementation, tokens
-- were stored in users.preferences JSONB field which could potentially
-- be exposed through SELECT queries.
--
-- For maximum security in production, consider:
-- 1. Using Supabase Vault for token encryption
-- 2. Application-level encryption with AES-256-GCM
-- 3. Key management via environment variables
--
-- This migration provides the schema foundation. Encryption can be
-- added as a follow-up enhancement.

-- ============================================
-- CALENDAR TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'google',
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date BIGINT, -- Unix timestamp in milliseconds
  scope TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one token per user per provider
  UNIQUE(user_id, provider)
);

-- Create index for user lookups
CREATE INDEX idx_calendar_tokens_user ON calendar_tokens(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tokens
CREATE POLICY "Users can view own tokens" ON calendar_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tokens" ON calendar_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tokens" ON calendar_tokens
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tokens" ON calendar_tokens
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to upsert calendar tokens
CREATE OR REPLACE FUNCTION upsert_calendar_token(
  p_user_id UUID,
  p_access_token TEXT,
  p_refresh_token TEXT DEFAULT NULL,
  p_expiry_date BIGINT DEFAULT NULL,
  p_scope TEXT DEFAULT NULL,
  p_provider VARCHAR(50) DEFAULT 'google'
)
RETURNS calendar_tokens
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result calendar_tokens;
BEGIN
  -- Verify caller is the user (prevent impersonation)
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot modify tokens for another user';
  END IF;

  INSERT INTO calendar_tokens (
    user_id,
    provider,
    access_token,
    refresh_token,
    expiry_date,
    scope,
    connected_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_provider,
    p_access_token,
    p_refresh_token,
    p_expiry_date,
    p_scope,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, provider)
  DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = COALESCE(EXCLUDED.refresh_token, calendar_tokens.refresh_token),
    expiry_date = EXCLUDED.expiry_date,
    scope = EXCLUDED.scope,
    updated_at = NOW()
  RETURNING * INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_calendar_token TO authenticated;

-- Function to check if user has valid calendar connection
CREATE OR REPLACE FUNCTION has_calendar_connection(
  p_user_id UUID DEFAULT auth.uid(),
  p_provider VARCHAR(50) DEFAULT 'google'
)
RETURNS BOOLEAN
STABLE
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM calendar_tokens
    WHERE user_id = p_user_id
      AND provider = p_provider
      AND refresh_token IS NOT NULL
  );
END;
$$;

GRANT EXECUTE ON FUNCTION has_calendar_connection TO authenticated;

-- Function to revoke calendar connection (delete tokens)
CREATE OR REPLACE FUNCTION revoke_calendar_connection(
  p_provider VARCHAR(50) DEFAULT 'google'
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM calendar_tokens
  WHERE user_id = auth.uid()
    AND provider = p_provider;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION revoke_calendar_connection TO authenticated;

-- ============================================
-- MIGRATION: Move existing tokens (if any)
-- ============================================
-- This safely migrates any existing tokens from users.preferences
-- to the new calendar_tokens table.
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Check if users table has preferences column with google_calendar data
  FOR r IN
    SELECT
      u.id as user_id,
      (u.preferences -> 'google_calendar' ->> 'access_token') as access_token,
      (u.preferences -> 'google_calendar' ->> 'refresh_token') as refresh_token,
      (u.preferences -> 'google_calendar' ->> 'expiry_date')::BIGINT as expiry_date,
      (u.preferences -> 'google_calendar' ->> 'connected_at') as connected_at
    FROM users u
    WHERE u.preferences -> 'google_calendar' ->> 'access_token' IS NOT NULL
  LOOP
    -- Insert into new table (skip if already exists)
    INSERT INTO calendar_tokens (
      user_id,
      provider,
      access_token,
      refresh_token,
      expiry_date,
      connected_at
    )
    VALUES (
      r.user_id,
      'google',
      r.access_token,
      r.refresh_token,
      r.expiry_date,
      COALESCE(r.connected_at::TIMESTAMPTZ, NOW())
    )
    ON CONFLICT (user_id, provider) DO NOTHING;
  END LOOP;

  -- Note: We don't remove the old tokens from preferences yet to allow
  -- for rollback. A follow-up migration can clean up the old data after
  -- confirming the new system works correctly.
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE calendar_tokens IS 'Stores OAuth tokens for calendar integrations. Separated from user preferences for better security isolation.';
COMMENT ON COLUMN calendar_tokens.access_token IS 'OAuth access token. Short-lived, typically 1 hour.';
COMMENT ON COLUMN calendar_tokens.refresh_token IS 'OAuth refresh token. Long-lived, used to get new access tokens.';
COMMENT ON COLUMN calendar_tokens.expiry_date IS 'Unix timestamp (ms) when access_token expires.';
