/**
 * Timezone Utilities for ClockAlign
 * 
 * Core functions for:
 * - Timezone detection and conversion
 * - Finding meeting overlap windows
 * - Calculating Sacrifice Scores (pain points)
 * - Golden Window (energy/sharpness) calculations
 */

import { DateTime, Duration, IANAZone } from 'luxon'

// ============================================
// TYPES
// ============================================

export interface TimeSlot {
  start: DateTime
  end: DateTime
}

export interface Participant {
  id: string
  email: string
  name?: string
  timezone: string
}

export interface ParticipantWithScore extends Participant {
  localStart: DateTime
  localEnd: DateTime
  sacrificePoints: number
  sacrificeCategory: SacrificeCategory
  sharpnessScore: number
}

export interface OverlapResult {
  slot: TimeSlot
  participants: ParticipantWithScore[]
  totalSacrificePoints: number
  goldenScore: number
  isRecommended: boolean
}

export type SacrificeCategory = 
  | 'core'           // 9 AM - 6 PM: 0 points
  | 'early_start'    // 8 AM - 9 AM: 1 point
  | 'evening'        // 6 PM - 8 PM: 2 points
  | 'early_morning'  // 6 AM - 8 AM: 3 points
  | 'late_evening'   // 8 PM - 10 PM: 4 points
  | 'night'          // 10 PM - 12 AM: 6 points
  | 'graveyard'      // 12 AM - 6 AM: 10 points

// Default energy curve (sharpness values 0-1)
export const DEFAULT_ENERGY_CURVE: Record<number, number> = {
  0: 0.30, 1: 0.30, 2: 0.30, 3: 0.30, 4: 0.30, 5: 0.30,  // Sleeping
  6: 0.60, 7: 0.60,                                       // Waking up
  8: 0.90, 9: 0.90,                                       // Morning peak
  10: 0.95, 11: 0.95,                                     // Maximum focus
  12: 0.65, 13: 0.65,                                     // Post-lunch dip
  14: 0.80, 15: 0.80,                                     // Afternoon recovery
  16: 0.85, 17: 0.85,                                     // Secondary peak
  18: 0.70, 19: 0.70,                                     // Winding down
  20: 0.50, 21: 0.50, 22: 0.50, 23: 0.50                  // Evening fatigue
}

// Sacrifice points by category
const SACRIFICE_POINTS: Record<SacrificeCategory, number> = {
  core: 0,
  early_start: 1,
  evening: 2,
  early_morning: 3,
  late_evening: 4,
  night: 6,
  graveyard: 10
}

// ============================================
// TIMEZONE DETECTION
// ============================================

/**
 * Get user's timezone from browser
 * Falls back to UTC if unavailable
 */
export function getUserTimezone(): string {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz && isValidTimezone(tz)) {
      return tz
    }
  }
  return 'UTC'
}

/**
 * Check if a timezone string is valid IANA timezone
 */
export function isValidTimezone(tz: string): boolean {
  try {
    const zone = IANAZone.create(tz)
    return zone.isValid
  } catch {
    return false
  }
}

/**
 * Get UTC offset string for a timezone (e.g., "UTC-7", "UTC+5:30")
 */
export function getUTCOffset(timezone: string): string {
  const dt = DateTime.now().setZone(timezone)
  const offset = dt.offset
  const hours = Math.floor(Math.abs(offset) / 60)
  const minutes = Math.abs(offset) % 60
  const sign = offset >= 0 ? '+' : '-'
  
  if (minutes === 0) {
    return `UTC${sign}${hours}`
  }
  return `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`
}

// ============================================
// TIME CONVERSION
// ============================================

/**
 * Convert a DateTime to another timezone
 */
export function convertToTimezone(dt: DateTime, targetTimezone: string): DateTime {
  return dt.setZone(targetTimezone)
}

/**
 * Format a DateTime for display in a specific timezone
 */
export function formatInTimezone(
  dt: DateTime, 
  timezone: string, 
  format: string = 'h:mm a'
): string {
  return dt.setZone(timezone).toFormat(format)
}

/**
 * Get current time in a timezone
 */
export function nowInTimezone(timezone: string): DateTime {
  return DateTime.now().setZone(timezone)
}

// ============================================
// SACRIFICE SCORE CALCULATION
// ============================================

/**
 * Get sacrifice category based on local hour
 */
export function getSacrificeCategory(hour: number): SacrificeCategory {
  if (hour >= 9 && hour < 18) return 'core'
  if (hour >= 8 && hour < 9) return 'early_start'
  if (hour >= 18 && hour < 20) return 'evening'
  if (hour >= 6 && hour < 8) return 'early_morning'
  if (hour >= 20 && hour < 22) return 'late_evening'
  if (hour >= 22 || hour === 0) return 'night'
  if (hour >= 1 && hour < 6) return 'graveyard'
  return 'core'
}

