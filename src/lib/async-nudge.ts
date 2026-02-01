/**
 * Async Nudge - Trigger Logic for Meeting-to-Async Conversion
 * CA-040: Determines when a meeting should be nudged towards async
 * 
 * The async nudge system analyzes meeting parameters and suggests
 * converting synchronous meetings to async when the sacrifice score
 * is too high or the meeting fits async patterns.
 */

import { calculateSacrificeScore, type SacrificeScoreResult } from './sacrifice-score'

// ============================================
// TYPES
// ============================================

export type AsyncType = 'loom' | 'doc' | 'poll' | 'email' | 'slack' | 'other'

export interface NudgeTriggerInput {
  /** Meeting title for pattern matching */
  title: string
  /** Meeting type/category */
  meetingType?: 'standup' | 'planning' | '1on1' | 'review' | 'brainstorm' | 'other'
  /** Duration in minutes */
  durationMinutes: number
  /** Number of participants */
  participantCount: number
  /** Total sacrifice points across all participants */
  totalSacrificePoints: number
  /** Maximum individual sacrifice score */
  maxIndividualSacrifice: number
  /** Is this a recurring meeting? */
  isRecurring?: boolean
  /** Average participant energy level (0-1) */
  averageEnergy?: number
  /** Time difference between earliest and latest participant (hours) */
  timezoneSpread?: number
  /** Organizer's preference (some always want sync) */
  organizerPreference?: 'prefer_async' | 'neutral' | 'prefer_sync'
}

export interface NudgeResult {
  /** Should we suggest async? */
  shouldNudge: boolean
  /** How strongly should we nudge? (0-100) */
  nudgeStrength: number
  /** Primary reason for the nudge */
  primaryReason: NudgeReason
  /** All contributing reasons */
  reasons: NudgeReason[]
  /** Suggested async alternatives */
  suggestedAlternatives: AsyncAlternative[]
  /** Estimated hours that could be saved if async */
  estimatedHoursSaved: number
  /** Human-readable nudge message */
  message: string
  /** Whether this is a gentle suggestion or strong recommendation */
  urgency: 'gentle' | 'moderate' | 'strong'
}

export interface NudgeReason {
  type: 'high_sacrifice' | 'timezone_spread' | 'low_energy' | 'pattern_match' | 'duration' | 'recurring_cost' | 'participant_count'
  description: string
  weight: number
  details?: string
}

export interface AsyncAlternative {
  type: AsyncType
  name: string
  description: string
  bestFor: string
  icon: string
  suitabilityScore: number
}

// ============================================
// THRESHOLDS
// ============================================

const THRESHOLDS = {
  /** Total sacrifice points to start suggesting async */
  SACRIFICE_GENTLE: 15,
  SACRIFICE_MODERATE: 25,
  SACRIFICE_STRONG: 40,
  
  /** Individual max sacrifice threshold */
  INDIVIDUAL_SACRIFICE: 6,
  
  /** Timezone spread (hours) thresholds */
  TIMEZONE_SPREAD_HIGH: 8,
  TIMEZONE_SPREAD_EXTREME: 12,
  
  /** Energy level threshold (below this = nudge) */
  LOW_ENERGY: 0.5,
  
  /** Duration thresholds (minutes) */
  DURATION_SHORT: 15,
  DURATION_LONG: 60,
  
  /** Participant count thresholds */
  MANY_PARTICIPANTS: 6,
}

// ============================================
// PATTERN MATCHING
// ============================================

