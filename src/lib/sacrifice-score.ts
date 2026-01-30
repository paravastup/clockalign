/**
 * Sacrifice Score™ - Pain Weight Algorithm & Score Calculation Service
 * 
 * The Sacrifice Score quantifies the "pain" of meeting at inconvenient times.
 * It promotes fairness by making the cost of bad meeting times visible.
 * 
 * Pain weights are based on research into cognitive performance and
 * work-life balance impact at different hours.
 */

import { DateTime } from 'luxon'
import { Tables } from '@/types/database'

// ============================================
// TYPES
// ============================================

export type SacrificeCategory = 
  | 'golden'         // 10 AM - 4 PM: 1 pt (peak productivity)
  | 'good'           // 9 AM - 10 AM, 4 PM - 5 PM: 1.5 pts
  | 'acceptable'     // 8 AM - 9 AM, 5 PM - 6 PM: 2 pts
  | 'early_morning'  // 7 AM - 8 AM: 3 pts (sleep disruption)
  | 'evening'        // 6 PM - 8 PM: 3 pts (personal time)
  | 'late_evening'   // 8 PM - 9 PM: 4 pts (family time)
  | 'night'          // 9 PM - 10 PM: 5 pts (significant sacrifice)
  | 'late_night'     // 10 PM - 11 PM: 6 pts (severe impact)
  | 'graveyard'      // 11 PM - 7 AM: 10 pts (career damage territory)

export interface PainWeightResult {
  basePoints: number
  category: SacrificeCategory
  hourDescription: string
  impactLevel: 'minimal' | 'low' | 'medium' | 'high' | 'severe' | 'extreme'
}

export interface SacrificeScoreInput {
  localHour: number
  durationMinutes?: number
  isRecurring?: boolean
  isOrganizer?: boolean
  customMultiplier?: number
}

export interface SacrificeScoreResult {
  points: number
  basePoints: number
  category: SacrificeCategory
  impactLevel: string
  multipliers: {
    duration: number
    recurring: number
    organizer: number
    custom: number
    total: number
  }
  breakdown: string
}

export interface TeamMemberScore {
  userId: string
  userName: string | null
  userEmail: string
  timezone: string
  totalPoints: number
  meetingCount: number
  averagePerMeeting: number
  worstSlotCount: {
    graveyard: number
    lateNight: number
    night: number
    earlyMorning: number
  }
  trend: 'up' | 'down' | 'stable'
  trendPercent: number
}

export interface LeaderboardEntry extends TeamMemberScore {
  rank: number
  percentOfTotal: number
  fairnessStatus: 'balanced' | 'above_average' | 'high_sacrifice' | 'critical'
}

export interface ScoreHistoryEntry {
  date: string
  points: number
  meetingCount: number
  categories: Record<SacrificeCategory, number>
}

// ============================================
// PAIN WEIGHT ALGORITHM (CA-021)
// ============================================

/**
 * Pain weight mappings by hour
 * 
 * Based on:
 * - Circadian rhythm research
 * - Work-life balance impact studies
 * - User feedback and intuition
 */
const PAIN_WEIGHTS: Record<number, { points: number; category: SacrificeCategory }> = {
  // Graveyard hours (11 PM - 6 AM): Extreme sacrifice
  0: { points: 10, category: 'graveyard' },
  1: { points: 10, category: 'graveyard' },
  2: { points: 10, category: 'graveyard' },
  3: { points: 10, category: 'graveyard' },
  4: { points: 10, category: 'graveyard' },
  5: { points: 10, category: 'graveyard' },
  6: { points: 10, category: 'graveyard' },
  
  // Early morning (7 AM - 8 AM): Moderate sacrifice
  7: { points: 3, category: 'early_morning' },
  
  // Acceptable (8 AM - 9 AM): Low sacrifice
  8: { points: 2, category: 'acceptable' },
  
  // Good (9 AM - 10 AM): Minimal sacrifice
  9: { points: 1.5, category: 'good' },
  
  // Golden hours (10 AM - 4 PM): Minimal sacrifice - peak productivity
  10: { points: 1, category: 'golden' },
  11: { points: 1, category: 'golden' },
  12: { points: 1, category: 'golden' },
  13: { points: 1, category: 'golden' },
  14: { points: 1, category: 'golden' },
  15: { points: 1, category: 'golden' },
  
  // Good (4 PM - 5 PM): Minimal sacrifice
  16: { points: 1.5, category: 'good' },
  
  // Acceptable (5 PM - 6 PM): Low sacrifice
  17: { points: 2, category: 'acceptable' },
  
  // Evening (6 PM - 8 PM): Moderate sacrifice - personal time
  18: { points: 3, category: 'evening' },
  19: { points: 3, category: 'evening' },
  
  // Late evening (8 PM - 9 PM): High sacrifice - family time
  20: { points: 4, category: 'late_evening' },
  
  // Night (9 PM - 10 PM): Severe sacrifice
  21: { points: 5, category: 'night' },
  
  // Late night (10 PM - 11 PM): Very severe sacrifice
  22: { points: 6, category: 'late_night' },
  
  // Pre-midnight graveyard
  23: { points: 10, category: 'graveyard' },
}

