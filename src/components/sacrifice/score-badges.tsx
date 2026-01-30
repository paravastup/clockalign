'use client'

/**
 * Score Badges & Indicators
 * CA-028: Visual badges and indicators for sacrifice scores
 */

import { Badge } from '@/components/ui/badge'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { 
  getCategoryColor, 
  getImpactEmoji,
  getFairnessStatusBadge,
  formatPoints,
  type SacrificeCategory,
  type LeaderboardEntry,
} from '@/lib/sacrifice-score'
import { 
  Flame, 
  Snowflake, 
  AlertTriangle, 
  Award,
  Zap,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Coffee,
  Clock,
  Shield,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// SCORE BADGE
// ============================================

interface ScoreBadgeProps {
  points: number
  category: SacrificeCategory
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ScoreBadge({ 
  points, 
  category, 
  showLabel = false,
  size = 'md',
  className,
}: ScoreBadgeProps) {
  const colors = getCategoryColor(category)
  const emoji = getImpactEmoji(categoryToImpact(category))
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full font-semibold',
              colors.bg,
              colors.text,
              colors.border,
              'border',
              sizeClasses[size],
              className
            )}
          >
            <span>{emoji}</span>
            <span>{formatPoints(points)} pts</span>
            {showLabel && (
              <span className="opacity-75">({formatCategory(category)})</span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{formatCategory(category)}</p>
          <p className="text-xs text-muted-foreground">
            {getCategoryDescription(category)}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================
// CATEGORY INDICATOR
// ============================================

interface CategoryIndicatorProps {
  category: SacrificeCategory
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CategoryIndicator({
  category,
  showLabel = true,
  size = 'md',
  className,
}: CategoryIndicatorProps) {
  const Icon = getCategoryIcon(category)
  const colors = getCategoryColor(category)
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }
  
  return (
    <span className={cn('inline-flex items-center gap-1.5', colors.text, className)}>
      <Icon className={iconSizes[size]} />
      {showLabel && (
        <span className={textSizes[size]}>{formatCategory(category)}</span>
      )}
    </span>
  )
}

// ============================================
// IMPACT METER
// ============================================

interface ImpactMeterProps {
  points: number
  maxPoints?: number
  showLabel?: boolean
  className?: string
}

export function ImpactMeter({
  points,
  maxPoints = 10,
  showLabel = true,
  className,
}: ImpactMeterProps) {
  const percentage = Math.min((points / maxPoints) * 100, 100)
  
  // Determine color based on percentage
  const getColor = () => {
    if (percentage <= 20) return 'bg-green-500'
    if (percentage <= 40) return 'bg-yellow-500'
    if (percentage <= 60) return 'bg-orange-500'
    if (percentage <= 80) return 'bg-red-500'
    return 'bg-purple-600'
  }
  
  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Impact</span>
          <span>{formatPoints(points)} / {maxPoints}</span>
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all', getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// ============================================
// FAIRNESS BADGE
// ============================================

interface FairnessBadgeProps {
  status: LeaderboardEntry['fairnessStatus']
  multiplier?: number
  className?: string
}

export function FairnessBadge({ status, multiplier, className }: FairnessBadgeProps) {
  const badge = getFairnessStatusBadge(status)
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={badge.variant} className={className}>
            {badge.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{getFairnessTitle(status)}</p>
          <p className="text-xs text-muted-foreground">
            {getFairnessDescription(status, multiplier)}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================
// STREAK INDICATOR
// ============================================

interface StreakIndicatorProps {
  type: 'hot' | 'cold'
  count: number
  className?: string
}

export function StreakIndicator({ type, count, className }: StreakIndicatorProps) {
  if (count < 3) return null
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center gap-1 text-sm font-medium',
              type === 'hot' ? 'text-red-500' : 'text-blue-500',
              className
            )}
          >
            {type === 'hot' ? (
              <Flame className="h-4 w-4" />
            ) : (
              <Snowflake className="h-4 w-4" />
            )}
            {count} day streak
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {type === 'hot' 
            ? `${count} consecutive days of high sacrifice!`
            : `${count} consecutive days of no meetings 🎉`
          }
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================
// ACHIEVEMENT BADGES
// ============================================

type Achievement = 
  | 'early_bird'       // 10+ early morning meetings
  | 'night_owl'        // 10+ late night meetings
  | 'team_player'      // Top 3 in team sacrifice
  | 'fair_scheduler'   // 90%+ meetings in golden hours
  | 'marathon'         // 5+ hours of meetings in one day
  | 'survivor'         // 50+ graveyard points lifetime
  | 'protector'        // Helped reduce team imbalance

interface AchievementBadgeProps {
  achievement: Achievement
  earned?: boolean
  count?: number
  className?: string
}

export function AchievementBadge({ 
  achievement, 
  earned = true,
  count,
  className,
}: AchievementBadgeProps) {
  const config = getAchievementConfig(achievement)
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm border',
              earned 
                ? config.colors 
                : 'bg-muted text-muted-foreground border-muted',
              !earned && 'opacity-50',
              className
            )}
          >
            <config.icon className="h-4 w-4" />
            <span>{config.label}</span>
            {count && <span className="text-xs opacity-75">×{count}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{config.title}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================
// QUICK SCORE INDICATOR (for inline use)
// ============================================

interface QuickScoreProps {
  points: number
  className?: string
}

export function QuickScore({ points, className }: QuickScoreProps) {
  const getColor = () => {
    if (points <= 1) return 'text-green-600'
    if (points <= 3) return 'text-yellow-600'
    if (points <= 5) return 'text-orange-600'
    if (points <= 7) return 'text-red-600'
    return 'text-purple-700'
  }
  
  return (
    <span className={cn('font-semibold', getColor(), className)}>
      {formatPoints(points)} pts
    </span>
  )
}

// ============================================
// PARTICIPANT SCORE CARD
// ============================================

interface ParticipantScoreCardProps {
  name: string
  email: string
  timezone: string
  localTime: string
  points: number
  category: SacrificeCategory
  isOrganizer?: boolean
  className?: string
}

export function ParticipantScoreCard({
  name,
  email,
  timezone,
  localTime,
  points,
  category,
  isOrganizer = false,
  className,
}: ParticipantScoreCardProps) {
  const colors = getCategoryColor(category)
  
  return (
    <div
      className={cn(
        'p-3 rounded-lg border',
        colors.bg,
        colors.border,
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium">{name || email}</p>
          <p className="text-xs text-muted-foreground">{timezone}</p>
        </div>
        <ScoreBadge points={points} category={category} size="sm" />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {localTime}
        </span>
        <CategoryIndicator category={category} size="sm" />
      </div>
      {isOrganizer && (
        <Badge variant="outline" className="mt-2 text-xs">
          <Shield className="h-3 w-3 mr-1" />
          Organizer
        </Badge>
      )}
    </div>
  )
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function categoryToImpact(category: SacrificeCategory): string {
  const map: Record<SacrificeCategory, string> = {
    golden: 'minimal',
    good: 'minimal',
    acceptable: 'low',
    early_morning: 'medium',
    evening: 'medium',
    late_evening: 'high',
    night: 'severe',
    late_night: 'severe',
    graveyard: 'extreme',
  }
  return map[category]
}

function formatCategory(category: SacrificeCategory): string {
  return category
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function getCategoryDescription(category: SacrificeCategory): string {
  const descriptions: Record<SacrificeCategory, string> = {
    golden: 'Peak productivity hours (10 AM - 4 PM)',
    good: 'Good working hours',
    acceptable: 'Edge of normal working hours',
    early_morning: 'Early morning (7-8 AM) - may affect sleep',
    evening: 'Evening hours (6-8 PM) - personal time',
    late_evening: 'Late evening (8-9 PM) - family time',
    night: 'Night hours (9-10 PM) - significant disruption',
    late_night: 'Late night (10-11 PM) - severe impact',
    graveyard: 'Graveyard shift (11 PM - 7 AM) - career damage territory',
  }
  return descriptions[category]
}

function getCategoryIcon(category: SacrificeCategory) {
  const icons: Record<SacrificeCategory, any> = {
    golden: Sun,
    good: Sunrise,
    acceptable: Coffee,
    early_morning: Sunrise,
    evening: Sunset,
    late_evening: Sunset,
    night: Moon,
    late_night: Moon,
    graveyard: Moon,
  }
  return icons[category]
}

function getFairnessTitle(status: LeaderboardEntry['fairnessStatus']): string {
  const titles: Record<LeaderboardEntry['fairnessStatus'], string> = {
    balanced: 'Balanced',
    above_average: 'Above Average Sacrifice',
    high_sacrifice: 'High Sacrifice Load',
    critical: 'Critical Imbalance',
  }
  return titles[status]
}

function getFairnessDescription(
  status: LeaderboardEntry['fairnessStatus'],
  multiplier?: number
): string {
  const descriptions: Record<LeaderboardEntry['fairnessStatus'], string> = {
    balanced: 'Sacrifice is evenly distributed',
    above_average: `Taking ${multiplier || 1.5}x the team average`,
    high_sacrifice: `Taking ${multiplier || 2}x the team average - consider rotating`,
    critical: `Taking ${multiplier || 3}x+ the team average - immediate action needed`,
  }
  return descriptions[status]
}

function getAchievementConfig(achievement: Achievement) {
  const configs: Record<Achievement, {
    icon: any
    label: string
    title: string
    description: string
    colors: string
  }> = {
    early_bird: {
      icon: Sunrise,
      label: 'Early Bird',
      title: 'Early Bird Award',
      description: '10+ early morning meetings taken for the team',
      colors: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    },
    night_owl: {
      icon: Moon,
      label: 'Night Owl',
      title: 'Night Owl Award',
      description: '10+ late night meetings taken for the team',
      colors: 'bg-purple-100 text-purple-700 border-purple-300',
    },
    team_player: {
      icon: Award,
      label: 'Team Player',
      title: 'Team Player Award',
      description: 'Top 3 in team sacrifice score',
      colors: 'bg-blue-100 text-blue-700 border-blue-300',
    },
    fair_scheduler: {
      icon: Target,
      label: 'Fair Scheduler',
      title: 'Fair Scheduler Award',
      description: '90%+ of your meetings are in golden hours',
      colors: 'bg-green-100 text-green-700 border-green-300',
    },
    marathon: {
      icon: Zap,
      label: 'Marathon',
      title: 'Meeting Marathon',
      description: '5+ hours of meetings in a single day',
      colors: 'bg-orange-100 text-orange-700 border-orange-300',
    },
    survivor: {
      icon: Shield,
      label: 'Survivor',
      title: 'Graveyard Survivor',
      description: '50+ lifetime graveyard points',
      colors: 'bg-red-100 text-red-700 border-red-300',
    },
    protector: {
      icon: Shield,
      label: 'Protector',
      title: 'Team Protector',
      description: 'Helped reduce team imbalance by taking bad slots',
      colors: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    },
  }
  return configs[achievement]
}
