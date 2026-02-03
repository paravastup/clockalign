'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Gift,
  Users,
  TrendingUp,
  Clock,
  Copy,
  Check,
  Share2,
  Loader2,
  UserPlus,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ReferralStats {
  total: number
  converted: number
  pending: number
  conversionRate: number
}

interface Referral {
  id: string
  status: 'pending' | 'converted' | 'expired'
  createdAt: string
  convertedAt: string | null
  referredName: string
  referredEmail: string | null
}

export function ReferralsContent() {
  const [referralCode, setReferralCode] = React.useState<string | null>(null)
  const [stats, setStats] = React.useState<ReferralStats | null>(null)
  const [referrals, setReferrals] = React.useState<Referral[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [copied, setCopied] = React.useState(false)

  // Fetch referral data on mount
  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/referrals/stats')
        if (response.ok) {
          const data = await response.json()
          setReferralCode(data.referralCode)
          setStats(data.stats)
          setReferrals(data.referrals)
        }
      } catch (error) {
        console.error('Error fetching referral data:', error)
        toast.error('Failed to load referral data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
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
        handleCopy()
      }
    } else {
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

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
          <p className="text-muted-foreground">
            Track your referrals and see how many friends you&apos;ve invited.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
        <p className="text-muted-foreground">
          Track your referrals and see how many friends you&apos;ve invited.
        </p>
      </div>

      {/* Referral Code Card */}
      <Card className="card-elevated bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200/50 dark:border-violet-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/30">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">
                Your Referral Code
              </CardTitle>
              <CardDescription>
                Share this code with friends to give them their first month free
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center justify-center px-6 py-4 rounded-xl bg-white dark:bg-zinc-900 border-2 border-dashed border-violet-300 dark:border-violet-700">
              <code className="font-mono text-2xl font-bold text-violet-700 dark:text-violet-300 tracking-widest">
                {referralCode || 'Loading...'}
              </code>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1 rounded-xl h-11 border-violet-200 hover:bg-violet-50 dark:border-violet-800 dark:hover:bg-violet-950/50"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Code
                </>
              )}
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 rounded-xl h-11 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/50">
                  <Users className="h-4 w-4 text-sky-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Referrals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{stats.converted}</p>
                  <p className="text-xs text-muted-foreground">Converted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/50">
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-violet-600">{stats.conversionRate}%</p>
                  <p className="text-xs text-muted-foreground">Conv. Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Referrals List */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight">
            Referral History
          </CardTitle>
          <CardDescription>
            People who used your referral code
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <UserPlus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No referrals yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Share your referral code with friends to give them their first month of Pro free!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        referral.status === 'converted'
                          ? 'bg-emerald-100 dark:bg-emerald-900/50'
                          : referral.status === 'pending'
                          ? 'bg-amber-100 dark:bg-amber-900/50'
                          : 'bg-zinc-100 dark:bg-zinc-800/50'
                      )}
                    >
                      {referral.status === 'converted' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : referral.status === 'pending' ? (
                        <Clock className="h-4 w-4 text-amber-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{referral.referredName}</p>
                      {referral.referredEmail && (
                        <p className="text-xs text-muted-foreground">
                          {referral.referredEmail}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        referral.status === 'converted'
                          ? 'default'
                          : referral.status === 'pending'
                          ? 'secondary'
                          : 'outline'
                      }
                      className={cn(
                        referral.status === 'converted' &&
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                      )}
                    >
                      {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {referral.status === 'converted' && referral.convertedAt
                        ? `Converted ${formatDate(referral.convertedAt)}`
                        : `Invited ${formatDate(referral.createdAt)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight">
            How Referrals Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-violet-600">1</span>
              </div>
              <h4 className="font-medium mb-1">Share Your Code</h4>
              <p className="text-sm text-muted-foreground">
                Give your unique referral code to friends who might like ClockAlign
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-violet-600">2</span>
              </div>
              <h4 className="font-medium mb-1">They Use It</h4>
              <p className="text-sm text-muted-foreground">
                When they enter your code at checkout, they get their first month free
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-violet-600">3</span>
              </div>
              <h4 className="font-medium mb-1">Track Progress</h4>
              <p className="text-sm text-muted-foreground">
                See who you&apos;ve invited and when they convert to Pro
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
