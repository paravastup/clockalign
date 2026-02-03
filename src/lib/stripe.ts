/**
 * Stripe Configuration
 * Server-side Stripe client and configuration
 */
import Stripe from 'stripe'

// Lazy-initialized Stripe instance
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  }
  return stripeInstance
}

// Export the stripe instance getter
export { getStripe as stripe }

// Pricing configuration
export const PRICING = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY || '',
    amount: 499, // $4.99 in cents
    interval: 'month' as const,
  },
  yearly: {
    priceId: process.env.STRIPE_PRICE_ID_YEARLY || '',
    amount: 3900, // $39 in cents
    interval: 'year' as const,
    savings: 35, // 35% savings
  },
  trialDays: 7,
}

// Feature limits by tier
export const TIER_LIMITS = {
  free: {
    maxTeams: 1,
    maxTeamMembers: 5,
    features: [
      'Fair Time Finder tool',
      '1 team',
      'Up to 5 team members',
      'Basic meeting scheduling',
      'View your own sacrifice score',
    ],
  },
  pro: {
    maxTeams: Infinity,
    maxTeamMembers: Infinity,
    features: [
      'Everything in Free',
      'Unlimited teams',
      'Unlimited team members',
      'Sacrifice Leaderboard',
      'Golden Windows Heatmap',
      'Async Nudge tracking',
      'Split Calls for future dates',
      'Priority support',
    ],
  },
}

// Subscription status helpers
export type SubscriptionStatus = 'free' | 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete'
export type SubscriptionTier = 'free' | 'pro'

export function isActiveSubscription(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing'
}

export function isPro(tier: SubscriptionTier, status: SubscriptionStatus): boolean {
  return tier === 'pro' && isActiveSubscription(status)
}

// Format price for display
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount / 100)
}
