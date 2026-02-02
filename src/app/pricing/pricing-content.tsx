'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useSubscription } from '@/hooks/useSubscription'
import { TIER_LIMITS, formatPrice, PRICING } from '@/lib/stripe'
import {
  Check,
  X,
  Crown,
  Sparkles,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function PricingContent() {
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')
  const { isPro, isLoading, redirectToCheckout } = useSubscription()
  const [billingInterval, setBillingInterval] = React.useState<'monthly' | 'yearly'>('monthly')
  const [checkoutLoading, setCheckoutLoading] = React.useState(false)

  React.useEffect(() => {
    if (canceled) {
      toast.info('Checkout canceled. You can try again anytime.')
    }
  }, [canceled])

  const handleUpgrade = async () => {
    setCheckoutLoading(true)
    try {
      await redirectToCheckout(billingInterval)
    } catch (error) {
      toast.error('Failed to start checkout. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const monthlyPrice = formatPrice(PRICING.monthly.amount)
  const yearlyPrice = formatPrice(PRICING.yearly.amount)
  const yearlyMonthlyEquivalent = formatPrice(Math.round(PRICING.yearly.amount / 12))

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-teal-50/30 dark:from-zinc-950 dark:to-teal-950/10">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-500/30">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-teal-800 to-teal-600 dark:from-teal-200 dark:to-teal-400 bg-clip-text text-transparent">
              ClockAlign
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="rounded-full bg-teal-600 hover:bg-teal-700">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="mb-4 rounded-full px-3 py-1 bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 border-0">
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-teal-950 dark:text-white">
            Choose your plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free with essential features. Upgrade to Pro for unlimited teams and advanced analytics.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <Label
            htmlFor="billing-toggle"
            className={cn(
              'text-sm font-medium transition-colors',
              billingInterval === 'monthly' ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={billingInterval === 'yearly'}
            onCheckedChange={(checked) => setBillingInterval(checked ? 'yearly' : 'monthly')}
            className="data-[state=checked]:bg-teal-600"
          />
          <div className="flex items-center gap-2">
            <Label
              htmlFor="billing-toggle"
              className={cn(
                'text-sm font-medium transition-colors',
                billingInterval === 'yearly' ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              Yearly
            </Label>
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0 text-xs">
              Save {PRICING.yearly.savings}%
            </Badge>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <Card className="relative overflow-hidden border-2 bg-white dark:bg-zinc-900">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold tracking-tight">Free</CardTitle>
              <CardDescription>
                Perfect for getting started
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                variant="outline"
                className="w-full rounded-full h-12 text-base"
                asChild
              >
                <Link href="/dashboard">
                  Get Started Free
                </Link>
              </Button>

              <div className="space-y-3">
                {TIER_LIMITS.free.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pro Tier */}
          <Card className="relative overflow-hidden border-2 border-amber-400 dark:border-amber-500 bg-gradient-to-br from-white to-amber-50/50 dark:from-zinc-900 dark:to-amber-950/20">
            {/* Popular badge */}
            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-4 py-1.5 rounded-bl-xl">
                Most Popular
              </div>
            </div>

            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl font-bold tracking-tight">Pro</CardTitle>
                <Crown className="h-5 w-5 text-amber-500" />
              </div>
              <CardDescription>
                For teams that care about fairness
              </CardDescription>
              <div className="mt-4">
                {billingInterval === 'yearly' ? (
                  <>
                    <span className="text-4xl font-bold">{yearlyMonthlyEquivalent}</span>
                    <span className="text-muted-foreground">/month</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {yearlyPrice} billed annually
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-bold">{monthlyPrice}</span>
                    <span className="text-muted-foreground">/month</span>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isPro ? (
                <Button
                  disabled
                  className="w-full rounded-full h-12 text-base bg-emerald-600"
                >
                  <Check className="mr-2 h-5 w-5" />
                  Current Plan
                </Button>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={isLoading || checkoutLoading}
                  className="w-full rounded-full h-12 text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Start 7-Day Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              )}

              <div className="space-y-3">
                {TIER_LIMITS.pro.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <FaqItem
              question="How does the 7-day free trial work?"
              answer="You get full access to all Pro features for 7 days. No credit card required upfront. At the end of the trial, you can choose to subscribe or continue with the free tier."
            />
            <FaqItem
              question="Can I cancel anytime?"
              answer="Yes! You can cancel your subscription at any time from your settings page. You'll continue to have Pro access until the end of your billing period."
            />
            <FaqItem
              question="What happens to my data if I downgrade?"
              answer="Your data is never deleted. If you downgrade to Free, you'll keep all your existing teams but won't be able to create new ones beyond the free tier limit. Premium features will show upgrade prompts."
            />
            <FaqItem
              question="Do you offer team or enterprise pricing?"
              answer="Currently, ClockAlign Pro is priced per-user. For larger teams or custom enterprise needs, please contact us at hello@clockalign.com."
            />
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Secure payments via Stripe</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b pb-6">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-muted-foreground text-sm">{answer}</p>
    </div>
  )
}
