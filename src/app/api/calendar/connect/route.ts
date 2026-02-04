import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getAuthUrl } from '@/lib/google/calendar';
import { isValidInternalPath } from '@/lib/security/url-validation';
import {
  generateOAuthNonce,
  createStateSignature,
} from '@/lib/security/code-generation';

// Secret for signing OAuth state (should be in env var in production)
const STATE_SECRET = process.env.OAUTH_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret-change-me';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get and validate return URL from query params
    const searchParams = request.nextUrl.searchParams;
    const returnToParam = searchParams.get('returnTo');

    // SECURITY: Validate returnTo is a safe internal path
    const returnTo = isValidInternalPath(returnToParam) ? returnToParam : '/settings';

    // SECURITY: Generate cryptographically secure nonce for CSRF protection
    const nonce = generateOAuthNonce();

    // Create state with user ID, return URL, and nonce
    const stateData = JSON.stringify({ userId: user.id, returnTo, nonce });
    const signature = createStateSignature(stateData, STATE_SECRET);
    const state = Buffer.from(
      JSON.stringify({ data: stateData, sig: signature })
    ).toString('base64');

    // SECURITY: Store nonce in HttpOnly cookie for verification on callback
    const cookieStore = await cookies();
    cookieStore.set('oauth_nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/api/calendar/callback',
    });

    // Generate Google OAuth URL
    const authUrl = getAuthUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Calendar connect error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google Calendar connection' },
      { status: 500 }
    );
  }
}
