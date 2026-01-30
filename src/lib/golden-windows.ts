/**
 * Golden Windows - Overlap Detection & Energy-Weighted Scheduling
 * 
 * This module finds optimal meeting times by detecting when participants
 * are both available AND cognitively sharp. It's not just about overlap -
 * it's about finding times when everyone can be at their best.
 * 
 * Key concepts:
 * - Energy curves: Personal productivity patterns throughout the day
 * - Overlap windows: Times when all participants are available
 * - Golden score: Combined energy level during overlap
 * - Best times: Top recommendations considering both availability and sharpness
 */

import { DateTime, Duration, Interval } from 'luxon'

// ============================================
// TYPES
// ============================================

export interface Participant {
  id: string
  email: string
  name?: string
  timezone: string
  /** Custom energy curve (hour -> sharpness 0-1), uses default if not provided */
  energyCurve?: Record<number, number>
  /** Hours when user is NOT available (e.g., [0,1,2,3,4,5,6,22,23] for night) */
  unavailableHours?: number[]
}

export interface ParticipantWindow {
  participant: Participant
  localStart: DateTime
  localEnd: DateTime
  localHour: number
  sharpness: number  // 0-1, from energy curve
  isAvailable: boolean  // Based on unavailableHours
}

export interface OverlapWindow {
  /** UTC start time */
  utcStart: DateTime
  /** UTC end time */
  utcEnd: DateTime
  /** Duration in minutes */
  durationMinutes: number
  /** Per-participant breakdown */
  participants: ParticipantWindow[]
  /** Combined sharpness score (0-100) */
  goldenScore: number
  /** Whether ALL participants are available */
  allAvailable: boolean
  /** Energy-weighted overlap quality score */
  qualityScore: number
}

export interface BestTimeSlot extends OverlapWindow {
  rank: number
  recommendation: 'excellent' | 'good' | 'acceptable' | 'poor'
  summary: string
}

export interface HeatmapCell {
  hour: number  // 0-23
  participantId: string
  localHour: number
  sharpness: number
  isAvailable: boolean
  /** Color intensity 0-100 based on sharpness/availability */
  intensity: number
}

export interface HeatmapRow {
  participantId: string
  participantName: string
  timezone: string
  utcOffset: string
  cells: HeatmapCell[]
}

