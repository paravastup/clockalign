'use client'

/**
 * Meeting Avoided Badge - Shareable Celebration
 * CA-GTM: Viral component for when users choose async over sync
 *
 * Celebrates the decision to go async and generates shareable
 * content to promote ClockAlign's async-first philosophy.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2,
  Copy,
  Twitter,
  Linkedin,
  Check,
  PartyPopper,
  Clock,
  Zap,
  FileText,
  Video,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics/posthog'
import { formatHoursReclaimed } from '@/lib/async-nudge'

// ============================================
// TYPES
// ============================================

export type AsyncAlternativeType = 'loom' | 'doc' | 'poll' | 'email' | 'slack' | 'other'

export interface MeetingAvoidedBadgeProps {
  alternativeType: AsyncAlternativeType
  hoursSaved: number
  participantCount: number
  meetingTitle?: string
  totalHoursReclaimed?: number // Lifetime total
  className?: string
  onShare?: (platform: 'twitter' | 'linkedin' | 'clipboard') => void
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getAlternativeDisplay = (type: AsyncAlternativeType) => {
  const displays: Record<AsyncAlternativeType, { icon: typeof Video; label: string; emoji: string }> = {
    loom: { icon: Video, label: 'a Loom', emoji: '🎥' },
    doc: { icon: FileText, label: 'a doc', emoji: '📝' },
    poll: { icon: FileText, label: 'a poll', emoji: '📊' },
    email: { icon: FileText, label: 'an email', emoji: '📧' },
    slack: { icon: FileText, label: 'a Slack thread', emoji: '💬' },
    other: { icon: Zap, label: 'async', emoji: '⚡' },
  }
  return displays[type]
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MeetingAvoidedBadge({
  alternativeType,
  hoursSaved,
  participantCount,
  meetingTitle,
  totalHoursReclaimed,
  className,
  onShare,
}: MeetingAvoidedBadgeProps) {
  const [copied, setCopied] = useState(false)
  const [showConfetti, setShowConfetti] = useState(true)

  const altDisplay = getAlternativeDisplay(alternativeType)

  // Generate share text
  const generateShareText = () => {
    const text = [
      `${altDisplay.emoji} This meeting was ${altDisplay.label}!`,
      '',
      `⏰ ${formatHoursReclaimed(hoursSaved)} saved for ${participantCount} people`,
      meetingTitle ? `📋 "${meetingTitle}"` : null,
      totalHoursReclaimed ? `🎯 ${formatHoursReclaimed(totalHoursReclaimed)} reclaimed total` : null,
      '',
      '💡 Not every conversation needs a calendar invite.',
      '',
      '⚡ Powered by ClockAlign - Fair meetings for global teams',
      'https://clockalign.app',
    ].filter(Boolean).join('\n')

    return text
  }

  // Generate tweet text
  const generateTweetText = () => {
    const text = [
      `${altDisplay.emoji} This meeting was ${altDisplay.label}!`,
      '',
      `Saved ${formatHoursReclaimed(hoursSaved)} for ${participantCount} people.`,
      '',
      `Not every sync needs a calendar invite.`,
      '',
      `Track your hours reclaimed with @clockalign`,
    ].join('\n')

    return text
  }

  const handleCopyToClipboard = async () => {
    const text = generateShareText()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard!')

    trackEvent(ANALYTICS_EVENTS.MEETING_AVOIDED_SHARED, {
      platform: 'clipboard',
      alternative_type: alternativeType,
      hours_saved: hoursSaved,
      participant_count: participantCount,
    })

    onShare?.('clipboard')
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(generateTweetText())
    const url = encodeURIComponent('https://clockalign.app')
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
      'width=550,height=420'
    )

    trackEvent(ANALYTICS_EVENTS.MEETING_AVOIDED_SHARED, {
      platform: 'twitter',
      alternative_type: alternativeType,
      hours_saved: hoursSaved,
      participant_count: participantCount,
    })

    onShare?.('twitter')
  }

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent('https://clockalign.app')
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      '_blank',
      'width=550,height=420'
    )

    trackEvent(ANALYTICS_EVENTS.MEETING_AVOIDED_SHARED, {
      platform: 'linkedin',
      alternative_type: alternativeType,
      hours_saved: hoursSaved,
      participant_count: participantCount,
    })

    onShare?.('linkedin')
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meeting Avoided!',
          text: generateShareText(),
          url: 'https://clockalign.app',
        })

        trackEvent(ANALYTICS_EVENTS.MEETING_AVOIDED_SHARED, {
          platform: 'native',
          alternative_type: alternativeType,
          hours_saved: hoursSaved,
          participant_count: participantCount,
        })
      } catch {
        handleCopyToClipboard()
      }
    } else {
      handleCopyToClipboard()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('relative', className)}
    >
      {/* Confetti effect on first render */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 2, duration: 0.5 }}
            onAnimationComplete={() => setShowConfetti(false)}
            className="absolute -top-2 -left-2 -right-2 -bottom-2 pointer-events-none overflow-hidden"
          >
            {/* Animated sparkles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  y: '100%',
                  x: `${(i / 6) * 100}%`,
                  opacity: 1,
                  scale: 0.5,
                }}
                animate={{
                  y: '-100%',
                  opacity: 0,
                  scale: 1,
                }}
                transition={{
                  duration: 1 + Math.random() * 0.5,
                  delay: Math.random() * 0.3,
                }}
                className="absolute text-2xl"
              >
                {['🎉', '✨', '🎊', '⭐', '💫', '🌟'][i]}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Badge Card */}
      <div className={cn(
        'rounded-2xl overflow-hidden',
        'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50',
        'dark:from-emerald-900/30 dark:via-teal-900/30 dark:to-cyan-900/30',
        'border-2 border-emerald-200 dark:border-emerald-700',
        'shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20',
        'p-6'
      )}>
        {/* Header with celebration */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
              <PartyPopper className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-800 dark:text-emerald-200 text-lg">
                Meeting Avoided!
              </h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Great async decision
              </p>
            </div>
          </div>

          {/* Share button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end">
              <div className="space-y-1">
                <button
                  onClick={handleShareTwitter}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <Twitter className="w-4 h-4 text-sky-500" />
                  <span className="text-sm font-medium">Share on X</span>
                </button>
                <button
                  onClick={handleShareLinkedIn}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Share on LinkedIn</span>
                </button>
                <button
                  onClick={handleCopyToClipboard}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-500" />
                  )}
                  <span className="text-sm font-medium">
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Alternative chosen */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 border border-emerald-200 dark:border-emerald-700">
          <p className="text-center text-lg">
            <span className="text-2xl mr-2">{altDisplay.emoji}</span>
            <span className="text-slate-700 dark:text-slate-300">
              This meeting was <span className="font-bold text-emerald-600 dark:text-emerald-400">{altDisplay.label}</span>
            </span>
          </p>
          {meetingTitle && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-1">
              &quot;{meetingTitle}&quot;
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Time Saved</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatHoursReclaimed(hoursSaved)}
            </p>
          </div>
          <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">People</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {participantCount}
            </p>
          </div>
        </div>

        {/* Total hours reclaimed */}
        {totalHoursReclaimed && totalHoursReclaimed > hoursSaved && (
          <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-700">
            <p className="text-center text-sm text-emerald-700 dark:text-emerald-300">
              <span className="font-bold">{formatHoursReclaimed(totalHoursReclaimed)}</span>
              {' '}total hours reclaimed by your team
            </p>
          </div>
        )}

        {/* Branding */}
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-emerald-600/70 dark:text-emerald-400/70">
          <Globe className="w-3 h-3" />
          <span>Powered by ClockAlign</span>
        </div>
      </div>

      {/* Mobile share button */}
      {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
        <Button
          className="w-full mt-3 md:hidden gap-2 bg-emerald-600 hover:bg-emerald-700"
          onClick={handleNativeShare}
        >
          <Share2 className="w-4 h-4" />
          Share This Win
        </Button>
      )}
    </motion.div>
  )
}

