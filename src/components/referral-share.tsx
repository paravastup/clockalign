/**
 * Referral Share Component
 * Displays user's referral code and allows sharing
 */
'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, Share2, Gift, Users, Loader2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

interface ReferralShareProps {
  className?: string
}

export function ReferralShare({ className }: ReferralShareProps) {
  const [referralCode, setReferralCode] = React.useState<string | null>(null)
  const [referralCount, setReferralCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [copied, setCopied] = React.useState(false)

  // Fetch referral code on mount
  React.useEffect(() => {
    async function fetchReferralCode() {
      try {
        const response = await fetch('/api/referrals/code')
        if (response.ok) {
          const data = await response.json()
          setReferralCode(data.referralCode)
          setReferralCount(data.referralCount || 0)
        }
      } catch (error) {
        console.error('Error fetching referral code:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReferralCode()
  }, [])

  const handleCopy = async () => {
    if (!referralCode) return

    try {
      await navigator.clipboard.writeText(referralCode)
      setCopied(true)
      toast.success('Referral code copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleShare = async () => {
    if (!referralCode) return

    const shareData = {
      title: 'Join ClockAlign',
      text: `Use my referral code ${referralCode} to get your first month free on ClockAlign Pro!`,
      url: `https://clockalign.com/pricing?ref=${referralCode}`,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled or share failed, fallback to copy
        handleCopy()
      }
    } else {
      // Fallback: copy the full message
      try {
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`
        )
        toast.success('Share link copied!')
      } catch {
        toast.error('Failed to copy')
      }
    }
  }

  if (isLoading) {
    return (
      <Card className={cn('card-elevated', className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('card-elevated', className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50">
            <Gift className="h-5 w-5 text-violet-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Invite Friends
            </CardTitle>
            <CardDescription className="text-[13px]">
              Give friends their first month free when they upgrade to Pro
            </CardDescription>
          </div>
          {referralCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {referralCount} {referralCount === 1 ? 'referral' : 'referrals'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Code Display */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200/50 dark:border-violet-800/50">
            <span className="text-sm text-muted-foreground">Your code:</span>
            <code className="flex-1 font-mono font-semibold text-violet-700 dark:text-violet-300 tracking-wide">
              {referralCode || 'Loading...'}
            </code>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="h-12 w-12 rounded-xl border-violet-200 hover:bg-violet-50 dark:border-violet-800 dark:hover:bg-violet-950/50"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4 text-violet-600" />
            )}
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleShare}
            className="flex-1 rounded-xl h-11 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share Invite
          </Button>
          <Button
            variant="outline"
            asChild
            className="rounded-xl h-11 border-violet-200 hover:bg-violet-50 dark:border-violet-800 dark:hover:bg-violet-950/50"
          >
            <Link href="/referrals">
              View Referrals
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* How it works */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>How it works:</strong> Share your code with friends. When they use it at checkout, they get their first month of Pro free. You&apos;ll see them in your referral stats!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