const IMPACT_LEVELS: Record<SacrificeCategory, PainWeightResult['impactLevel']> = {
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

const HOUR_DESCRIPTIONS: Record<SacrificeCategory, string> = {
  golden: 'Peak productivity hours',
  good: 'Good working hours',
  acceptable: 'Edge of working hours',
  early_morning: 'Early morning (sleep impact)',
  evening: 'Evening (personal time)',
  late_evening: 'Late evening (family time)',
  night: 'Night hours (significant disruption)',
  late_night: 'Late night (severe impact)',
  graveyard: 'Graveyard shift (career damage)',
}

/**
 * Get pain weight for a specific hour
 * This is the core algorithm that determines how "painful" a meeting time is
 */
export function getPainWeight(hour: number): PainWeightResult {
  // Normalize hour to 0-23
  const normalizedHour = ((hour % 24) + 24) % 24
  const weight = PAIN_WEIGHTS[normalizedHour]
  
  return {
    basePoints: weight.points,
    category: weight.category,
    hourDescription: HOUR_DESCRIPTIONS[weight.category],
    impactLevel: IMPACT_LEVELS[weight.category],
  }
}

/**
 * Get all pain weights as a lookup table
 * Useful for visualizations and debugging
 */
export function getPainWeightTable(): Map<number, PainWeightResult> {
  const table = new Map<number, PainWeightResult>()
  for (let hour = 0; hour < 24; hour++) {
    table.set(hour, getPainWeight(hour))
  }
  return table
}

// ============================================
// SCORE CALCULATION SERVICE (CA-022)
// ============================================

/**
 * Calculate the full sacrifice score for a meeting slot
 * 
 * The formula is:
 * score = basePoints × durationMultiplier × recurringMultiplier × organizerMultiplier × customMultiplier
 * 
 * @param input - Score calculation parameters
 * @returns Full score result with breakdown
 */
export function calculateSacrificeScore(input: SacrificeScoreInput): SacrificeScoreResult {
  const {
    localHour,
    durationMinutes = 30,
    isRecurring = false,
    isOrganizer = false,
    customMultiplier = 1,
  } = input
  
  const painWeight = getPainWeight(localHour)
  
  // Calculate multipliers
  const durationMultiplier = durationMinutes / 30 // 30 min is baseline
  const recurringMultiplier = isRecurring ? 1.5 : 1 // Recurring meetings hurt more
  const organizerMultiplier = isOrganizer ? 0.8 : 1 // Organizers chose this, slight discount
  
  const totalMultiplier = durationMultiplier * recurringMultiplier * organizerMultiplier * customMultiplier
  
  // Calculate final points (round to 1 decimal)
  const points = Math.round(painWeight.basePoints * totalMultiplier * 10) / 10
  
  // Build breakdown string
  const breakdownParts: string[] = [`Base: ${painWeight.basePoints} pts (${painWeight.category})`]
  if (durationMultiplier !== 1) {
    breakdownParts.push(`Duration: ×${durationMultiplier.toFixed(1)} (${durationMinutes} min)`)
  }
  if (isRecurring) {
    breakdownParts.push(`Recurring: ×1.5`)
  }
  if (isOrganizer) {
    breakdownParts.push(`Organizer: ×0.8`)
  }
  if (customMultiplier !== 1) {
    breakdownParts.push(`Custom: ×${customMultiplier}`)
  }
  
  return {
    points,
    basePoints: painWeight.basePoints,
    category: painWeight.category,
    impactLevel: painWeight.impactLevel,
    multipliers: {
      duration: durationMultiplier,
      recurring: recurringMultiplier,
      organizer: organizerMultiplier,
      custom: customMultiplier,
      total: totalMultiplier,
    },
    breakdown: breakdownParts.join(' → '),
  }
}

/**
 * Calculate sacrifice score for a meeting slot in a specific timezone
 * 
 * @param utcTime - Meeting time in UTC
 * @param timezone - Participant's timezone
 * @param options - Additional calculation options
 */
export function calculateScoreForTimezone(
  utcTime: string | Date | DateTime,
  timezone: string,
  options: Omit<SacrificeScoreInput, 'localHour'> = {}
): SacrificeScoreResult {
  const dt = DateTime.isDateTime(utcTime) 
    ? utcTime 
    : DateTime.fromISO(typeof utcTime === 'string' ? utcTime : utcTime.toISOString())
  
  const localTime = dt.setZone(timezone)
  const localHour = localTime.hour
  
  return calculateSacrificeScore({
    ...options,
    localHour,
  })
}

/**
 * Calculate total sacrifice for all participants in a meeting
 */
export function calculateMeetingTotalSacrifice(
  participantScores: SacrificeScoreResult[]
): {
  totalPoints: number
  averagePoints: number
  maxPoints: number
  fairnessIndex: number // 0-1, higher is more fair (even distribution)
  imbalanceWarning: string | null
} {
  if (participantScores.length === 0) {
    return {
      totalPoints: 0,
      averagePoints: 0,
      maxPoints: 0,
      fairnessIndex: 1,
      imbalanceWarning: null,
    }
  }
  
  const points = participantScores.map(s => s.points)
  const totalPoints = points.reduce((a, b) => a + b, 0)
  const averagePoints = totalPoints / points.length
  const maxPoints = Math.max(...points)
  
  // Calculate fairness index using coefficient of variation
  // Lower CV = more even distribution = higher fairness
  const variance = points.reduce((sum, p) => sum + Math.pow(p - averagePoints, 2), 0) / points.length
  const stdDev = Math.sqrt(variance)
  const cv = averagePoints > 0 ? stdDev / averagePoints : 0
  const fairnessIndex = Math.max(0, 1 - cv)
  
  // Check for imbalance
  let imbalanceWarning: string | null = null
  if (maxPoints > averagePoints * 2 && maxPoints >= 4) {
    const worstOffIndex = points.indexOf(maxPoints)
    imbalanceWarning = `Participant ${worstOffIndex + 1} is taking ${Math.round(maxPoints / averagePoints)}x the average sacrifice`
  }
  
  return {
    totalPoints: Math.round(totalPoints * 10) / 10,
    averagePoints: Math.round(averagePoints * 10) / 10,
    maxPoints: Math.round(maxPoints * 10) / 10,
    fairnessIndex: Math.round(fairnessIndex * 100) / 100,
    imbalanceWarning,
  }
}

// ============================================
// LEADERBOARD CALCULATIONS
// ============================================

/**
 * Calculate leaderboard rankings for a team
 * 
 * @param scores - Raw score data from database
 * @param users - User information for names
 * @param previousPeriodScores - Scores from previous period for trend calculation
 */
export function calculateLeaderboard(
  scores: Array<{
    userId: string
    points: number
    category: string
    meetingSlotId: string
  }>,
  users: Map<string, { name: string | null; email: string; timezone: string }>,
  previousPeriodScores?: Map<string, number>
): LeaderboardEntry[] {
  // Aggregate scores by user
  const userScores = new Map<string, {
    totalPoints: number
    meetingCount: number
    categoryBreakdown: Record<string, number>
    slots: Set<string>
  }>()
  
  for (const score of scores) {
    const existing = userScores.get(score.userId) || {
      totalPoints: 0,
      meetingCount: 0,
      categoryBreakdown: {},
      slots: new Set<string>(),
    }
    
    existing.totalPoints += score.points
    if (!existing.slots.has(score.meetingSlotId)) {
      existing.slots.add(score.meetingSlotId)
      existing.meetingCount++
    }
    existing.categoryBreakdown[score.category] = 
      (existing.categoryBreakdown[score.category] || 0) + 1
    
    userScores.set(score.userId, existing)
  }
  
  // Calculate total points for percentage calculation
  const grandTotal = Array.from(userScores.values())
    .reduce((sum, s) => sum + s.totalPoints, 0)
  
  const averagePoints = grandTotal / Math.max(userScores.size, 1)
  
  // Build entries
  const entries: TeamMemberScore[] = []
  
  for (const [userId, data] of userScores) {
    const user = users.get(userId)
    
    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable'
    let trendPercent = 0
    
    if (previousPeriodScores) {
      const prevScore = previousPeriodScores.get(userId) || 0
      if (prevScore > 0) {
        trendPercent = ((data.totalPoints - prevScore) / prevScore) * 100
        if (trendPercent > 10) trend = 'up'
        else if (trendPercent < -10) trend = 'down'
      } else if (data.totalPoints > 0) {
        trend = 'up'
        trendPercent = 100
      }
    }
    
    entries.push({
      userId,
      userName: user?.name || null,
      userEmail: user?.email || 'Unknown',
      timezone: user?.timezone || 'UTC',
      totalPoints: Math.round(data.totalPoints * 10) / 10,
      meetingCount: data.meetingCount,
      averagePerMeeting: data.meetingCount > 0 
        ? Math.round((data.totalPoints / data.meetingCount) * 10) / 10 
        : 0,
      worstSlotCount: {
        graveyard: data.categoryBreakdown['graveyard'] || 0,
        lateNight: data.categoryBreakdown['late_night'] || 0,
        night: data.categoryBreakdown['night'] || 0,
        earlyMorning: data.categoryBreakdown['early_morning'] || 0,
      },
      trend,
      trendPercent: Math.round(trendPercent),
    })
  }
  
  // Sort by total points (descending - most sacrifice first)
  entries.sort((a, b) => b.totalPoints - a.totalPoints)
  
  // Add rankings and percentages
  return entries.map((entry, index) => {
    const percentOfTotal = grandTotal > 0 
      ? Math.round((entry.totalPoints / grandTotal) * 100) 
      : 0
    
    // Determine fairness status
    let fairnessStatus: LeaderboardEntry['fairnessStatus'] = 'balanced'
    if (entry.totalPoints > averagePoints * 3) {
      fairnessStatus = 'critical'
    } else if (entry.totalPoints > averagePoints * 2) {
      fairnessStatus = 'high_sacrifice'
    } else if (entry.totalPoints > averagePoints * 1.3) {
      fairnessStatus = 'above_average'
    }
    
    return {
      ...entry,
      rank: index + 1,
      percentOfTotal,
      fairnessStatus,
    }
  })
}

// ============================================
// SCORE HISTORY
// ============================================

/**
 * Aggregate scores into daily buckets for charting
 */
export function aggregateScoreHistory(
  scores: Array<{
    calculatedAt: string
    points: number
    category: string
  }>,
  days: number = 30
): ScoreHistoryEntry[] {
  const now = DateTime.now()
  const startDate = now.minus({ days })
  
  // Initialize buckets
  const buckets = new Map<string, ScoreHistoryEntry>()
  for (let i = 0; i < days; i++) {
    const date = now.minus({ days: i }).toISODate()!
    buckets.set(date, {
      date,
      points: 0,
      meetingCount: 0,
      categories: {} as Record<SacrificeCategory, number>,
    })
  }
  
  // Aggregate scores into buckets
  for (const score of scores) {
    const date = DateTime.fromISO(score.calculatedAt).toISODate()!
    const bucket = buckets.get(date)
    if (bucket) {
      bucket.points += score.points
      bucket.meetingCount++
      bucket.categories[score.category as SacrificeCategory] = 
        (bucket.categories[score.category as SacrificeCategory] || 0) + 1
    }
  }
  
  // Convert to array and sort by date
  return Array.from(buckets.values())
    .filter(b => DateTime.fromISO(b.date) >= startDate)
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ============================================
// UTILITIES
// ============================================

/**
 * Get color for sacrifice category (Tailwind classes)
 */
export function getCategoryColor(category: SacrificeCategory): {
  bg: string
  text: string
  border: string
} {
  const colors: Record<SacrificeCategory, { bg: string; text: string; border: string }> = {
    golden: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    good: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    acceptable: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
    early_morning: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    evening: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    late_evening: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300' },
    night: { bg: 'bg-red-200', text: 'text-red-700', border: 'border-red-400' },
    late_night: { bg: 'bg-red-300', text: 'text-red-800', border: 'border-red-500' },
    graveyard: { bg: 'bg-rose-200', text: 'text-rose-800', border: 'border-rose-400' },
  }
  return colors[category]
}

/**
 * Get emoji for impact level
 */
export function getImpactEmoji(impactLevel: string): string {
  const emojis: Record<string, string> = {
    minimal: '😊',
    low: '🙂',
    medium: '😐',
    high: '😟',
    severe: '😩',
    extreme: '💀',
  }
  return emojis[impactLevel] || '❓'
}

/**
 * Get badge variant for fairness status
 */
export function getFairnessStatusBadge(status: LeaderboardEntry['fairnessStatus']): {
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  label: string
} {
  const badges: Record<LeaderboardEntry['fairnessStatus'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    balanced: { variant: 'outline', label: 'Balanced' },
    above_average: { variant: 'secondary', label: 'Above Average' },
    high_sacrifice: { variant: 'default', label: 'High Sacrifice' },
    critical: { variant: 'destructive', label: '⚠️ Critical' },
  }
  return badges[status]
}

/**
 * Format points for display
 */
export function formatPoints(points: number): string {
  if (points === 0) return '0'
  if (points < 10) return points.toFixed(1)
  return Math.round(points).toString()
}

/**
 * Get rank medal emoji
 */
export function getRankMedal(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}