/** Meeting title patterns that suggest async is viable */
const ASYNC_FRIENDLY_PATTERNS: Array<{ regex: RegExp; asyncTypes: AsyncType[]; weight: number }> = [
  { regex: /status|update|check-?in/i, asyncTypes: ['doc', 'slack'], weight: 25 },
  { regex: /standup|daily/i, asyncTypes: ['slack', 'doc'], weight: 30 },
  { regex: /FYI|announcement|info/i, asyncTypes: ['email', 'loom'], weight: 35 },
  { regex: /demo|walkthrough|tutorial/i, asyncTypes: ['loom'], weight: 40 },
  { regex: /review|feedback/i, asyncTypes: ['doc', 'loom'], weight: 20 },
  { regex: /poll|vote|decision/i, asyncTypes: ['poll', 'slack'], weight: 30 },
  { regex: /sync|catchup|catch-?up/i, asyncTypes: ['slack', 'doc'], weight: 15 },
  { regex: /weekly|bi-?weekly/i, asyncTypes: ['doc', 'slack'], weight: 20 },
]

/** Meeting types that typically NEED synchronous discussion */
const SYNC_PREFERRED_TYPES = new Set(['brainstorm', '1on1', 'planning'])

// ============================================
// ASYNC ALTERNATIVES DATABASE
// ============================================

const ASYNC_ALTERNATIVES: Record<AsyncType, Omit<AsyncAlternative, 'suitabilityScore'>> = {
  loom: {
    type: 'loom',
    name: 'Loom Video',
    description: 'Record a video message that participants can watch anytime',
    bestFor: 'Demos, updates, walkthroughs',
    icon: '🎥',
  },
  doc: {
    type: 'doc',
    name: 'Shared Document',
    description: 'Create a collaborative doc for comments and discussion',
    bestFor: 'Reviews, status updates, decisions with context',
    icon: '📝',
  },
  poll: {
    type: 'poll',
    name: 'Quick Poll',
    description: 'Get everyone\'s input asynchronously via a poll',
    bestFor: 'Decisions, preferences, quick votes',
    icon: '📊',
  },
  email: {
    type: 'email',
    name: 'Email Thread',
    description: 'Send a structured email for async discussion',
    bestFor: 'Announcements, FYI updates, formal communication',
    icon: '📧',
  },
  slack: {
    type: 'slack',
    name: 'Slack/Chat Thread',
    description: 'Start a dedicated thread for discussion',
    bestFor: 'Quick syncs, daily updates, informal check-ins',
    icon: '💬',
  },
  other: {
    type: 'other',
    name: 'Other Async Method',
    description: 'Use your preferred async communication tool',
    bestFor: 'Flexible async communication',
    icon: '⚡',
  },
}

// ============================================
// MAIN NUDGE LOGIC (CA-040)
// ============================================

/**
 * Analyze a meeting and determine if it should be nudged to async
 * 
 * @param input - Meeting parameters to analyze
 * @returns Nudge recommendation with reasons and alternatives
 */