/**
 * Calculate base sacrifice points for a local hour
 */
export function getBaseSacrificePoints(hour: number): number {
  const category = getSacrificeCategory(hour)
  return SACRIFICE_POINTS[category]
}

/**
 * Calculate full sacrifice score with multipliers
 * 
 * @param localHour - The hour in participant's local time
 * @param durationMinutes - Meeting duration
 * @param isRecurring - Is this a recurring meeting?
 * @param isOrganizer - Is this participant the organizer?
 */
export function calculatePainScore(
  localHour: number,
  durationMinutes: number = 30,
  isRecurring: boolean = false,
  isOrganizer: boolean = false
): { points: number; category: SacrificeCategory; multiplier: number } {
  const category = getSacrificeCategory(localHour)
  let points = SACRIFICE_POINTS[category]
  
  // Duration multiplier: pain × (duration / 30)
  const durationMultiplier = durationMinutes / 30
  points *= durationMultiplier
  
  // Recurring multiplier: pain × 1.5
  let multiplier = 1.0
  if (isRecurring) {
    multiplier *= 1.5
    points *= 1.5
  }
  
  // Organizer multiplier: pain × 0.8 (they chose to organize)
  if (isOrganizer) {
    multiplier *= 0.8
    points *= 0.8
  }
  
  return {
    points: Math.round(points),
    category,
    multiplier
  }
}

// ============================================
// GOLDEN WINDOW (SHARPNESS) CALCULATION
// ============================================

/**
 * Get sharpness score for a given hour (0-1)
 */
export function getSharpnessForHour(
  hour: number, 
  customCurve?: Record<number, number>
): number {
  const curve = customCurve || DEFAULT_ENERGY_CURVE
  return curve[hour] ?? 0.5
}

/**
 * Calculate collective sharpness score for participants
 * 
 * @param participantLocalHours - Array of local hours for each participant
 * @param customCurves - Optional map of participant ID to custom energy curve
 */
export function calculateGoldenScore(
  participantLocalHours: number[],
  customCurves?: Map<string, Record<number, number>>
): number {
  if (participantLocalHours.length === 0) return 0
  
  const sharpnessScores = participantLocalHours.map((hour, i) => {
    const curve = customCurves?.get(String(i)) || DEFAULT_ENERGY_CURVE
    return getSharpnessForHour(hour, curve)
  })
  
  const avgSharpness = sharpnessScores.reduce((a, b) => a + b, 0) / sharpnessScores.length
  return Math.round(avgSharpness * 100) // Return as percentage 0-100
}

// ============================================
// OVERLAP FINDING
// ============================================

/**
 * Find all valid meeting slots for a group of participants
 * 
 * @param participants - Array of participants with timezones
 * @param dateRange - Start and end dates to search
 * @param durationMinutes - Meeting duration
 * @param options - Additional options
 */
export function findOverlap(
  participants: Participant[],
  dateRange: { start: DateTime; end: DateTime },
  durationMinutes: number = 30,
  options: {
    workingHoursOnly?: boolean
    avoidLunch?: boolean
    maxSacrificePerPerson?: number
    preferGoldenWindow?: boolean
  } = {}
): OverlapResult[] {
  const {
    workingHoursOnly = true,
    avoidLunch = false,
    maxSacrificePerPerson = 10,
    preferGoldenWindow = true
  } = options

  const results: OverlapResult[] = []
  const slotDuration = Duration.fromObject({ minutes: durationMinutes })
  
  // Generate 30-minute slots across the date range
  let current = dateRange.start.startOf('hour')
  const end = dateRange.end
  
  while (current < end) {
    const slotEnd = current.plus(slotDuration)
    
    // Check each participant for this slot
    const participantsWithScores: ParticipantWithScore[] = participants.map(p => {
      const localStart = current.setZone(p.timezone)
      const localEnd = slotEnd.setZone(p.timezone)
      const localHour = localStart.hour
      
      const { points, category } = calculatePainScore(
        localHour,
        durationMinutes
      )
      
      const sharpness = getSharpnessForHour(localHour)
      
      return {
        ...p,
        localStart,
        localEnd,
        sacrificePoints: points,
        sacrificeCategory: category,
        sharpnessScore: Math.round(sharpness * 100)
      }
    })
    
    // Filter based on options
    let isValidSlot = true
    
    // Working hours only (6 AM - 10 PM in each timezone)
    if (workingHoursOnly) {
      isValidSlot = participantsWithScores.every(p => {
        const hour = p.localStart.hour
        return hour >= 6 && hour < 22
      })
    }
    
    // Avoid lunch (12-2 PM)
    if (avoidLunch && isValidSlot) {
      const anyInLunch = participantsWithScores.some(p => {
        const hour = p.localStart.hour
        return hour >= 12 && hour < 14
      })
      if (anyInLunch) isValidSlot = false
    }
    
    // Max sacrifice per person
    if (maxSacrificePerPerson && isValidSlot) {
      isValidSlot = participantsWithScores.every(p => 
        p.sacrificePoints <= maxSacrificePerPerson
      )
    }
    
    if (isValidSlot) {
      const totalSacrifice = participantsWithScores.reduce(
        (sum, p) => sum + p.sacrificePoints, 
        0
      )
      
      const goldenScore = calculateGoldenScore(
        participantsWithScores.map(p => p.localStart.hour)
      )
      
      results.push({
        slot: { start: current, end: slotEnd },
        participants: participantsWithScores,
        totalSacrificePoints: totalSacrifice,
        goldenScore,
        isRecommended: false // Will be set after sorting
      })
    }
    
    // Move to next 30-minute slot
    current = current.plus({ minutes: 30 })
  }
  
  // Sort results: prefer high golden score, low sacrifice
  results.sort((a, b) => {
    if (preferGoldenWindow) {
      // Primary: higher golden score is better
      const goldenDiff = b.goldenScore - a.goldenScore
      if (Math.abs(goldenDiff) > 5) return goldenDiff
    }
    // Secondary: lower sacrifice is better
    return a.totalSacrificePoints - b.totalSacrificePoints
  })
  
  // Mark top 3 as recommended
  results.slice(0, 3).forEach(r => r.isRecommended = true)
  
  return results
}

