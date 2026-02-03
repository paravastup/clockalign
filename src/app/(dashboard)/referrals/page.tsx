/**
 * Referrals Dashboard Page
 * Shows user's referral code, stats, and list of referrals
 */
import { Metadata } from 'next'
import { ReferralsContent } from './referrals-content'

export const metadata: Metadata = {
  title: 'Referrals - ClockAlign',
  description: 'View your referral stats and track who you\'ve invited to ClockAlign.',
}

export default function ReferralsPage() {
  return <ReferralsContent />
}
