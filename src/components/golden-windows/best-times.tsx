'use client'

/**
 * Best Times Summary Component
 * 
 * Displays top recommended meeting times with:
 * - Quality score and recommendation badge
 * - Per-participant breakdown with local times
 * - Visual indicators for energy levels
 */

import React from 'react'
import { cn } from '@/lib/utils'
import {
  BestTimeSlot,
  formatHour,
  getSharpnessEmoji,
  getQualityDescription
} from '@/lib/golden-windows'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Clock, Users, Zap, Crown, Star, ThumbsUp, Meh } from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface BestTimesProps {
  slots: BestTimeSlot[]
  /** Called when a time slot is selected */
  onSelectSlot?: (slot: BestTimeSlot) => void
  /** Currently selected slot (for highlighting) */
  selectedSlotHour?: number
  /** Show detailed participant breakdown */
  showDetails?: boolean
  /** Maximum slots to display */
  maxSlots?: number
  className?: string
}

interface SimpleBestTime {
  rank: number
  utcHour: number
  utcStartFormatted: string
  goldenScore: number
  qualityScore: number
  recommendation: 'excellent' | 'good' | 'acceptable' | 'poor'
  summary: string
  allAvailable: boolean
  participants: Array<{
    id: string
    name: string
    timezone: string
    localHour: number
    localTimeFormatted: string
    sharpness: number
    isAvailable: boolean
  }>
}

interface BestTimesSummaryProps {
  bestTimes: SimpleBestTime[]
  onSelectTime?: (time: SimpleBestTime) => void
  selectedHour?: number
  showDetails?: boolean
  maxSlots?: number
  className?: string
}

// ============================================
// BEST TIMES SUMMARY (API response format)
// ============================================

