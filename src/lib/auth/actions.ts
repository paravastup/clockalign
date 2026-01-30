'use server'

/**
 * Server Actions for Authentication
 * Handles magic link, Google OAuth, and logout
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export type AuthResult = {
  error?: string
  success?: boolean
  message?: string
}

/**
 * Sign in with magic link (email)
 */
export async function signInWithMagicLink(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string
  const redirectTo = formData.get('redirectTo') as string | null
  
  if (!email) {
    return { error: 'Email is required' }
  }

  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback${redirectTo ? `?next=${redirectTo}` : ''}`,
    },
  })

  if (error) {
    console.error('Magic link error:', error)
    return { error: error.message }
  }

  return { 
    success: true, 
    message: 'Check your email for a magic link!' 
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(redirectTo?: string): Promise<AuthResult> {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback${redirectTo ? `?next=${redirectTo}` : ''}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    console.error('Google OAuth error:', error)
    return { error: error.message }
  }

  if (data?.url) {
    redirect(data.url)
  }

  return { error: 'Failed to initiate Google sign in' }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

/**
 * Create or update user profile after authentication
 */
export async function ensureUserProfile(timezone?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (existingProfile) {
    return existingProfile
  }

  // Create profile
  // Note: Type cast needed because Supabase types don't fully match our schema yet
  const { data: newProfile, error } = await supabase
    .from('users')
    .insert({
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      google_id: user.user_metadata?.provider_id || null,
      timezone: timezone || 'UTC',
    } as never)
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    return null
  }

  return newProfile
}