// ============================================
// COMPACT INLINE BADGE
// ============================================

export interface InlineMeetingAvoidedProps {
  hoursSaved: number
  className?: string
  onClick?: () => void
}

export function InlineMeetingAvoided({
  hoursSaved,
  className,
  onClick,
}: InlineMeetingAvoidedProps) {
  const handleShare = async () => {
    const text = `🎉 Meeting avoided! Saved ${formatHoursReclaimed(hoursSaved)} with async.\n\n💡 Not every sync needs a calendar invite.\n\nTrack your hours reclaimed at https://clockalign.app`

    if (navigator.share) {
      try {
        await navigator.share({
          text,
          url: 'https://clockalign.app',
        })
      } catch {
        await navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard!')
      }
    } else {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    }

    trackEvent(ANALYTICS_EVENTS.MEETING_AVOIDED_SHARED, {
      platform: 'inline',
      hours_saved: hoursSaved,
    })

    onClick?.()
  }

  return (
    <button
      onClick={handleShare}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full',
        'bg-gradient-to-r from-emerald-100 to-teal-100',
        'dark:from-emerald-900/30 dark:to-teal-900/30',
        'border border-emerald-300 dark:border-emerald-700',
        'hover:shadow-md transition-all',
        'group',
        className
      )}
    >
      <PartyPopper className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
        Meeting avoided
      </span>
      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
        {formatHoursReclaimed(hoursSaved)} saved
      </span>
      <Share2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
    </button>
  )
}