export interface HeatmapData {
  /** UTC hours 0-23 */
  hours: number[]
  rows: HeatmapRow[]
  /** Combined scores for each hour across all participants */
  combinedScores: Array<{
    hour: number
    goldenScore: number
    allAvailable: boolean
  }>
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Default energy curve based on circadian rhythm research
 * Values are sharpness from 0 (zombie) to 1 (peak performance)
 */
export const DEFAULT_ENERGY_CURVE: Record<number, number> = {
  // Night/Early morning (low energy)
  0: 0.20, 1: 0.15, 2: 0.15, 3: 0.15, 4: 0.20, 5: 0.35,
  // Morning ramp-up
  6: 0.55, 7: 0.70,
  // Morning peak
  8: 0.85, 9: 0.90,
  // Maximum focus (golden hours)
  10: 0.95, 11: 0.95, 12: 0.85,
  // Post-lunch dip
  13: 0.65, 14: 0.70,
  // Afternoon recovery
  15: 0.80, 16: 0.85,
  // Late afternoon/early evening
  17: 0.75, 18: 0.65,
  // Evening wind-down
  19: 0.55, 20: 0.45, 21: 0.35, 22: 0.30, 23: 0.25
}

/**
 * Default unavailable hours (midnight to 6am)
 */
export const DEFAULT_UNAVAILABLE_HOURS = [0, 1, 2, 3, 4, 5]

/**
 * Quality thresholds for recommendations
 */
const QUALITY_THRESHOLDS = {
  excellent: 80,
  good: 65,
  acceptable: 50,
  poor: 0
}

// ============================================
// CA-031: OVERLAP DETECTION ALGORITHM
// ============================================

/**
 * Get sharpness value for a specific hour
 */
export function getSharpness(
  hour: number,
  customCurve?: Record<number, number>
): number {
  const curve = customCurve || DEFAULT_ENERGY_CURVE
  return curve[hour] ?? 0.5
}

/**
 * Check if an hour is available for a participant
 */
export function isHourAvailable(
  hour: number,
  unavailableHours?: number[]
): boolean {
  const unavailable = unavailableHours || DEFAULT_UNAVAILABLE_HOURS
  return !unavailable.includes(hour)
}

/**
 * Convert UTC hour to local hour for a timezone
 */
export function utcToLocalHour(utcHour: number, timezone: string): number {
  const utcTime = DateTime.utc().set({ hour: utcHour, minute: 0, second: 0 })
  const localTime = utcTime.setZone(timezone)
  return localTime.hour
}

/**
 * Get participant window data for a specific UTC hour
 */
export function getParticipantWindow(
  participant: Participant,
  utcHour: number,
  referenceDate: DateTime = DateTime.utc()
): ParticipantWindow {
  const utcStart = referenceDate.set({ hour: utcHour, minute: 0, second: 0, millisecond: 0 })
  const utcEnd = utcStart.plus({ hours: 1 })
  
  const localStart = utcStart.setZone(participant.timezone)
  const localEnd = utcEnd.setZone(participant.timezone)
  const localHour = localStart.hour
  
  const sharpness = getSharpness(localHour, participant.energyCurve)
  const isAvailable = isHourAvailable(localHour, participant.unavailableHours)
  
  return {
    participant,
    localStart,
    localEnd,
    localHour,
    sharpness,
    isAvailable
  }
}

/**
 * Calculate overlap window for all participants at a specific UTC hour
 * 
 * This is the core overlap detection algorithm. For each UTC hour,
 * it determines what that hour looks like for each participant and
 * calculates combined availability and energy scores.
 */
export function calculateOverlapWindow(
  participants: Participant[],
  utcHour: number,
  referenceDate: DateTime = DateTime.utc()
): OverlapWindow {
  const utcStart = referenceDate.set({ hour: utcHour, minute: 0, second: 0, millisecond: 0 })
  const utcEnd = utcStart.plus({ hours: 1 })
  
  const participantWindows = participants.map(p => 
    getParticipantWindow(p, utcHour, referenceDate)
  )
  
  const allAvailable = participantWindows.every(pw => pw.isAvailable)
  
  // Calculate golden score (average sharpness as percentage)
  const avgSharpness = participantWindows.reduce((sum, pw) => sum + pw.sharpness, 0) / participants.length
  const goldenScore = Math.round(avgSharpness * 100)
  
  // Calculate quality score (considers both availability and sharpness)
  const qualityScore = calculateQualityScore(participantWindows)
  
  return {
    utcStart,
    utcEnd,
    durationMinutes: 60,
    participants: participantWindows,
    goldenScore,
    allAvailable,
    qualityScore
  }
}

/**
 * Find all overlap windows for a 24-hour period
 */
export function findAllOverlapWindows(
  participants: Participant[],
  referenceDate: DateTime = DateTime.utc()
): OverlapWindow[] {
  const windows: OverlapWindow[] = []
  
  for (let hour = 0; hour < 24; hour++) {
    windows.push(calculateOverlapWindow(participants, hour, referenceDate))
  }
  
  return windows
}

/**
 * Find valid overlap windows (where ALL participants are available)
 */
export function findValidOverlapWindows(
  participants: Participant[],
  referenceDate: DateTime = DateTime.utc()
): OverlapWindow[] {
  return findAllOverlapWindows(participants, referenceDate)
    .filter(window => window.allAvailable)
}

// ============================================
// CA-032: ENERGY-WEIGHTED OVERLAP SCORING
// ============================================

/**
 * Calculate quality score for an overlap window
 * 
 * This is the energy-weighted scoring algorithm that considers:
 * 1. Average sharpness across all participants
 * 2. Minimum sharpness (weakest link principle)
 * 3. Availability (penalize if anyone is unavailable)
 * 4. Variance (prefer even distribution over one person at peak, others at low)
 */
export function calculateQualityScore(
  participantWindows: ParticipantWindow[]
): number {
  if (participantWindows.length === 0) return 0
  
  const sharpnessValues = participantWindows.map(pw => pw.sharpness)
  const availableCount = participantWindows.filter(pw => pw.isAvailable).length
  const totalCount = participantWindows.length
  
  // Component 1: Average sharpness (weight: 40%)
  const avgSharpness = sharpnessValues.reduce((a, b) => a + b, 0) / totalCount
  
  // Component 2: Minimum sharpness - weakest link (weight: 30%)
  const minSharpness = Math.min(...sharpnessValues)
  
  // Component 3: Availability ratio (weight: 20%)
  const availabilityRatio = availableCount / totalCount
  
  // Component 4: Evenness - low variance is better (weight: 10%)
  const variance = calculateVariance(sharpnessValues)
  const evennessScore = Math.max(0, 1 - variance * 2) // variance of 0.5+ gives 0 score
  
  // Combine with weights
  const qualityScore = (
    avgSharpness * 0.40 +
    minSharpness * 0.30 +
    availabilityRatio * 0.20 +
    evennessScore * 0.10
  ) * 100
  
  // Heavy penalty if not everyone is available
  if (availableCount < totalCount) {
    return Math.round(qualityScore * 0.3) // 70% penalty
  }
  
  return Math.round(qualityScore)
}

/**
 * Calculate variance of an array of numbers
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length
}

/**
 * Get recommendation category based on quality score
 */
export function getRecommendation(qualityScore: number): 'excellent' | 'good' | 'acceptable' | 'poor' {
  if (qualityScore >= QUALITY_THRESHOLDS.excellent) return 'excellent'
  if (qualityScore >= QUALITY_THRESHOLDS.good) return 'good'
  if (qualityScore >= QUALITY_THRESHOLDS.acceptable) return 'acceptable'
  return 'poor'
}

/**
 * Generate a human-readable summary for a time slot
 */
export function generateSlotSummary(window: OverlapWindow): string {
  const recommendation = getRecommendation(window.qualityScore)
  const hour = window.utcStart.hour
  const avgSharpness = window.goldenScore
  
  if (!window.allAvailable) {
    const unavailableCount = window.participants.filter(p => !p.isAvailable).length
    return `${unavailableCount} participant(s) unavailable`
  }
  
  if (recommendation === 'excellent') {
    return `Peak energy alignment (${avgSharpness}% avg sharpness)`
  }
  if (recommendation === 'good') {
    return `Good energy levels across the team`
  }
  if (recommendation === 'acceptable') {
    return `Workable time, some participants not at peak`
  }
  return `Low energy period for multiple participants`
}

// ============================================
// BEST TIMES FINDER
// ============================================

/**
 * Find the best meeting times for a group of participants
 * 
 * Returns top N time slots ranked by quality score
 */
export function findBestTimes(
  participants: Participant[],
  options: {
    /** Number of top slots to return (default: 5) */
    topN?: number
    /** Only include times where everyone is available (default: true) */
    requireAllAvailable?: boolean
    /** Minimum quality score threshold (default: 0) */
    minQualityScore?: number
    /** Reference date for calculations */
    referenceDate?: DateTime
  } = {}
): BestTimeSlot[] {
  const {
    topN = 5,
    requireAllAvailable = true,
    minQualityScore = 0,
    referenceDate = DateTime.utc()
  } = options
  
  let windows = findAllOverlapWindows(participants, referenceDate)
  
  // Filter by availability if required
  if (requireAllAvailable) {
    windows = windows.filter(w => w.allAvailable)
  }
  
  // Filter by minimum quality score
  windows = windows.filter(w => w.qualityScore >= minQualityScore)
  
  // Sort by quality score (descending)
  windows.sort((a, b) => b.qualityScore - a.qualityScore)
  
  // Take top N and add ranking info
  return windows.slice(0, topN).map((window, index) => ({
    ...window,
    rank: index + 1,
    recommendation: getRecommendation(window.qualityScore),
    summary: generateSlotSummary(window)
  }))
}

/**
 * Find best time ranges (consecutive slots grouped together)
 */
export function findBestTimeRanges(
  participants: Participant[],
  options: {
    minDurationHours?: number
    referenceDate?: DateTime
  } = {}
): Array<{
  startHour: number
  endHour: number
  durationHours: number
  avgQualityScore: number
  recommendation: string
}> {
  const { minDurationHours = 1, referenceDate = DateTime.utc() } = options
  
  const windows = findAllOverlapWindows(participants, referenceDate)
    .filter(w => w.allAvailable && w.qualityScore >= 50)
  
  const ranges: Array<{
    startHour: number
    endHour: number
    durationHours: number
    avgQualityScore: number
    recommendation: string
  }> = []
  
  let rangeStart: number | null = null
  let rangeScores: number[] = []
  
  for (let hour = 0; hour < 24; hour++) {
    const window = windows.find(w => w.utcStart.hour === hour)
    
    if (window) {
      if (rangeStart === null) {
        rangeStart = hour
        rangeScores = [window.qualityScore]
      } else {
        rangeScores.push(window.qualityScore)
      }
    } else {
      if (rangeStart !== null && rangeScores.length >= minDurationHours) {
        const avgScore = rangeScores.reduce((a, b) => a + b, 0) / rangeScores.length
        ranges.push({
          startHour: rangeStart,
          endHour: rangeStart + rangeScores.length,
          durationHours: rangeScores.length,
          avgQualityScore: Math.round(avgScore),
          recommendation: getRecommendation(avgScore)
        })
      }
      rangeStart = null
      rangeScores = []
    }
  }
  
  // Handle wrap-around at midnight
  if (rangeStart !== null && rangeScores.length >= minDurationHours) {
    const avgScore = rangeScores.reduce((a, b) => a + b, 0) / rangeScores.length
    ranges.push({
      startHour: rangeStart,
      endHour: rangeStart + rangeScores.length,
      durationHours: rangeScores.length,
      avgQualityScore: Math.round(avgScore),
      recommendation: getRecommendation(avgScore)
    })
  }
  
  return ranges.sort((a, b) => b.avgQualityScore - a.avgQualityScore)
}

// ============================================
// HEATMAP DATA GENERATION
// ============================================

/**
 * Generate heatmap data for visualization
 * 
 * Creates a 24-hour x N-participants grid showing
 * availability and energy levels at each hour
 */
export function generateHeatmapData(
  participants: Participant[],
  referenceDate: DateTime = DateTime.utc()
): HeatmapData {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  const rows: HeatmapRow[] = participants.map(participant => {
    const utcOffset = DateTime.now().setZone(participant.timezone).toFormat('ZZZZ')
    
    const cells: HeatmapCell[] = hours.map(utcHour => {
      const localHour = utcToLocalHour(utcHour, participant.timezone)
      const sharpness = getSharpness(localHour, participant.energyCurve)
      const isAvailable = isHourAvailable(localHour, participant.unavailableHours)
      
      // Calculate intensity (0-100) for color mapping
      let intensity: number
      if (!isAvailable) {
        intensity = 0 // Unavailable = no color
      } else {
        intensity = Math.round(sharpness * 100)
      }
      
      return {
        hour: utcHour,
        participantId: participant.id,
        localHour,
        sharpness,
        isAvailable,
        intensity
      }
    })
    
    return {
      participantId: participant.id,
      participantName: participant.name || participant.email,
      timezone: participant.timezone,
      utcOffset,
      cells
    }
  })
  
  // Calculate combined scores for each UTC hour
  const combinedScores = hours.map(hour => {
    const window = calculateOverlapWindow(participants, hour, referenceDate)
    return {
      hour,
      goldenScore: window.goldenScore,
      allAvailable: window.allAvailable
    }
  })
  
  return {
    hours,
    rows,
    combinedScores
  }
}

/**
 * Get color for a heatmap cell based on intensity
 * Returns Tailwind CSS classes
 */
export function getHeatmapCellColor(
  intensity: number,
  isAvailable: boolean
): {
  bg: string
  text: string
} {
  if (!isAvailable) {
    return { bg: 'bg-gray-100', text: 'text-gray-400' }
  }
  
  // Green color scale based on intensity
  if (intensity >= 90) return { bg: 'bg-green-500', text: 'text-white' }
  if (intensity >= 80) return { bg: 'bg-green-400', text: 'text-white' }
  if (intensity >= 70) return { bg: 'bg-green-300', text: 'text-green-900' }
  if (intensity >= 60) return { bg: 'bg-green-200', text: 'text-green-800' }
  if (intensity >= 50) return { bg: 'bg-yellow-200', text: 'text-yellow-800' }
  if (intensity >= 40) return { bg: 'bg-orange-200', text: 'text-orange-800' }
  if (intensity >= 30) return { bg: 'bg-orange-300', text: 'text-orange-900' }
  return { bg: 'bg-red-200', text: 'text-red-800' }
}

/**
 * Get color for combined score column
 */
export function getCombinedScoreColor(
  score: number,
  allAvailable: boolean
): {
  bg: string
  text: string
  border: string
} {
  if (!allAvailable) {
    return { bg: 'bg-gray-50', text: 'text-gray-400', border: 'border-gray-200' }
  }
  
  if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-400' }
  if (score >= 65) return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' }
  if (score >= 50) return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' }
  return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' }
}

// ============================================
// AVAILABILITY PREFERENCES
// ============================================

/**
 * Energy preference types
 */
export type ChronoType = 'early_bird' | 'normal' | 'night_owl'

/**
 * Get energy curve based on chronotype
 */
export function getChronotypeEnergyCurve(chronotype: ChronoType): Record<number, number> {
  switch (chronotype) {
    case 'early_bird':
      return {
        0: 0.15, 1: 0.15, 2: 0.20, 3: 0.25, 4: 0.40, 5: 0.60,
        6: 0.80, 7: 0.90, 8: 0.95, 9: 0.95, 10: 0.90, 11: 0.85,
        12: 0.75, 13: 0.65, 14: 0.60, 15: 0.55, 16: 0.50, 17: 0.45,
        18: 0.40, 19: 0.35, 20: 0.30, 21: 0.25, 22: 0.20, 23: 0.15
      }
    case 'night_owl':
      return {
        0: 0.40, 1: 0.35, 2: 0.30, 3: 0.25, 4: 0.20, 5: 0.20,
        6: 0.25, 7: 0.35, 8: 0.50, 9: 0.60, 10: 0.70, 11: 0.75,
        12: 0.80, 13: 0.75, 14: 0.80, 15: 0.85, 16: 0.90, 17: 0.95,
        18: 0.95, 19: 0.90, 20: 0.85, 21: 0.80, 22: 0.70, 23: 0.55
      }
    case 'normal':
    default:
      return DEFAULT_ENERGY_CURVE
  }
}

/**
 * Convert work hours to unavailable hours
 * 
 * @param workStart - Work start hour (e.g., 9)
 * @param workEnd - Work end hour (e.g., 18)
 * @returns Array of hours outside work window
 */
export function workHoursToUnavailable(
  workStart: number,
  workEnd: number
): number[] {
  const unavailable: number[] = []
  
  for (let hour = 0; hour < 24; hour++) {
    if (hour < workStart || hour >= workEnd) {
      unavailable.push(hour)
    }
  }
  
  return unavailable
}

/**
 * Parse user preferences to Participant format
 */
export function parseUserPreferences(
  userId: string,
  email: string,
  name: string | undefined,
  timezone: string,
  preferences: {
    chronotype?: ChronoType
    workStartHour?: number
    workEndHour?: number
    customEnergyCurve?: Record<number, number>
    customUnavailableHours?: number[]
  }
): Participant {
  const {
    chronotype = 'normal',
    workStartHour = 8,
    workEndHour = 18,
    customEnergyCurve,
    customUnavailableHours
  } = preferences
  
  return {
    id: userId,
    email,
    name,
    timezone,
    energyCurve: customEnergyCurve || getChronotypeEnergyCurve(chronotype),
    unavailableHours: customUnavailableHours || workHoursToUnavailable(workStartHour, workEndHour)
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format hour for display (12-hour format with AM/PM)
 */
export function formatHour(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  if (hour < 12) return `${hour} AM`
  return `${hour - 12} PM`
}

/**
 * Format UTC hour with local times for all participants
 */
export function formatSlotWithLocalTimes(
  utcHour: number,
  participants: Participant[]
): string {
  const parts = participants.map(p => {
    const localHour = utcToLocalHour(utcHour, p.timezone)
    return `${p.name || p.email}: ${formatHour(localHour)}`
  })
  return parts.join(' | ')
}

/**
 * Get emoji indicator for sharpness level
 */
export function getSharpnessEmoji(sharpness: number): string {
  if (sharpness >= 0.9) return '🔥'  // Peak performance
  if (sharpness >= 0.7) return '☀️'  // High energy
  if (sharpness >= 0.5) return '🌤️'  // Moderate
  if (sharpness >= 0.3) return '🌙'  // Low energy
  return '😴'  // Very low / sleeping
}

/**
 * Get text description for quality score
 */
export function getQualityDescription(qualityScore: number): string {
  if (qualityScore >= 80) return 'Excellent - everyone is at peak energy'
  if (qualityScore >= 65) return 'Good - solid energy across the team'
  if (qualityScore >= 50) return 'Acceptable - some participants not at peak'
  return 'Poor - low energy for multiple participants'
}
