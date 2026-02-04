-- Migration: 00007_cleanup_calendar_preferences.sql
-- Description: Remove google_calendar tokens from users.preferences
--
-- IMPORTANT: Run this AFTER verifying that all calendar routes are using
-- the new calendar_tokens table (see 00006_calendar_tokens.sql).
--
-- This migration removes the google_calendar key from the preferences JSONB
-- column since tokens are now stored in the dedicated calendar_tokens table.
-- The 00006 migration already copied existing tokens to the new table.

-- ============================================
-- REMOVE TOKENS FROM PREFERENCES
-- ============================================

-- Remove the google_calendar key from preferences JSON
-- This cleans up the old token storage location
UPDATE users
SET preferences = preferences - 'google_calendar',
    updated_at = NOW()
WHERE preferences ? 'google_calendar';

-- Log how many users were affected (visible in migration output)
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Cleaned up google_calendar from % user preference records', affected_count;
END;
$$;

-- ============================================
-- VERIFICATION QUERY (run manually to verify)
-- ============================================
-- After running this migration, you can verify cleanup with:
--
-- SELECT COUNT(*)
-- FROM users
-- WHERE preferences ? 'google_calendar';
--
-- This should return 0.

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- This migration is NOT easily reversible since we're deleting data.
-- However, the data has already been copied to calendar_tokens table
-- in migration 00006, so no data is lost.
--
-- If you need to rollback to the old system:
-- 1. Revert code changes to use preferences storage
-- 2. Run this to restore tokens from calendar_tokens:
--
-- UPDATE users u
-- SET preferences = jsonb_set(
--   COALESCE(u.preferences, '{}'::jsonb),
--   '{google_calendar}',
--   jsonb_build_object(
--     'connected', true,
--     'access_token', ct.access_token,
--     'refresh_token', ct.refresh_token,
--     'expiry_date', ct.expiry_date,
--     'connected_at', ct.connected_at
--   )
-- )
-- FROM calendar_tokens ct
-- WHERE ct.user_id = u.id
--   AND ct.provider = 'google';