// ============================================
// ASYNC NUDGE DETECTION
// ============================================

/**
 * Check if a meeting should trigger async nudge
 * 
 * @param participants - Meeting participants
 * @param bestSlot - Best available slot
 */
export function shouldNudgeAsync(
  participants: Participant[],
  bestSlot?: OverlapResult
): { shouldNudge: boolean; reason: string; timezoneSpread: number } {
  if (participants.length < 2) {
    return { shouldNudge: false, reason: '', timezoneSpread: 0 }
  }
  
  // Calculate timezone spread
  const offsets = participants.map(p => {
    return DateTime.now().setZone(p.timezone).offset
  })
  const minOffset = Math.min(...offsets)
  const maxOffset = Math.max(...offsets)
  const spreadMinutes = maxOffset - minOffset
  const spreadHours = spreadMinutes / 60
  
  // Trigger conditions:
  // 1. Timezone spread ≥ 5 hours
  if (spreadHours >= 5) {
    return {
      shouldNudge: true,
      reason: `${spreadHours.toFixed(1)}-hour timezone spread means someone always sacrifices`,
      timezoneSpread: spreadHours
    }
  }
  
  // 2. Any participant scores 4+ sacrifice points
  if (bestSlot) {
    const highSacrifice = bestSlot.participants.find(p => p.sacrificePoints >= 4)
    if (highSacrifice) {
      return {
        shouldNudge: true,
        reason: `${highSacrifice.name || highSacrifice.email} would need to take a ${highSacrifice.sacrificeCategory.replace('_', ' ')} slot`,
        timezoneSpread: spreadHours
      }
    }
  }
  
  return { shouldNudge: false, reason: '', timezoneSpread: spreadHours }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get a list of common timezones for picker
 */
export function getCommonTimezones(): Array<{ value: string; label: string; offset: string }> {
  const timezones = [
    'America/Los_Angeles',
    'America/Denver',
    'America/Chicago',
    'America/New_York',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Africa/Cairo',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Pacific/Auckland'
  ]
  
  return timezones.map(tz => ({
    value: tz,
    label: tz.replace(/_/g, ' ').replace('/', ' / '),
    offset: getUTCOffset(tz)
  }))
}

/**
 * Get emoji for time of day
 */
export function getTimeEmoji(hour: number): string {
  if (hour >= 6 && hour < 12) return '☀️'
  if (hour >= 12 && hour < 17) return '🌤️'
  if (hour >= 17 && hour < 20) return '🌆'
  if (hour >= 20 && hour < 22) return '🌙'
  return '😴'
}

/**
 * Get color for sacrifice category
 */
export function getSacrificeCategoryColor(category: SacrificeCategory): string {
  const colors: Record<SacrificeCategory, string> = {
    core: 'text-green-600',
    early_start: 'text-yellow-600',
    evening: 'text-orange-500',
    early_morning: 'text-orange-600',
    late_evening: 'text-red-500',
    night: 'text-red-600',
    graveyard: 'text-rose-700'
  }
  return colors[category]
}
