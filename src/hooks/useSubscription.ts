/**
 * Subscription Hook
 * Client-side hook for accessing user's subscription state
 */
'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SubscriptionStatus, SubscriptionTier } from '@/lib/stripe'
import { isActiveSubscription, isPro, TIER_LIMITS } from '@/lib/stripe'

interface SubscriptionState {
  tier: SubscriptionTier
  status: SubscriptionStatus
  isLoading: boolean
  isPro: boolean
  isTrialing: boolean
  currentPeriodEnd: Date | null
  trialEndsAt: Date | null
  limits: typeof TIER_LIMITS.free | typeof TIER_LIMITS.pro
}

interface SubscriptionActions {
  refetch: () => Promise<void>
  redirectToCheckout: (priceType?: 'monthly' | 'yearly') => Promise<void>
  redirectToPortal: () => Promise<void>
}

export type UseSubscriptionReturn = SubscriptionState & SubscriptionActions

export function useSubscription(): UseSubscriptionReturn {
  const [state, setState] = React.useState<SubscriptionState>({
    tier: 'free',
    status: 'free',
    isLoading: true,
    isPro: false,
    isTrialing: false,
    currentPeriodEnd: null,
    trialEndsAt: null,
    limits: TIER_LIMITS.free,
  })

  const supabase = createClient()

  const fetchSubscription = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          tier: 'free',
          status: 'free',
          isPro: false,
          limits: TIER_LIMITS.free,
        }))
        return
      }

      interface UserProfile {
        subscription_tier: string | null
        subscription_status: string | null
        current_period_end: string | null
        trial_ends_at: string | null
      }
      const { data: profile } = await supabase
        .from('users')
        .select('subscription_tier, subscription_status, current_period_end, trial_ends_at')
        .eq('id', user.id)
        .single() as { data: UserProfile | null }

      if (profile) {
        const tier = (profile.subscription_tier || 'free') as SubscriptionTier
        const status = (profile.subscription_status || 'free') as SubscriptionStatus
        const isProUser = isPro(tier, status)

        setState({
          tier,
          status,
          isLoading: false,
          isPro: isProUser,
          isTrialing: status === 'trialing',
          currentPeriodEnd: profile.current_period_end
            ? new Date(profile.current_period_end)
            : null,
          trialEndsAt: profile.trial_ends_at
            ? new Date(profile.trial_ends_at)
            : null,
          limits: isProUser ? TIER_LIMITS.pro : TIER_LIMITS.free,
        })
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
        }))
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
      }))
    }
  }, [supabase])

  const redirectToCheckout = React.useCallback(async (priceType: 'monthly' | 'yearly' = 'monthly') => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceType }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error redirecting to checkout:', error)
      throw error
    }
  }, [])

  const redirectToPortal = React.useCallback(async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create portal session')
      }

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error redirecting to portal:', error)
      throw error
    }
  }, [])

  // Fetch subscription on mount
  React.useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  // Subscribe to realtime updates for subscription changes
  React.useEffect(() => {
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          if (payload.new) {
            const data = payload.new as {
              subscription_tier?: string
              subscription_status?: string
              current_period_end?: string
              trial_ends_at?: string
            }
            const tier = (data.subscription_tier || 'free') as SubscriptionTier
            const status = (data.subscription_status || 'free') as SubscriptionStatus
            const isProUser = isPro(tier, status)

            setState({
              tier,
              status,
              isLoading: false,
              isPro: isProUser,
              isTrialing: status === 'trialing',
              currentPeriodEnd: data.current_period_end
                ? new Date(data.current_period_end)
                : null,
              trialEndsAt: data.trial_ends_at
                ? new Date(data.trial_ends_at)
                : null,
              limits: isProUser ? TIER_LIMITS.pro : TIER_LIMITS.free,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return {
    ...state,
    refetch: fetchSubscription,
    redirectToCheckout,
    redirectToPortal,
  }
}

/**
 * Hook for checking if user can perform a specific action based on tier limits
 */
export function useCanAccess(feature: 'unlimited_teams' | 'unlimited_members' | 'leaderboard' | 'heatmap' | 'async_tracking' | 'split_calls'): boolean {
  const { isPro } = useSubscription()
  return isPro
}

/**
 * Hook for checking team creation limits
 */
export function useTeamLimits() {
  const { limits, isPro } = useSubscription()
  const [currentTeamCount, setCurrentTeamCount] = React.useState(0)
  const supabase = createClient()

  React.useEffect(() => {
    async function fetchTeamCount() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { count } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setCurrentTeamCount(count || 0)
    }

    fetchTeamCount()
  }, [supabase])

  return {
    currentTeamCount,
    maxTeams: limits.maxTeams,
    canCreateTeam: isPro || currentTeamCount < limits.maxTeams,
    remainingTeams: isPro ? Infinity : Math.max(0, limits.maxTeams - currentTeamCount),
  }
}
