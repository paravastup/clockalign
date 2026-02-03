/**
 * Referral Code API Route
 * GET: Get current user's referral code (creates one if doesn't exist)
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Generate a unique referral code
 * Format: REF_ + 8 alphanumeric characters
 */
function generateReferralCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = 'REF_'
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's current referral code
    interface UserProfile {
      referral_code: string | null
      referral_count: number
    }
    const { data: profile, error: fetchError } = await supabase
      .from('users')
      .select('referral_code, referral_count')
      .eq('id', user.id)
      .single() as { data: UserProfile | null, error: Error | null }

    if (fetchError) {
      console.error('Error fetching profile:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    // If user already has a referral code, return it
    if (profile?.referral_code) {
      return NextResponse.json({
        referralCode: profile.referral_code,
        referralCount: profile.referral_count || 0,
      })
    }

    // Generate a new unique referral code
    let newCode = generateReferralCode()
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      // Check if code already exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', newCode)
        .single()

      if (!existing) {
        break // Code is unique
      }

      newCode = generateReferralCode()
      attempts++
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique referral code' },
        { status: 500 }
      )
    }

    // Save the new referral code
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('users') as any)
      .update({ referral_code: newCode })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error saving referral code:', updateError)
      return NextResponse.json(
        { error: 'Failed to save referral code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      referralCode: newCode,
      referralCount: 0,
    })
  } catch (error) {
    console.error('Error in referral code route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
