import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getTokensFromCode } from '@/lib/google/calendar';
import { saveCalendarTokens } from '@/lib/calendar/tokens';
import {
  getCanonicalOrigin,
  sanitizeRedirectPath,
} from '@/lib/security/url-validation';
import { verifyStateSignature } from '@/lib/security/code-generation';

// Secret for verifying OAuth state (must match connect route)
const STATE_SECRET = process.env.OAUTH_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret-change-me';

export async function GET(request: NextRequest) {
  // SECURITY: Use canonical origin for all redirects
  const origin = getCanonicalOrigin();

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(`${origin}/settings?error=calendar_denied`);
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(`${origin}/settings?error=missing_params`);
    }

    // SECURITY: Decode and verify state signature
    let stateData: { userId: string; returnTo: string; nonce: string };
    try {
      const stateWrapper = JSON.parse(Buffer.from(stateParam, 'base64').toString());

      // Verify HMAC signature to ensure state wasn't tampered with
      if (!verifyStateSignature(stateWrapper.data, stateWrapper.sig, STATE_SECRET)) {
        console.error('OAuth state signature verification failed');
        return NextResponse.redirect(`${origin}/settings?error=invalid_state`);
      }

      stateData = JSON.parse(stateWrapper.data);
    } catch {
      return NextResponse.redirect(`${origin}/settings?error=invalid_state`);
    }

    // SECURITY: Verify nonce from cookie matches state nonce (CSRF protection)
    const cookieStore = await cookies();
    const storedNonce = cookieStore.get('oauth_nonce')?.value;

    // Clear the nonce cookie immediately (one-time use)
    cookieStore.delete('oauth_nonce');

    if (!storedNonce || storedNonce !== stateData.nonce) {
      console.error('OAuth nonce mismatch - potential CSRF attack');
      return NextResponse.redirect(`${origin}/settings?error=invalid_state`);
    }

    const supabase = await createClient();

    // Verify user is still authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== stateData.userId) {
      return NextResponse.redirect(`${origin}/login?error=session_expired`);
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(`${origin}/settings?error=token_exchange_failed`);
    }

    // Store tokens in dedicated calendar_tokens table (more secure than preferences)
    const saveResult = await saveCalendarTokens(supabase, user.id, tokens);

    if (!saveResult.success) {
      console.error('Failed to store calendar tokens:', saveResult.error);
      return NextResponse.redirect(`${origin}/settings?error=storage_failed`);
    }

    // SECURITY: Validate returnTo path before redirecting
    const safeReturnTo = sanitizeRedirectPath(stateData.returnTo, '/settings');
    return NextResponse.redirect(`${origin}${safeReturnTo}?calendar=connected`);
  } catch (error) {
    console.error('Calendar callback error:', error);
    return NextResponse.redirect(`${origin}/settings?error=callback_failed`);
  }
}
