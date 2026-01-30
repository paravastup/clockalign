/**
 * Golden Windows Unit Tests (CA-038)
 * 
 * Tests for the overlap detection algorithm and energy-weighted scoring.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DateTime } from 'luxon'
import {
  getSharpness,
  isHourAvailable,
  utcToLocalHour,
  calculateOverlapWindow,
  calculateQualityScore,
  findBestTimes,
  findAllOverlapWindows,
  findValidOverlapWindows,
  generateHeatmapData,
  getRecommendation,
  generateSlotSummary,
  parseUserPreferences,
  workHoursToUnavailable,
  getChronotypeEnergyCurve,
  DEFAULT_ENERGY_CURVE,
  DEFAULT_UNAVAILABLE_HOURS,
  Participant,
  ParticipantWindow
} from '@/lib/golden-windows'

// ============================================
// TEST FIXTURES
// ============================================

const createTestParticipant = (
  id: string,
  timezone: string,
  overrides: Partial<Participant> = {}
): Participant => ({
  id,
  email: `${id}@test.com`,
  name: id.charAt(0).toUpperCase() + id.slice(1),
  timezone,
  ...overrides
})

// Three participants across major timezone differences
const testParticipants = {
  sf: createTestParticipant('dana', 'America/Los_Angeles'),  // UTC-8
  london: createTestParticipant('tom', 'Europe/London'),      // UTC+0
  bangalore: createTestParticipant('priya', 'Asia/Kolkata'),  // UTC+5:30
}

// ============================================
// ENERGY CURVE TESTS
// ============================================

describe('Energy Curve Functions', () => {
  describe('getSharpness', () => {
    it('returns default energy curve values', () => {
      expect(getSharpness(10)).toBe(0.95) // Golden hour
      expect(getSharpness(13)).toBe(0.65) // Post-lunch dip
      expect(getSharpness(2)).toBe(0.15)  // Night
    })
    
    it('uses custom curve when provided', () => {
      const customCurve = { 10: 0.5, 13: 0.9 }
      expect(getSharpness(10, customCurve)).toBe(0.5)
      expect(getSharpness(13, customCurve)).toBe(0.9)
    })
    
    it('falls back to 0.5 for undefined hours in custom curve', () => {
      const customCurve = { 10: 0.9 }
      expect(getSharpness(15, customCurve)).toBe(0.5)
    })
  })
  
  describe('isHourAvailable', () => {
    it('marks default unavailable hours (0-5)', () => {
      expect(isHourAvailable(0)).toBe(false)
      expect(isHourAvailable(3)).toBe(false)
      expect(isHourAvailable(5)).toBe(false)
      expect(isHourAvailable(6)).toBe(true)
      expect(isHourAvailable(12)).toBe(true)
    })
    
    it('uses custom unavailable hours', () => {
      const customUnavailable = [0, 1, 2, 22, 23]
      expect(isHourAvailable(0, customUnavailable)).toBe(false)
      expect(isHourAvailable(22, customUnavailable)).toBe(false)
      expect(isHourAvailable(10, customUnavailable)).toBe(true)
    })
  })
  
  describe('getChronotypeEnergyCurve', () => {
    it('returns different curves for different chronotypes', () => {
      const earlyBird = getChronotypeEnergyCurve('early_bird')
      const normal = getChronotypeEnergyCurve('normal')
      const nightOwl = getChronotypeEnergyCurve('night_owl')
      
      // Early bird peaks in morning
      expect(earlyBird[7]).toBeGreaterThan(normal[7])
      expect(earlyBird[20]).toBeLessThan(nightOwl[20])
      
      // Night owl peaks in evening
      expect(nightOwl[17]).toBeGreaterThan(normal[17])
      expect(nightOwl[21]).toBeGreaterThan(earlyBird[21])
    })
  })
})

// ============================================
// TIMEZONE CONVERSION TESTS
// ============================================

describe('Timezone Conversion', () => {
  describe('utcToLocalHour', () => {
    it('converts UTC to local time correctly', () => {
      // Note: These tests assume standard time, not DST
      // SF is UTC-8
      expect(utcToLocalHour(17, 'America/Los_Angeles')).toBe(9) // 5 PM UTC = 9 AM SF
      expect(utcToLocalHour(0, 'America/Los_Angeles')).toBe(16) // 12 AM UTC = 4 PM SF (prev day)
      
      // London is UTC+0
      expect(utcToLocalHour(14, 'Europe/London')).toBe(14)
      
      // Bangalore is UTC+5:30
      expect(utcToLocalHour(6, 'Asia/Kolkata')).toBe(11) // 6 AM UTC = 11:30 AM Bangalore
    })
  })
  
  describe('workHoursToUnavailable', () => {
    it('generates unavailable hours outside work window', () => {
      const unavailable = workHoursToUnavailable(9, 18)
      
      expect(unavailable).toContain(0)
      expect(unavailable).toContain(8)
      expect(unavailable).not.toContain(9)
      expect(unavailable).not.toContain(17)
      expect(unavailable).toContain(18)
      expect(unavailable).toContain(23)
    })
  })
})

// ============================================
// OVERLAP DETECTION TESTS (CA-031)
// ============================================

describe('Overlap Detection Algorithm', () => {
  const referenceDate = DateTime.utc(2025, 2, 1)
  
  describe('calculateOverlapWindow', () => {
    it('calculates overlap for single participant', () => {
      const participants = [testParticipants.sf]
      const window = calculateOverlapWindow(participants, 17, referenceDate)
      
      expect(window.utcStart.hour).toBe(17)
      expect(window.participants).toHaveLength(1)
      expect(window.participants[0].participant.id).toBe('dana')
      expect(window.goldenScore).toBeGreaterThan(0)
    })
    
    it('calculates overlap for multiple participants', () => {
      const participants = [
        testParticipants.sf,
        testParticipants.london,
        testParticipants.bangalore
      ]
      const window = calculateOverlapWindow(participants, 14, referenceDate) // 2 PM UTC
      
      expect(window.participants).toHaveLength(3)
      expect(window.allAvailable).toBeDefined()
      expect(window.goldenScore).toBeGreaterThanOrEqual(0)
      expect(window.goldenScore).toBeLessThanOrEqual(100)
    })
    
    it('correctly identifies when all participants are available', () => {
      // All participants with default work hours should be available during work hours
      const participants = [
        createTestParticipant('a', 'UTC', { unavailableHours: [0, 1, 2] }),
        createTestParticipant('b', 'UTC', { unavailableHours: [0, 1, 2] })
      ]
      
      const windowAt10 = calculateOverlapWindow(participants, 10, referenceDate)
      const windowAt1 = calculateOverlapWindow(participants, 1, referenceDate)
      
      expect(windowAt10.allAvailable).toBe(true)
      expect(windowAt1.allAvailable).toBe(false)
    })
  })
  
  describe('findAllOverlapWindows', () => {
    it('returns 24 windows for a full day', () => {
      const participants = [testParticipants.sf]
      const windows = findAllOverlapWindows(participants, referenceDate)
      
      expect(windows).toHaveLength(24)
      expect(windows[0].utcStart.hour).toBe(0)
      expect(windows[23].utcStart.hour).toBe(23)
    })
  })
  
  describe('findValidOverlapWindows', () => {
    it('filters to only times when everyone is available', () => {
      const participants = [
        createTestParticipant('a', 'UTC', { unavailableHours: [0, 1, 2, 3, 4, 5, 22, 23] }),
        createTestParticipant('b', 'UTC', { unavailableHours: [0, 1, 2, 3, 4, 5, 22, 23] })
      ]
      
      const validWindows = findValidOverlapWindows(participants, referenceDate)
      
      // Should exclude hours 0-5 and 22-23
      expect(validWindows.length).toBeLessThan(24)
      expect(validWindows.every(w => w.allAvailable)).toBe(true)
    })
  })
})

// ============================================
// ENERGY-WEIGHTED SCORING TESTS (CA-032)
// ============================================

describe('Energy-Weighted Overlap Scoring', () => {
  describe('calculateQualityScore', () => {
    it('returns 0 for empty participant list', () => {
      expect(calculateQualityScore([])).toBe(0)
    })
    
    it('gives higher scores when all participants have high sharpness', () => {
      const highSharpness: ParticipantWindow[] = [
        { sharpness: 0.95, isAvailable: true } as ParticipantWindow,
        { sharpness: 0.90, isAvailable: true } as ParticipantWindow
      ]
      
      const lowSharpness: ParticipantWindow[] = [
        { sharpness: 0.30, isAvailable: true } as ParticipantWindow,
        { sharpness: 0.35, isAvailable: true } as ParticipantWindow
      ]
      
      const highScore = calculateQualityScore(highSharpness)
      const lowScore = calculateQualityScore(lowSharpness)
      
      expect(highScore).toBeGreaterThan(lowScore)
    })
    
    it('heavily penalizes when someone is unavailable', () => {
      const allAvailable: ParticipantWindow[] = [
        { sharpness: 0.70, isAvailable: true } as ParticipantWindow,
        { sharpness: 0.70, isAvailable: true } as ParticipantWindow
      ]
      
      const oneUnavailable: ParticipantWindow[] = [
        { sharpness: 0.70, isAvailable: true } as ParticipantWindow,
        { sharpness: 0.70, isAvailable: false } as ParticipantWindow
      ]
      
      const availableScore = calculateQualityScore(allAvailable)
      const unavailableScore = calculateQualityScore(oneUnavailable)
      
      // Unavailable should get ~70% penalty
      expect(unavailableScore).toBeLessThan(availableScore * 0.5)
    })
    
    it('considers minimum sharpness (weakest link)', () => {
      // One person at peak, one at low energy
      const uneven: ParticipantWindow[] = [
        { sharpness: 0.95, isAvailable: true } as ParticipantWindow,
        { sharpness: 0.20, isAvailable: true } as ParticipantWindow
      ]
      
      // Both at moderate energy
      const even: ParticipantWindow[] = [
        { sharpness: 0.60, isAvailable: true } as ParticipantWindow,
        { sharpness: 0.60, isAvailable: true } as ParticipantWindow
      ]
      
      const unevenScore = calculateQualityScore(uneven)
      const evenScore = calculateQualityScore(even)
      
      // Even distribution should score higher due to weakest link consideration
      expect(evenScore).toBeGreaterThan(unevenScore)
    })
  })
  
  describe('getRecommendation', () => {
    it('categorizes quality scores correctly', () => {
      expect(getRecommendation(85)).toBe('excellent')
      expect(getRecommendation(70)).toBe('good')
      expect(getRecommendation(55)).toBe('acceptable')
      expect(getRecommendation(30)).toBe('poor')
    })
  })
  
  describe('generateSlotSummary', () => {
    const referenceDate = DateTime.utc(2025, 2, 1)
    
    it('generates summary for excellent slot', () => {
      const participants = [
        createTestParticipant('a', 'UTC', { 
          energyCurve: { 10: 0.95 }, 
          unavailableHours: [] 
        })
      ]
      const window = calculateOverlapWindow(participants, 10, referenceDate)
      const summary = generateSlotSummary(window)
      
      expect(summary).toContain('energy')
    })
    
    it('generates summary when participants unavailable', () => {
      const participants = [
        createTestParticipant('a', 'UTC', { unavailableHours: [3] }),
        createTestParticipant('b', 'UTC', { unavailableHours: [3] })
      ]
      const window = calculateOverlapWindow(participants, 3, referenceDate)
      const summary = generateSlotSummary(window)
      
      expect(summary).toContain('unavailable')
    })
  })
})

// ============================================
// BEST TIMES FINDER TESTS
// ============================================

describe('Best Times Finder', () => {
  const referenceDate = DateTime.utc(2025, 2, 1)
  
  describe('findBestTimes', () => {
    it('returns requested number of slots', () => {
      const participants = [testParticipants.sf, testParticipants.london]
      const bestTimes = findBestTimes(participants, { topN: 3, referenceDate })
      
      expect(bestTimes.length).toBeLessThanOrEqual(3)
    })
    
    it('ranks slots by quality score descending', () => {
      const participants = [testParticipants.sf]
      const bestTimes = findBestTimes(participants, { topN: 10, referenceDate })
      
      for (let i = 1; i < bestTimes.length; i++) {
        expect(bestTimes[i - 1].qualityScore).toBeGreaterThanOrEqual(bestTimes[i].qualityScore)
      }
    })
    
    it('assigns ranks correctly', () => {
      const participants = [testParticipants.sf]
      const bestTimes = findBestTimes(participants, { topN: 5, referenceDate })
      
      bestTimes.forEach((slot, index) => {
        expect(slot.rank).toBe(index + 1)
      })
    })
    
    it('respects requireAllAvailable option', () => {
      const participants = [
        createTestParticipant('a', 'UTC', { unavailableHours: [10, 11, 12] }),
        createTestParticipant('b', 'UTC', { unavailableHours: [] })
      ]
      
      const withRequirement = findBestTimes(participants, { 
        requireAllAvailable: true,
        referenceDate 
      })
      const withoutRequirement = findBestTimes(participants, { 
        requireAllAvailable: false,
        referenceDate 
      })
      
      expect(withRequirement.every(s => s.allAvailable)).toBe(true)
      expect(withoutRequirement.length).toBeGreaterThanOrEqual(withRequirement.length)
    })
    
    it('respects minQualityScore filter', () => {
      const participants = [testParticipants.sf]
      const bestTimes = findBestTimes(participants, { 
        minQualityScore: 60,
        referenceDate 
      })
      
      expect(bestTimes.every(s => s.qualityScore >= 60)).toBe(true)
    })
  })
})

// ============================================
// HEATMAP DATA TESTS
// ============================================

describe('Heatmap Data Generation', () => {
  const referenceDate = DateTime.utc(2025, 2, 1)
  
  describe('generateHeatmapData', () => {
    it('generates 24 hours of data', () => {
      const participants = [testParticipants.sf]
      const heatmap = generateHeatmapData(participants, referenceDate)
      
      expect(heatmap.hours).toHaveLength(24)
      expect(heatmap.combinedScores).toHaveLength(24)
    })
    
    it('generates a row for each participant', () => {
      const participants = [
        testParticipants.sf,
        testParticipants.london,
        testParticipants.bangalore
      ]
      const heatmap = generateHeatmapData(participants, referenceDate)
      
      expect(heatmap.rows).toHaveLength(3)
    })
    
    it('generates 24 cells per participant row', () => {
      const participants = [testParticipants.sf]
      const heatmap = generateHeatmapData(participants, referenceDate)
      
      expect(heatmap.rows[0].cells).toHaveLength(24)
    })
    
    it('includes correct participant info in rows', () => {
      const participants = [testParticipants.sf]
      const heatmap = generateHeatmapData(participants, referenceDate)
      
      expect(heatmap.rows[0].participantId).toBe('dana')
      expect(heatmap.rows[0].participantName).toBe('Dana')
      expect(heatmap.rows[0].timezone).toBe('America/Los_Angeles')
    })
    
    it('calculates correct intensity values', () => {
      const participants = [
        createTestParticipant('test', 'UTC', { 
          energyCurve: { 10: 0.9 },
          unavailableHours: [3]
        })
      ]
      const heatmap = generateHeatmapData(participants, referenceDate)
      
      const cell10 = heatmap.rows[0].cells[10]
      const cell3 = heatmap.rows[0].cells[3]
      
      expect(cell10.intensity).toBe(90) // 0.9 * 100
      expect(cell3.intensity).toBe(0)   // Unavailable
    })
  })
})

// ============================================
// USER PREFERENCES PARSING TESTS
// ============================================

describe('User Preferences Parsing', () => {
  describe('parseUserPreferences', () => {
    it('creates participant with default values', () => {
      const participant = parseUserPreferences(
        'user-1',
        'test@example.com',
        'Test User',
        'UTC',
        {}
      )
      
      expect(participant.id).toBe('user-1')
      expect(participant.email).toBe('test@example.com')
      expect(participant.name).toBe('Test User')
      expect(participant.timezone).toBe('UTC')
      expect(participant.energyCurve).toEqual(getChronotypeEnergyCurve('normal'))
    })
    
    it('applies chronotype-based energy curve', () => {
      const earlyBird = parseUserPreferences(
        'user-1',
        'test@example.com',
        'Test',
        'UTC',
        { chronotype: 'early_bird' }
      )
      
      expect(earlyBird.energyCurve).toEqual(getChronotypeEnergyCurve('early_bird'))
    })
    
    it('uses custom energy curve when provided', () => {
      const customCurve = { 10: 0.99, 14: 0.88 }
      const participant = parseUserPreferences(
        'user-1',
        'test@example.com',
        'Test',
        'UTC',
        { customEnergyCurve: customCurve }
      )
      
      expect(participant.energyCurve).toEqual(customCurve)
    })
    
    it('generates unavailable hours from work hours', () => {
      const participant = parseUserPreferences(
        'user-1',
        'test@example.com',
        'Test',
        'UTC',
        { workStartHour: 10, workEndHour: 16 }
      )
      
      // Should be unavailable before 10 and after 16
      expect(participant.unavailableHours).toContain(9)
      expect(participant.unavailableHours).toContain(16)
      expect(participant.unavailableHours).not.toContain(10)
      expect(participant.unavailableHours).not.toContain(15)
    })
  })
})

// ============================================
// EDGE CASES AND REAL-WORLD SCENARIOS
// ============================================

describe('Real-World Scenarios', () => {
  const referenceDate = DateTime.utc(2025, 2, 1)
  
  it('handles SF-London-Bangalore scenario correctly', () => {
    const participants = [
      testParticipants.sf,       // UTC-8
      testParticipants.london,   // UTC+0  
      testParticipants.bangalore // UTC+5:30
    ]
    
    const bestTimes = findBestTimes(participants, { 
      topN: 3, 
      referenceDate,
      requireAllAvailable: true 
    })
    
    // Should find some valid times
    expect(bestTimes.length).toBeGreaterThan(0)
    
    // All slots should have all participants available
    bestTimes.forEach(slot => {
      expect(slot.allAvailable).toBe(true)
      expect(slot.participants).toHaveLength(3)
    })
  })
  
  it('handles single participant correctly', () => {
    const participants = [testParticipants.sf]
    const bestTimes = findBestTimes(participants, { topN: 3, referenceDate })
    
    expect(bestTimes.length).toBeGreaterThan(0)
    expect(bestTimes[0].participants).toHaveLength(1)
  })
  
  it('handles participants with no overlap gracefully', () => {
    // One only available in morning, other only in evening
    const participants = [
      createTestParticipant('morning', 'UTC', { 
        unavailableHours: Array.from({ length: 24 }, (_, i) => i).filter(h => h < 6 || h >= 12)
      }),
      createTestParticipant('evening', 'UTC', { 
        unavailableHours: Array.from({ length: 24 }, (_, i) => i).filter(h => h < 18 || h >= 24)
      })
    ]
    
    const bestTimes = findBestTimes(participants, { 
      requireAllAvailable: true,
      referenceDate 
    })
    
    // Should return empty array - no overlap
    expect(bestTimes).toHaveLength(0)
  })
  
  it('correctly identifies golden hours for cross-timezone teams', () => {
    const participants = [
      testParticipants.sf,
      testParticipants.london
    ]
    
    const allWindows = findAllOverlapWindows(participants, referenceDate)
    const validWindows = allWindows.filter(w => w.allAvailable)
    
    // Find the best window
    const bestWindow = validWindows.reduce((best, current) => 
      current.goldenScore > best.goldenScore ? current : best
    , validWindows[0])
    
    if (bestWindow) {
      // The best window should have a reasonable golden score
      expect(bestWindow.goldenScore).toBeGreaterThan(40)
    }
  })
})
