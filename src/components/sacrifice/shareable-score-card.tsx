'use client'

/**
 * Shareable Sacrifice Score Card
 * CA-GTM: Branded shareable cards for viral marketing
 *
 * Generates visually appealing cards showing sacrifice scores
 * that users can share to Twitter, LinkedIn, or copy to clipboard.
 */

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2,
  Copy,
  Twitter,
  Linkedin,
  Check,
  Download,
  Clock,
  Globe,
  Sparkles,
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
import {
  formatPoints,
  getCategoryColor,
  type SacrificeCategory
} from '@/lib/sacrifice-score'

// ============================================
// TYPES
// ============================================

export interface ParticipantScore {
  id: string
  name: string
  city: string
  flag: string
  timezone: string
  localTime: string
  points: number
  category: SacrificeCategory
}

export interface ShareableScoreCardProps {
  title?: string
  subtitle?: string
  participants: ParticipantScore[]
  totalScore: number
  fairnessIndex: number
  meetingDuration?: string
  className?: string
  variant?: 'compact' | 'full'
  onShare?: (platform: 'twitter' | 'linkedin' | 'clipboard') => void
}

// ============================================
// SCORE CARD COMPONENT
// ============================================

export function ShareableScoreCard({
  title = 'Meeting Sacrifice Score',
  subtitle,
  participants,
  totalScore,
  fairnessIndex,
  meetingDuration,
  className,
  variant = 'full',
  onShare,
}: ShareableScoreCardProps) {
  const [copied, setCopied] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Sort participants by score (highest sacrifice first)
  const sortedParticipants = [...participants].sort((a, b) => b.points - a.points)
  const topSacrificer = sortedParticipants[0]

  // Generate share text
  const generateShareText = () => {
    const lines = sortedParticipants.map(p =>
      `${p.flag} ${p.name}: ${formatPoints(p.points)}pts`
    )

    const text = [
      `🏆 ${title}`,
      subtitle ? `📅 ${subtitle}` : null,
      meetingDuration ? `⏱️ Duration: ${meetingDuration}` : null,
      '',
      ...lines,
      '',
      `📊 Total: ${formatPoints(totalScore)}pts | Fairness: ${Math.round(fairnessIndex * 100)}%`,
      '',
      '⚡ Powered by ClockAlign - Fair meetings for global teams',
      'https://clockalign.app',
    ].filter(Boolean).join('\n')

    return text
  }

  // Generate tweet text (with character limit consideration)
  const generateTweetText = () => {
    const participantSummary = sortedParticipants
      .slice(0, 3)
      .map(p => `${p.flag}${formatPoints(p.points)}pts`)
      .join(' | ')

    const text = [
      `🏆 Meeting sacrifice: ${participantSummary}`,
      '',
      topSacrificer
        ? `${topSacrificer.name} took the biggest hit!`
        : '',
      '',
      'Track meeting fairness at @clockalign',
    ].filter(Boolean).join('\n')

    return text
  }

  const handleCopyToClipboard = async () => {
    const text = generateShareText()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard!')

    trackEvent('score_card_shared', {
      platform: 'clipboard',
      participant_count: participants.length,
      total_score: totalScore,
    })

    onShare?.('clipboard')
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(generateTweetText())
    const url = encodeURIComponent('https://clockalign.app/calculator')
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
      'width=550,height=420'
    )

    trackEvent('score_card_shared', {
      platform: 'twitter',
      participant_count: participants.length,
      total_score: totalScore,
    })

    onShare?.('twitter')
  }

  const handleShareLinkedIn = () => {
    const text = encodeURIComponent(generateShareText())
    const url = encodeURIComponent('https://clockalign.app/calculator')
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      '_blank',
      'width=550,height=420'
    )

    trackEvent('score_card_shared', {
      platform: 'linkedin',
      participant_count: participants.length,
      total_score: totalScore,
    })

    onShare?.('linkedin')
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ClockAlign - Meeting Sacrifice Score',
          text: generateShareText(),
          url: 'https://clockalign.app/calculator',
        })

        trackEvent('score_card_shared', {
          platform: 'native',
          participant_count: participants.length,
          total_score: totalScore,
        })
      } catch {
        // User cancelled or share failed, fallback to copy
        handleCopyToClipboard()
      }
    } else {
      handleCopyToClipboard()
    }
  }

  // Determine fairness color
  const getFairnessColor = () => {
    if (fairnessIndex >= 0.8) return 'text-emerald-600 dark:text-emerald-400'
    if (fairnessIndex >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    if (fairnessIndex >= 0.4) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className={cn('relative', className)}>
      {/* The Visual Card */}
      <div
        ref={cardRef}
        className={cn(
          'rounded-2xl overflow-hidden',
          'bg-gradient-to-br from-slate-50 via-white to-slate-100',
          'dark:from-slate-900 dark:via-slate-800 dark:to-slate-900',
          'border border-slate-200 dark:border-slate-700',
          'shadow-lg',
          variant === 'compact' ? 'p-4' : 'p-6'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {meetingDuration && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <Clock className="w-4 h-4" />
              {meetingDuration}
            </div>
          )}
        </div>

        {/* Participant Scores */}
        <div className={cn(
          'space-y-2',
          variant === 'compact' ? 'mb-3' : 'mb-4'
        )}>
          {sortedParticipants.map((participant, index) => {
            const colors = getCategoryColor(participant.category)
            const isTopSacrificer = index === 0 && participant.points > 0

            return (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl',
                  'bg-white dark:bg-slate-800',
                  'border',
                  isTopSacrificer
                    ? 'border-amber-300 dark:border-amber-600 ring-1 ring-amber-200 dark:ring-amber-800'
                    : 'border-slate-200 dark:border-slate-700'
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Trophy for top sacrificer */}
                  {isTopSacrificer && (
                    <span className="text-lg">🏆</span>
                  )}
                  <span className="text-2xl">{participant.flag}</span>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {participant.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {participant.localTime} • {participant.city}
                    </p>
                  </div>
                </div>

                <div className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-bold',
                  colors.bg,
                  colors.text,
                  colors.border,
                  'border'
                )}>
                  {formatPoints(participant.points)}pts
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Summary Row */}
        <div className={cn(
          'flex items-center justify-between',
          'pt-3 border-t border-slate-200 dark:border-slate-700'
        )}>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Score
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {formatPoints(totalScore)} pts
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Fairness
              </p>
              <p className={cn('text-xl font-bold', getFairnessColor())}>
                {Math.round(fairnessIndex * 100)}%
              </p>
            </div>
          </div>

          {/* Branding */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Globe className="w-3 h-3" />
            <span>clockalign.app</span>
          </div>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="mt-4 flex items-center gap-2 justify-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share Score Card
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="center">
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

        {/* Mobile: Direct share button */}
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <Button
            variant="default"
            size="sm"
            className="gap-2 md:hidden"
            onClick={handleNativeShare}
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================
// COMPACT INLINE SCORE CARD (for embedding)
// ============================================

export interface InlineScoreCardProps {
  participants: ParticipantScore[]
  totalScore: number
  className?: string
}

export function InlineScoreCard({
  participants,
  totalScore,
  className,
}: InlineScoreCardProps) {
  const sortedParticipants = [...participants].sort((a, b) => b.points - a.points)

  const handleShare = async () => {
    const text = sortedParticipants
      .map(p => `${p.flag} ${p.name}: ${formatPoints(p.points)}pts`)
      .join(' | ')

    const shareText = `🏆 Meeting sacrifice: ${text} | Total: ${formatPoints(totalScore)}pts\n\nPowered by ClockAlign`

    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText,
          url: 'https://clockalign.app',
        })
      } catch {
        await navigator.clipboard.writeText(shareText)
        toast.success('Copied to clipboard!')
      }
    } else {
      await navigator.clipboard.writeText(shareText)
      toast.success('Copied to clipboard!')
    }

    trackEvent('score_card_shared', {
      platform: 'inline',
      participant_count: participants.length,
      total_score: totalScore,
    })
  }

  return (
    <button
      onClick={handleShare}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full',
        'bg-gradient-to-r from-amber-50 to-orange-50',
        'dark:from-amber-900/20 dark:to-orange-900/20',
        'border border-amber-200 dark:border-amber-800',
        'hover:shadow-md transition-all',
        'group',
        className
      )}
    >
      <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
        {sortedParticipants.slice(0, 3).map(p => (
          <span key={p.id} className="mr-2">
            {p.flag} {formatPoints(p.points)}pts
          </span>
        ))}
      </span>
      <Share2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
      <span className="text-xs text-amber-600/70 dark:text-amber-400/70">
        ClockAlign
      </span>
    </button>
  )
}
