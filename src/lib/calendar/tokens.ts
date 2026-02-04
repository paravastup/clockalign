/**
 * Calendar Token Management
 *
 * Centralized token operations using the calendar_tokens table.
 * This module provides secure access to OAuth tokens without exposing
 * them through user preferences or SELECT * queries.
 *
 * Security benefits:
 * - Tokens stored in dedicated table with stricter RLS
 * - Not included in user profile queries
 * - Refresh operations update only token table
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { GoogleTokens, refreshAccessToken } from '@/lib/google/calendar';

/**
 * Token data as stored in calendar_tokens table
 */
export interface CalendarTokenRow {
  id: string;
  user_id: string;
  provider: string;
  access_token: string;
  refresh_token: string | null;
  expiry_date: number | null; // Unix timestamp in milliseconds
  scope: string | null;
  connected_at: string;
  updated_at: string;
}

/**
 * Retrieve calendar tokens for a user, auto-refreshing if expired.
 *
 * @param supabase - Supabase client (server or authenticated client)
 * @param userId - User ID to fetch tokens for
 * @param provider - Calendar provider (default: 'google')
 * @returns GoogleTokens if connected and valid, null otherwise
 */
export async function getCalendarTokens(
  supabase: SupabaseClient,
  userId: string,
  provider: string = 'google'
): Promise<GoogleTokens | null> {
  // Fetch tokens from dedicated table
  const { data, error } = await supabase
    .from('calendar_tokens')
    .select('access_token, refresh_token, expiry_date, scope')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  if (error || !data) {
    // No tokens found - user hasn't connected calendar
    return null;
  }

  const tokenData = data as {
    access_token: string;
    refresh_token: string | null;
    expiry_date: number | null;
    scope: string | null;
  };

  // Check if token is expired (with 5 min buffer for safety)
  const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes
  const isExpired =
    tokenData.expiry_date && tokenData.expiry_date < Date.now() + EXPIRY_BUFFER_MS;

  if (isExpired && tokenData.refresh_token) {
    try {
      // Refresh the access token
      const newTokens = await refreshAccessToken(tokenData.refresh_token);

      // Update tokens in the database via RPC
      await supabase.rpc('upsert_calendar_token', {
        p_user_id: userId,
        p_access_token: newTokens.access_token,
        p_refresh_token: tokenData.refresh_token, // Keep existing refresh token
        p_expiry_date: newTokens.expiry_date ?? null,
        p_scope: tokenData.scope,
        p_provider: provider,
      });

      return {
        access_token: newTokens.access_token,
        refresh_token: tokenData.refresh_token,
        expiry_date: newTokens.expiry_date,
      };
    } catch (error) {
      console.error('Failed to refresh calendar token:', error);
      // Token refresh failed - return null to trigger re-auth
      return null;
    }
  }

  // Token is valid, return it
  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token ?? undefined,
    expiry_date: tokenData.expiry_date ?? undefined,
  };
}

/**
 * Save calendar tokens for a user using the secure RPC function.
 *
 * The RPC function (upsert_calendar_token) is SECURITY DEFINER and
 * validates that the caller is the user being modified.
 *
 * @param supabase - Supabase client (authenticated)
 * @param userId - User ID
 * @param tokens - OAuth tokens from Google
 * @param provider - Calendar provider (default: 'google')
 */
export async function saveCalendarTokens(
  supabase: SupabaseClient,
  userId: string,
  tokens: GoogleTokens,
  provider: string = 'google'
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc('upsert_calendar_token', {
    p_user_id: userId,
    p_access_token: tokens.access_token,
    p_refresh_token: tokens.refresh_token ?? null,
    p_expiry_date: tokens.expiry_date ?? null,
    p_scope: tokens.scope ?? null,
    p_provider: provider,
  });

  if (error) {
    console.error('Failed to save calendar tokens:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if a user has a valid calendar connection.
 *
 * Uses the has_calendar_connection() RPC function which checks for
 * presence of a refresh token (indicates valid OAuth grant).
 *
 * @param supabase - Supabase client
 * @param userId - User ID (optional, defaults to current user)
 * @param provider - Calendar provider (default: 'google')
 */
export async function hasCalendarConnection(
  supabase: SupabaseClient,
  userId?: string,
  provider: string = 'google'
): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_calendar_connection', {
    p_user_id: userId ?? null, // null uses auth.uid() in the function
    p_provider: provider,
  });

  if (error) {
    console.error('Failed to check calendar connection:', error);
    return false;
  }

  return data === true;
}

/**
 * Revoke calendar connection (delete tokens).
 *
 * @param supabase - Supabase client (authenticated)
 * @param provider - Calendar provider (default: 'google')
 */
export async function revokeCalendarConnection(
  supabase: SupabaseClient,
  provider: string = 'google'
): Promise<boolean> {
  const { data, error } = await supabase.rpc('revoke_calendar_connection', {
    p_provider: provider,
  });

  if (error) {
    console.error('Failed to revoke calendar connection:', error);
    return false;
  }

  return data === true;
}
