/**
 * Auth Callback Route
 * Handles OAuth and magic link redirects from Supabase
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  getCanonicalOrigin,
  sanitizeRedirectPath,
} from '@/lib/security/url-validation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // SECURITY: Use canonical origin instead of trusting request origin
  const origin = getCanonicalOrigin()

  // SECURITY: Validate and sanitize the redirect path to prevent open redirect
  const next = sanitizeRedirectPath(searchParams.get('next'), '/dashboard')

  // Handle errors from Supabase
  if (error) {
    console.error('Auth error:', error, error_description)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error_description || error)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error('Session exchange error:', sessionError)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(sessionError.message)}`
      )
    }

    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Ensure user exists in public.users table (upsert)
       
      const { error: upsertError } = await (supabase.from('users') as any).upsert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })

      if (upsertError) {
        console.error('User upsert error:', upsertError)
        // Don't block login, just log the error
      }
    }

    // Successful authentication - redirect to intended destination
    return NextResponse.redirect(`${origin}${next}`)
  }

  // No code provided - redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
