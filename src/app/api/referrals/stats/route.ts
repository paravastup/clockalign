/**
 * Referral Stats API Route
 * GET: Get current user's referral statistics and referral list
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Get user's referral code and count
    interface UserProfile {
      referral_code: string | null
      referral_count: number
    }
    const { data: profile } = await supabase
      .from('users')
      .select('referral_code, referral_count')
      .eq('id', user.id)
      .single() as { data: UserProfile | null }

    // Get list of people this user referred
    interface Referral {
      id: string
      referred_id: string
      status: string
      created_at: string
      converted_at: string | null
    }
    const { data: referrals } = await supabase
      .from('referrals')
      .select('id, referred_id, status, created_at, converted_at')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50) as { data: Referral[] | null }

    // Get referred user details (name/email) - only for converted ones to protect privacy
    interface ReferredUser {
      id: string
      name: string | null
      email: string
      subscription_status: string
    }
    let referredUsers: ReferredUser[] = []

    if (referrals && referrals.length > 0) {
      const referredIds = referrals.map(r => r.referred_id)
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email, subscription_status')
        .in('id', referredIds) as { data: ReferredUser[] | null }

      referredUsers = users || []
    }

    // Build response with merged data
    const referralList = (referrals || []).map(referral => {
      const referredUser = referredUsers.find(u => u.id === referral.referred_id)
      return {
        id: referral.id,
        status: referral.status,
        createdAt: referral.created_at,
        convertedAt: referral.converted_at,
        // Only show name for converted referrals, otherwise show "Pending"
        referredName: referral.status === 'converted' && referredUser?.name
          ? referredUser.name
          : 'Pending user',
        referredEmail: referral.status === 'converted' && referredUser?.email
          ? referredUser.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Partially mask email
          : null,
      }
    })

    // Calculate stats
    const totalReferrals = referralList.length
    const convertedReferrals = referralList.filter(r => r.status === 'converted').length
    const pendingReferrals = referralList.filter(r => r.status === 'pending').length

    return NextResponse.json({
      referralCode: profile?.referral_code || null,
      stats: {
        total: totalReferrals,
        converted: convertedReferrals,
        pending: pendingReferrals,
        conversionRate: totalReferrals > 0
          ? Math.round((convertedReferrals / totalReferrals) * 100)
          : 0,
      },
      referrals: referralList,
    })
  } catch (error) {
    console.error('Error in referral stats route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
