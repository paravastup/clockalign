-- Fix Team Invites RLS Policy
-- Migration: 00005_fix_invite_rls.sql
-- Description: Replace overly permissive team_invites SELECT policy with secure alternatives
--
-- SECURITY FIX: The previous policy "Anyone can view invite by code" allowed
-- ANY authenticated user to enumerate ALL pending invites, potentially exposing
-- email addresses and team information. This migration:
-- 1. Removes the overly permissive policy
-- 2. Creates a SECURITY DEFINER function for secure invite lookup by code
-- 3. Adds a policy allowing users to see only invites sent to their email

-- ============================================
-- DROP OVERLY PERMISSIVE POLICY
-- ============================================
DROP POLICY IF EXISTS "Anyone can view invite by code" ON team_invites;

-- ============================================
-- SECURE INVITE LOOKUP FUNCTION
-- ============================================
-- This function allows looking up a specific invite by code without
-- exposing the ability to enumerate all invites.
-- SECURITY DEFINER runs with the function owner's permissions, bypassing RLS.
-- We limit what can be returned and validate the lookup criteria.
CREATE OR REPLACE FUNCTION lookup_invite_by_code(lookup_code TEXT)
RETURNS TABLE (
  id UUID,
  team_id UUID,
  email VARCHAR(255),
  invite_code VARCHAR(20),
  status VARCHAR(20),
  expires_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only return pending, non-expired invites
  RETURN QUERY
  SELECT
    ti.id,
    ti.team_id,
    ti.email,
    ti.invite_code,
    ti.status,
    ti.expires_at
  FROM team_invites ti
  WHERE ti.invite_code = lookup_code
    AND ti.status = 'pending'
    AND ti.expires_at > NOW();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION lookup_invite_by_code(TEXT) TO authenticated;

-- ============================================
-- USER-SPECIFIC INVITE VIEW POLICY
-- ============================================
-- Users can only see invites that were sent to their email address.
-- This allows users to see pending invites they can accept.
CREATE POLICY "Users can view their own invites" ON team_invites
  FOR SELECT USING (
    email = COALESCE(
      (auth.jwt() ->> 'email')::VARCHAR,
      ''
    )
  );

-- ============================================
-- HELPER: Get team name for invite display
-- ============================================
-- Safe function to get team name for an invite the user is accepting
CREATE OR REPLACE FUNCTION get_invite_team_name(invite_code_param TEXT)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  team_name_result TEXT;
BEGIN
  SELECT t.name INTO team_name_result
  FROM team_invites ti
  JOIN teams t ON t.id = ti.team_id
  WHERE ti.invite_code = invite_code_param
    AND ti.status = 'pending'
    AND ti.expires_at > NOW();

  RETURN team_name_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_invite_team_name(TEXT) TO authenticated;

-- ============================================
-- COMMENT ON SECURITY CHANGE
-- ============================================
COMMENT ON FUNCTION lookup_invite_by_code IS 'Securely lookup a team invite by code. Returns only pending, non-expired invites. Used instead of direct table access to prevent invite enumeration.';
COMMENT ON FUNCTION get_invite_team_name IS 'Get the team name for an invite code. Safe to call with any code - returns NULL if invite not found or expired.';