export function analyzeForAsyncNudge(input: NudgeTriggerInput): NudgeResult {
  const reasons: NudgeReason[] = []
  let totalWeight = 0
  
  // ============ Reason 1: High sacrifice points ============
  if (input.totalSacrificePoints >= THRESHOLDS.SACRIFICE_GENTLE) {
    const weight = 
      input.totalSacrificePoints >= THRESHOLDS.SACRIFICE_STRONG ? 40 :
      input.totalSacrificePoints >= THRESHOLDS.SACRIFICE_MODERATE ? 30 : 20
    
    reasons.push({
      type: 'high_sacrifice',
      description: 'High sacrifice score across participants',
      weight,
      details: `Total: ${input.totalSacrificePoints} points (threshold: ${THRESHOLDS.SACRIFICE_GENTLE})`,
    })
    totalWeight += weight
  }
  
  // ============ Reason 2: One person suffering disproportionately ============
  if (input.maxIndividualSacrifice >= THRESHOLDS.INDIVIDUAL_SACRIFICE) {
    const weight = Math.min(25, (input.maxIndividualSacrifice - THRESHOLDS.INDIVIDUAL_SACRIFICE + 1) * 5)
    reasons.push({
      type: 'high_sacrifice',
      description: 'One participant is sacrificing significantly more',
      weight,
      details: `Max individual: ${input.maxIndividualSacrifice} points`,
    })
    totalWeight += weight
  }
  
  // ============ Reason 3: Large timezone spread ============
  if (input.timezoneSpread && input.timezoneSpread >= THRESHOLDS.TIMEZONE_SPREAD_HIGH) {
    const weight = input.timezoneSpread >= THRESHOLDS.TIMEZONE_SPREAD_EXTREME ? 30 : 20
    reasons.push({
      type: 'timezone_spread',
      description: `${input.timezoneSpread}+ hour timezone spread`,
      weight,
      details: `Spread: ${input.timezoneSpread}h makes finding good times hard`,
    })
    totalWeight += weight
  }
  
  // ============ Reason 4: Low average energy ============
  if (input.averageEnergy !== undefined && input.averageEnergy < THRESHOLDS.LOW_ENERGY) {
    const weight = Math.round((1 - input.averageEnergy) * 30)
    reasons.push({
      type: 'low_energy',
      description: 'Low cognitive energy at available times',
      weight,
      details: `Average energy: ${Math.round(input.averageEnergy * 100)}%`,
    })
    totalWeight += weight
  }
  
  // ============ Reason 5: Pattern matching ============
  for (const pattern of ASYNC_FRIENDLY_PATTERNS) {
    if (pattern.regex.test(input.title)) {
      reasons.push({
        type: 'pattern_match',
        description: `"${input.title}" matches async-friendly pattern`,
        weight: pattern.weight,
        details: `This type of meeting often works well async`,
      })
      totalWeight += pattern.weight
      break // Only match first pattern
    }
  }
  
  // ============ Reason 6: Short meetings that could be a message ============
  if (input.durationMinutes <= THRESHOLDS.DURATION_SHORT) {
    reasons.push({
      type: 'duration',
      description: 'Very short meeting could be a message',
      weight: 20,
      details: `${input.durationMinutes} min meeting could be a quick Slack`,
    })
    totalWeight += 20
  }
  
  // ============ Reason 7: Long recurring meetings compound cost ============
  if (input.isRecurring && input.durationMinutes >= THRESHOLDS.DURATION_LONG) {
    reasons.push({
      type: 'recurring_cost',
      description: 'Recurring meeting amplifies sacrifice over time',
      weight: 25,
      details: `${input.durationMinutes}min × recurring = significant ongoing cost`,
    })
    totalWeight += 25
  }
  
  // ============ Reason 8: Many participants (hard to schedule fairly) ============
  if (input.participantCount >= THRESHOLDS.MANY_PARTICIPANTS) {
    reasons.push({
      type: 'participant_count',
      description: 'Large group hard to schedule fairly',
      weight: 15,
      details: `${input.participantCount} people = complex coordination`,
    })
    totalWeight += 15
  }
  
  // ============ Calculate nudge strength ============
  // Apply organizer preference modifier
  const preferenceModifier = 
    input.organizerPreference === 'prefer_async' ? 1.2 :
    input.organizerPreference === 'prefer_sync' ? 0.6 : 1
  
  // Reduce nudge strength for sync-preferred meeting types
  const typeModifier = 
    input.meetingType && SYNC_PREFERRED_TYPES.has(input.meetingType) ? 0.5 : 1
  
  const rawNudgeStrength = Math.min(100, totalWeight * preferenceModifier * typeModifier)
  const nudgeStrength = Math.round(rawNudgeStrength)
  
  // ============ Determine urgency and whether to nudge ============
  const shouldNudge = nudgeStrength >= 25
  const urgency: 'gentle' | 'moderate' | 'strong' = 
    nudgeStrength >= 70 ? 'strong' :
    nudgeStrength >= 45 ? 'moderate' : 'gentle'
  
  // ============ Find best alternatives ============
  const suggestedAlternatives = findBestAlternatives(input, reasons)
  
  // ============ Estimate hours saved ============
  const estimatedHoursSaved = calculateHoursSaved(input)
  
  // ============ Generate message ============
  const message = generateNudgeMessage(reasons, urgency, suggestedAlternatives[0])
  
  // Sort reasons by weight
  reasons.sort((a, b) => b.weight - a.weight)
  
  return {
    shouldNudge,
    nudgeStrength,
    primaryReason: reasons[0] || { type: 'high_sacrifice', description: 'Consider async', weight: 0 },
    reasons,
    suggestedAlternatives,
    estimatedHoursSaved,
    message,
    urgency,
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Find the best async alternatives based on meeting characteristics
 */
function findBestAlternatives(
  input: NudgeTriggerInput,
  reasons: NudgeReason[]
): AsyncAlternative[] {
  const scores: Map<AsyncType, number> = new Map()
  
  // Initialize with base scores
  Object.keys(ASYNC_ALTERNATIVES).forEach(type => {
    scores.set(type as AsyncType, 50)
  })
  
  // Boost based on pattern matches
  const patternReason = reasons.find(r => r.type === 'pattern_match')
  if (patternReason) {
    for (const pattern of ASYNC_FRIENDLY_PATTERNS) {
      if (pattern.regex.test(input.title)) {
        pattern.asyncTypes.forEach(type => {
          scores.set(type, (scores.get(type) || 50) + 30)
        })
        break
      }
    }
  }
  
  // Boost Loom for demos/walkthroughs
  if (/demo|walk|show|present/i.test(input.title)) {
    scores.set('loom', (scores.get('loom') || 50) + 25)
  }
  
  // Boost doc for reviews
  if (/review|feedback|RFC/i.test(input.title)) {
    scores.set('doc', (scores.get('doc') || 50) + 25)
  }
  
  // Boost Slack for short meetings
  if (input.durationMinutes <= 15) {
    scores.set('slack', (scores.get('slack') || 50) + 20)
  }
  
  // Boost poll for decision meetings
  if (/decision|vote|choose|pick/i.test(input.title)) {
    scores.set('poll', (scores.get('poll') || 50) + 30)
  }
  
  // Convert to alternatives array with scores
  const alternatives: AsyncAlternative[] = Object.entries(ASYNC_ALTERNATIVES)
    .map(([type, alt]) => ({
      ...alt,
      suitabilityScore: Math.min(100, scores.get(type as AsyncType) || 50),
    }))
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
  
  return alternatives.slice(0, 3) // Return top 3
}

/**
 * Calculate estimated hours saved if meeting goes async
 */
function calculateHoursSaved(input: NudgeTriggerInput): number {
  // Base: meeting duration × participants
  const baseSaved = (input.durationMinutes / 60) * input.participantCount
  
  // Add coordination time (scheduling, prep, context switching)
  const coordinationOverhead = 0.25 * input.participantCount
  
  // Multiply by 1.5 for recurring (assuming weekly)
  const recurringMultiplier = input.isRecurring ? 1.5 : 1
  
  return Math.round((baseSaved + coordinationOverhead) * recurringMultiplier * 10) / 10
}

/**
 * Generate human-readable nudge message
 */
function generateNudgeMessage(
  reasons: NudgeReason[],
  urgency: 'gentle' | 'moderate' | 'strong',
  topAlternative?: AsyncAlternative
): string {
  const primaryReason = reasons[0]
  
  const prefixes = {
    gentle: '💡 Quick thought:',
    moderate: '🤔 Worth considering:',
    strong: '⚠️ Recommendation:',
  }
  
  let message = prefixes[urgency] + ' '
  
  if (!primaryReason) {
    return message + 'This meeting might work well async.'
  }
  
  switch (primaryReason.type) {
    case 'high_sacrifice':
      message += `This meeting has a high sacrifice score. Someone's waking up early or staying late.`
      break
    case 'timezone_spread':
      message += `With ${primaryReason.details?.match(/\d+/)?.[0] || 'large'} hours between participants, finding a fair time is tough.`
      break
    case 'low_energy':
      message += `Available times have low cognitive energy. Consider async for better engagement.`
      break
    case 'pattern_match':
      message += `This type of meeting often works well async.`
      break
    case 'duration':
      message += `Quick meetings can often be a Slack message instead.`
      break
    case 'recurring_cost':
      message += `Recurring meetings compound the sacrifice over time.`
      break
    case 'participant_count':
      message += `Large groups are hard to schedule fairly.`
      break
  }
  
  if (topAlternative) {
    message += ` Try ${topAlternative.icon} ${topAlternative.name} instead?`
  }
  
  return message
}

// ============================================
// HOURS RECLAIMED TRACKING (CA-042)
// ============================================

export interface ReclaimedStats {
  totalHoursReclaimed: number
  meetingsConverted: number
  averageHoursPerMeeting: number
  byType: Record<AsyncType, { count: number; hours: number }>
  trend: 'up' | 'down' | 'stable'
  trendPercent: number
}

/**
 * Calculate reclaimed hours statistics from async nudge records
 */
export function calculateReclaimedStats(
  nudgeRecords: Array<{
    decision: 'went_async' | 'scheduled_anyway'
    hoursSaved: number
    asyncType: AsyncType | null
    createdAt: Date
  }>,
  previousPeriodRecords?: typeof nudgeRecords
): ReclaimedStats {
  const asyncRecords = nudgeRecords.filter(r => r.decision === 'went_async')
  
  // Calculate totals
  const totalHoursReclaimed = asyncRecords.reduce((sum, r) => sum + (r.hoursSaved || 0), 0)
  const meetingsConverted = asyncRecords.length
  const averageHoursPerMeeting = meetingsConverted > 0 ? totalHoursReclaimed / meetingsConverted : 0
  
  // Group by type
  const byType: Record<AsyncType, { count: number; hours: number }> = {
    loom: { count: 0, hours: 0 },
    doc: { count: 0, hours: 0 },
    poll: { count: 0, hours: 0 },
    email: { count: 0, hours: 0 },
    slack: { count: 0, hours: 0 },
    other: { count: 0, hours: 0 },
  }
  
  asyncRecords.forEach(r => {
    const type = r.asyncType || 'other'
    byType[type].count++
    byType[type].hours += r.hoursSaved || 0
  })
  
  // Calculate trend
  let trend: 'up' | 'down' | 'stable' = 'stable'
  let trendPercent = 0
  
  if (previousPeriodRecords) {
    const prevAsync = previousPeriodRecords.filter(r => r.decision === 'went_async')
    const prevHours = prevAsync.reduce((sum, r) => sum + (r.hoursSaved || 0), 0)
    
    if (prevHours > 0) {
      trendPercent = Math.round(((totalHoursReclaimed - prevHours) / prevHours) * 100)
      trend = trendPercent > 10 ? 'up' : trendPercent < -10 ? 'down' : 'stable'
    } else if (totalHoursReclaimed > 0) {
      trend = 'up'
      trendPercent = 100
    }
  }
  
  return {
    totalHoursReclaimed: Math.round(totalHoursReclaimed * 10) / 10,
    meetingsConverted,
    averageHoursPerMeeting: Math.round(averageHoursPerMeeting * 10) / 10,
    byType,
    trend,
    trendPercent,
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get color for nudge urgency
 */
export function getNudgeUrgencyColor(urgency: 'gentle' | 'moderate' | 'strong'): {
  bg: string
  text: string
  border: string
} {
  const colors = {
    gentle: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    moderate: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    strong: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  }
  return colors[urgency]
}

/**
 * Get icon for async type
 */
export function getAsyncTypeIcon(type: AsyncType): string {
  return ASYNC_ALTERNATIVES[type]?.icon || '⚡'
}

/**
 * Format hours for display
 */
export function formatHoursReclaimed(hours: number): string {
  if (hours === 0) return '0h'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 10) return `${hours.toFixed(1)}h`
  return `${Math.round(hours)}h`
}
