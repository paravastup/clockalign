/**
 * Premium Gate Component
 * Wraps premium features and shows upgrade prompt for free users
 */
'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSubscription } from '@/hooks/useSubscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Lock, Sparkles, Zap, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Feature descriptions for upgrade prompts
const FEATURE_INFO: Record<string, { title: string; description: string; icon: React.ComponentType<{ className?: string }> }> = {
  leaderboard: {
    title: 'Sacrifice Leaderboard',
    description: 'See who\'s taking the hit for the team with full ranking and analytics.',
    icon: Crown,
  },
  heatmap: {
    title: 'Golden Windows Heatmap',
    description: 'Visual energy overlap to find the perfect meeting times.',
    icon: Zap,
  },
  async_tracking: {
    title: 'Async Nudge Tracking',
    description: 'Track hours reclaimed by choosing async over meetings.',
    icon: Sparkles,
  },
  split_calls: {
    title: 'Split Calls',
    description: 'Schedule split calls for future dates, not just today.',
    icon: Sparkles,
  },
  unlimited_teams: {
    title: 'Unlimited Teams',
    description: 'Create and manage as many teams as you need.',
    icon: Sparkles,
  },
  unlimited_members: {
    title: 'Unlimited Team Members',
    description: 'Add as many team members as you need.',
    icon: Sparkles,
  },
}

interface PremiumGateProps {
  feature: keyof typeof FEATURE_INFO
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradeInline?: boolean
  className?: string
}

export function PremiumGate({
  feature,
  children,
  fallback,
  showUpgradeInline = true,
  className,
}: PremiumGateProps) {
  const { isPro, isLoading } = useSubscription()

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isPro) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (!showUpgradeInline) {
    return null
  }

  const info = FEATURE_INFO[feature]
  const Icon = info?.icon || Crown

  return (
    <Card className={cn('border-dashed border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20', className)}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm">
            <Crown className="h-3 w-3 mr-1" />
            Pro Feature
          </Badge>
        </div>
        <CardTitle className="text-xl font-semibold tracking-tight text-amber-900 dark:text-amber-100">
          {info?.title || 'Premium Feature'}
        </CardTitle>
        <CardDescription className="text-amber-700/80 dark:text-amber-300/80">
          {info?.description || 'Upgrade to Pro to unlock this feature.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center pt-0">
        <Button
          asChild
          className="rounded-full px-6 h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30"
        >
          <Link href="/pricing">
            Upgrade to Pro
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-3">
          Start with a 7-day free trial
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * Locked overlay for partially visible premium content
 * Use when you want to show a blurred preview of the feature
 */
interface PremiumOverlayProps {
  feature: keyof typeof FEATURE_INFO
  children: React.ReactNode
  className?: string
}

export function PremiumOverlay({ feature, children, className }: PremiumOverlayProps) {
  const { isPro, isLoading } = useSubscription()
  const info = FEATURE_INFO[feature]
  const Icon = info?.icon || Lock

  if (isLoading) {
    return <div className={className}>{children}</div>
  }

  if (isPro) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={cn('relative', className)}>
      {/* Blurred content */}
      <div className="blur-sm pointer-events-none select-none opacity-60">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background/90 via-background/50 to-transparent">
        <div className="text-center p-6 max-w-sm">
          <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <Lock className="h-6 w-6 text-amber-600" />
          </div>
          <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
            {info?.title || 'Pro Feature'}
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            {info?.description || 'Upgrade to unlock'}
          </p>
          <Button
            size="sm"
            asChild
            className="rounded-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Link href="/pricing">
              <Crown className="h-3.5 w-3.5 mr-1.5" />
              Unlock with Pro
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Simple Pro badge for indicating premium features
 */
export function ProBadge({ className }: { className?: string }) {
  return (
    <Badge
      className={cn(
        'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] font-semibold px-1.5 py-0',
        className
      )}
    >
      PRO
    </Badge>
  )
}

/**
 * Upgrade CTA banner for sidebar or other prominent locations
 */
export function UpgradeBanner({ className }: { className?: string }) {
  const { isPro, isLoading, isTrialing, trialEndsAt } = useSubscription()

  if (isLoading || isPro) {
    return null
  }

  return (
    <div className={cn('p-4', className)}>
      <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
            <Crown className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            Upgrade to Pro
          </span>
        </div>
        <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mb-3">
          Unlock unlimited teams, leaderboards, and more.
        </p>
        <Button
          size="sm"
          asChild
          className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs h-8"
        >
          <Link href="/pricing">
            Start Free Trial
            <ArrowRight className="ml-1.5 h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

/**
 * Subscription status indicator for header/settings
 */
export function SubscriptionBadge({ className }: { className?: string }) {
  const { isPro, isTrialing, status, isLoading } = useSubscription()

  if (isLoading) {
    return null
  }

  if (!isPro) {
    return (
      <Badge
        variant="outline"
        className={cn('text-xs font-medium', className)}
      >
        Free
      </Badge>
    )
  }

  if (isTrialing) {
    return (
      <Badge
        className={cn(
          'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs font-medium',
          className
        )}
      >
        <Sparkles className="h-3 w-3 mr-1" />
        Trial
      </Badge>
    )
  }

  return (
    <Badge
      className={cn(
        'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs font-medium',
        className
      )}
    >
      <Crown className="h-3 w-3 mr-1" />
      Pro
    </Badge>
  )
}
