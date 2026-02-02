/**
 * Pricing Page
 * Public pricing comparison between Free and Pro tiers
 */
import { Metadata } from 'next'
import { Suspense } from 'react'
import { PricingContent } from './pricing-content'

export const metadata: Metadata = {
  title: 'Pricing - ClockAlign',
  description: 'Choose the plan that\'s right for your team. Start free, upgrade when you need more.',
}

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingFallback />}>
      <PricingContent />
    </Suspense>
  )
}

function PricingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  )
}