export function BestTimesSummary({
  bestTimes,
  onSelectTime,
  selectedHour,
  showDetails = true,
  maxSlots = 5,
  className
}: BestTimesSummaryProps) {
  const displaySlots = bestTimes.slice(0, maxSlots)
  
  if (displaySlots.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <Meh className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            No suitable meeting times found.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting participant availability or preferences.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <TooltipProvider delayDuration={200}>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Best Meeting Times
          </CardTitle>
          <CardDescription>
            Ranked by team energy alignment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {displaySlots.map((slot, index) => (
            <TimeSlotCard
              key={slot.utcHour}
              slot={slot}
              isTop={index === 0}
              isSelected={selectedHour === slot.utcHour}
              showDetails={showDetails}
              onClick={() => onSelectTime?.(slot)}
            />
          ))}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

// ============================================
// TIME SLOT CARD
// ============================================

interface TimeSlotCardProps {
  slot: SimpleBestTime
  isTop: boolean
  isSelected: boolean
  showDetails: boolean
  onClick?: () => void
}

function TimeSlotCard({
  slot,
  isTop,
  isSelected,
  showDetails,
  onClick
}: TimeSlotCardProps) {
  const recommendationConfig = getRecommendationConfig(slot.recommendation)
  
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg border transition-all',
        onClick && 'cursor-pointer hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50/50 dark:hover:bg-green-900/20',
        isSelected && 'border-green-500 bg-green-50 dark:bg-green-900/30',
        isTop && 'border-green-400 dark:border-green-600 bg-gradient-to-r from-green-50 to-yellow-50 dark:from-green-900/30 dark:to-yellow-900/20',
        !isTop && !isSelected && 'border-gray-200 dark:border-gray-700'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <RankBadge rank={slot.rank} />
          <div>
            <div className="font-semibold flex items-center gap-1">
              {slot.utcStartFormatted}
              {isTop && <Crown className="h-4 w-4 text-yellow-500" />}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={recommendationConfig.variant as 'default' | 'secondary' | 'outline' | 'destructive'} className={recommendationConfig.className}>
            {recommendationConfig.icon}
            {slot.qualityScore}%
          </Badge>
        </div>
      </div>
      
      {/* Summary */}
      <p className="text-sm text-muted-foreground mb-2">
        {slot.summary}
      </p>
      
      {/* Participant breakdown */}
      {showDetails && (
        <div className="flex flex-wrap gap-2 mt-2">
          {slot.participants.map(p => (
            <Tooltip key={p.id}>
              <TooltipTrigger asChild>
                <div className={cn(
                  'px-2 py-1 rounded-md text-xs flex items-center gap-1',
                  p.isAvailable
                    ? getSharpnessBackground(p.sharpness)
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                )}>
                  <span className="font-medium truncate max-w-[100px]">
                    {p.name}
                  </span>
                  <span>
                    {p.localTimeFormatted}
                  </span>
                  <span>
                    {getSharpnessEmoji(p.sharpness / 100)}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-muted-foreground">
                    {p.timezone}
                  </div>
                  <div className="mt-1">
                    {p.isAvailable ? (
                      <>Energy: {p.sharpness}%</>
                    ) : (
                      <span className="text-red-500">Unavailable</span>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-7 h-7 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
        <span className="text-lg">🥇</span>
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <span className="text-lg">🥈</span>
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
        <span className="text-lg">🥉</span>
      </div>
    )
  }
  return (
    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
      #{rank}
    </div>
  )
}

function getRecommendationConfig(recommendation: string) {
  switch (recommendation) {
    case 'excellent':
      return {
        variant: 'default',
        className: 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700',
        icon: <Star className="h-3 w-3 mr-1" />
      }
    case 'good':
      return {
        variant: 'secondary',
        className: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60',
        icon: <ThumbsUp className="h-3 w-3 mr-1" />
      }
    case 'acceptable':
      return {
        variant: 'outline',
        className: 'border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400',
        icon: null
      }
    default:
      return {
        variant: 'outline',
        className: 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400',
        icon: null
      }
  }
}

function getSharpnessBackground(sharpness: number): string {
  if (sharpness >= 90) return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
  if (sharpness >= 70) return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
  if (sharpness >= 50) return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
  return 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
}

// ============================================
// SIMPLE BEST TIMES LIST (compact version)
// ============================================

interface BestTimesListProps {
  slots: Array<{
    rank: number
    utcHour: number
    goldenScore: number
    recommendation: string
    allAvailable: boolean
  }>
  onSelect?: (hour: number) => void
  selectedHour?: number
  className?: string
}

export function BestTimesList({
  slots,
  onSelect,
  selectedHour,
  className
}: BestTimesListProps) {
  if (slots.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground text-center py-4', className)}>
        No available time slots found
      </div>
    )
  }
  
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {slots.map(slot => (
        <button
          key={slot.utcHour}
          onClick={() => onSelect?.(slot.utcHour)}
          className={cn(
            'px-3 py-2 rounded-lg border text-sm transition-all',
            'flex items-center gap-2',
            selectedHour === slot.utcHour
              ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
              : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600',
            slot.recommendation === 'excellent' && 'ring-1 ring-green-400 dark:ring-green-500'
          )}
        >
          <span className="font-medium">
            {formatHour(slot.utcHour)}
          </span>
          <span className={cn(
            'text-xs',
            slot.goldenScore >= 80 ? 'text-green-600 dark:text-green-400' :
            slot.goldenScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400'
          )}>
            {slot.goldenScore}%
          </span>
          {slot.rank === 1 && <Crown className="h-3 w-3 text-yellow-500" />}
        </button>
      ))}
    </div>
  )
}

// ============================================
// GOLDEN WINDOW STATS
// ============================================

interface GoldenWindowsStatsProps {
  participantCount: number
  timezoneCount: number
  availableSlots: number
  bestScore: number
  className?: string
}

export function GoldenWindowsStats({
  participantCount,
  timezoneCount,
  availableSlots,
  bestScore,
  className
}: GoldenWindowsStatsProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      <StatCard
        icon={<Users className="h-4 w-4" />}
        label="Participants"
        value={participantCount}
      />
      <StatCard
        icon={<Clock className="h-4 w-4" />}
        label="Timezones"
        value={timezoneCount}
      />
      <StatCard
        icon={<Zap className="h-4 w-4" />}
        label="Available Slots"
        value={availableSlots}
      />
      <StatCard
        icon={<Star className="h-4 w-4" />}
        label="Best Score"
        value={`${bestScore}%`}
        highlight
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  highlight
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div className={cn(
      'p-3 rounded-lg border',
      highlight ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30' : 'border-gray-200 dark:border-gray-700'
    )}>
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className={cn(
        'text-xl font-semibold',
        highlight && 'text-green-700 dark:text-green-400'
      )}>
        {value}
      </div>
    </div>
  )
}

export default BestTimesSummary
