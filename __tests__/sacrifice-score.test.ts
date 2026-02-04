/**
 * Unit Tests: Sacrifice Score Calculation
 * CA-029: Test the pain weight algorithm and score calculation
 */

import { describe, it, expect } from 'vitest'
import {
  getPainWeight,
  getPainWeightTable,
  calculateSacrificeScore,
  calculateScoreForTimezone,
  calculateMeetingTotalSacrifice,
  calculateLeaderboard,
  aggregateScoreHistory,
  getCategoryColor,
  getImpactEmoji,
  formatPoints,
  getRankMedal,
} from '@/lib/sacrifice-score'
import { DateTime } from 'luxon'

describe('Pain Weight Algorithm', () => {
  describe('getPainWeight', () => {
    it('should return golden hours (1 pt) for 10 AM - 3 PM', () => {
      for (const hour of [10, 11, 12, 13, 14, 15]) {
        const result = getPainWeight(hour)
        expect(result.basePoints).toBe(1)
        expect(result.category).toBe('golden')
        expect(result.impactLevel).toBe('minimal')
      }
    })
    
    it('should return good hours (1.5 pts) for 9 AM and 4 PM', () => {
      expect(getPainWeight(9).basePoints).toBe(1.5)
      expect(getPainWeight(9).category).toBe('good')
      expect(getPainWeight(16).basePoints).toBe(1.5)
      expect(getPainWeight(16).category).toBe('good')
    })
    
    it('should return acceptable hours (2 pts) for 8 AM and 5 PM', () => {
      expect(getPainWeight(8).basePoints).toBe(2)
      expect(getPainWeight(8).category).toBe('acceptable')
      expect(getPainWeight(17).basePoints).toBe(2)
      expect(getPainWeight(17).category).toBe('acceptable')
    })
    
    it('should return early morning (3 pts) for 7 AM', () => {
      const result = getPainWeight(7)
      expect(result.basePoints).toBe(3)
      expect(result.category).toBe('early_morning')
      expect(result.impactLevel).toBe('medium')
    })
    
    it('should return evening (3 pts) for 6-7 PM', () => {
      expect(getPainWeight(18).basePoints).toBe(3)
      expect(getPainWeight(18).category).toBe('evening')
      expect(getPainWeight(19).basePoints).toBe(3)
      expect(getPainWeight(19).category).toBe('evening')
    })
    
    it('should return late evening (4 pts) for 8 PM', () => {
      const result = getPainWeight(20)
      expect(result.basePoints).toBe(4)
      expect(result.category).toBe('late_evening')
      expect(result.impactLevel).toBe('high')
    })
    
    it('should return night (5 pts) for 9 PM', () => {
      const result = getPainWeight(21)
      expect(result.basePoints).toBe(5)
      expect(result.category).toBe('night')
      expect(result.impactLevel).toBe('severe')
    })
    
    it('should return late night (6 pts) for 10 PM', () => {
      const result = getPainWeight(22)
      expect(result.basePoints).toBe(6)
      expect(result.category).toBe('late_night')
      expect(result.impactLevel).toBe('severe')
    })
    
    it('should return graveyard (10 pts) for 11 PM - 6 AM', () => {
      for (const hour of [23, 0, 1, 2, 3, 4, 5, 6]) {
        const result = getPainWeight(hour)
        expect(result.basePoints).toBe(10)
        expect(result.category).toBe('graveyard')
        expect(result.impactLevel).toBe('extreme')
      }
    })
    
    it('should handle negative hours by normalizing', () => {
      const result = getPainWeight(-2) // Should be 22 (10 PM)
      expect(result.basePoints).toBe(6)
    })
    
    it('should handle hours >= 24 by normalizing', () => {
      const result = getPainWeight(26) // Should be 2 (2 AM)
      expect(result.basePoints).toBe(10)
      expect(result.category).toBe('graveyard')
    })
  })
  
  describe('getPainWeightTable', () => {
    it('should return a map with 24 entries', () => {
      const table = getPainWeightTable()
      expect(table.size).toBe(24)
    })
    
    it('should have valid entries for all hours', () => {
      const table = getPainWeightTable()
      for (let hour = 0; hour < 24; hour++) {
        const entry = table.get(hour)
        expect(entry).toBeDefined()
        expect(entry!.basePoints).toBeGreaterThan(0)
        expect(entry!.category).toBeDefined()
      }
    })
  })
})

describe('Score Calculation', () => {
  describe('calculateSacrificeScore', () => {
    it('should calculate base score for golden hour', () => {
      const result = calculateSacrificeScore({ localHour: 10 })
      expect(result.basePoints).toBe(1)
      expect(result.points).toBe(1)
      expect(result.category).toBe('golden')
    })
    
    it('should apply duration multiplier', () => {
      // 60 min meeting = 2x multiplier
      const result = calculateSacrificeScore({ 
        localHour: 10, 
        durationMinutes: 60 
      })
      expect(result.points).toBe(2) // 1 base * 2 duration
      expect(result.multipliers.duration).toBe(2)
    })
    
    it('should apply recurring multiplier', () => {
      const result = calculateSacrificeScore({ 
        localHour: 10, 
        isRecurring: true 
      })
      expect(result.points).toBe(1.5) // 1 base * 1.5 recurring
      expect(result.multipliers.recurring).toBe(1.5)
    })
    
    it('should apply organizer discount', () => {
      const result = calculateSacrificeScore({ 
        localHour: 10, 
        isOrganizer: true 
      })
      expect(result.points).toBe(0.8) // 1 base * 0.8 organizer
      expect(result.multipliers.organizer).toBe(0.8)
    })
    
    it('should combine multiple multipliers', () => {
      const result = calculateSacrificeScore({
        localHour: 21, // 5 pts base (night)
        durationMinutes: 60, // 2x
        isRecurring: true, // 1.5x
        isOrganizer: true, // 0.8x
      })
      // 5 * 2 * 1.5 * 0.8 = 12
      expect(result.points).toBe(12)
      expect(result.multipliers.total).toBeCloseTo(2.4) // 2 * 1.5 * 0.8
    })
    
    it('should include breakdown string', () => {
      const result = calculateSacrificeScore({
        localHour: 21,
        durationMinutes: 60,
        isRecurring: true,
      })
      expect(result.breakdown).toContain('Base: 5 pts')
      expect(result.breakdown).toContain('Duration: ×2.0')
      expect(result.breakdown).toContain('Recurring: ×1.5')
    })
    
    it('should apply custom multiplier', () => {
      const result = calculateSacrificeScore({
        localHour: 10,
        customMultiplier: 2,
      })
      expect(result.points).toBe(2)
      expect(result.multipliers.custom).toBe(2)
    })
  })
  
  describe('calculateScoreForTimezone', () => {
    it('should convert UTC time to local timezone', () => {
      // 5 PM UTC = 12 PM EST (noon) = golden hour
      const utcTime = DateTime.fromISO('2025-02-01T17:00:00Z')
      const result = calculateScoreForTimezone(utcTime, 'America/New_York')
      expect(result.category).toBe('golden') // 12 PM EST
    })
    
    it('should handle different timezones correctly', () => {
      // 2 PM UTC
      const utcTime = DateTime.fromISO('2025-02-01T14:00:00Z')
      
      // London: 2 PM = golden
      const london = calculateScoreForTimezone(utcTime, 'Europe/London')
      expect(london.category).toBe('golden')
      
      // Mumbai: 7:30 PM = evening
      const mumbai = calculateScoreForTimezone(utcTime, 'Asia/Kolkata')
      expect(mumbai.category).toBe('evening')
      
      // LA: 6 AM = graveyard
      const la = calculateScoreForTimezone(utcTime, 'America/Los_Angeles')
      expect(la.category).toBe('graveyard')
    })
    
    it('should accept string ISO dates', () => {
      const result = calculateScoreForTimezone(
        '2025-02-01T12:00:00Z',
        'Europe/London'
      )
      expect(result.category).toBe('golden') // 12 PM
    })
    
    it('should pass through options', () => {
      const result = calculateScoreForTimezone(
        '2025-02-01T12:00:00Z',
        'Europe/London',
        { durationMinutes: 60, isRecurring: true }
      )
      expect(result.multipliers.duration).toBe(2)
      expect(result.multipliers.recurring).toBe(1.5)
    })
  })
  
  describe('calculateMeetingTotalSacrifice', () => {
    it('should sum total sacrifice points', () => {
      const scores = [
        { points: 1, basePoints: 1, category: 'golden' as const, impactLevel: 'minimal', multipliers: { duration: 1, recurring: 1, organizer: 1, custom: 1, total: 1 }, breakdown: '' },
        { points: 3, basePoints: 3, category: 'evening' as const, impactLevel: 'medium', multipliers: { duration: 1, recurring: 1, organizer: 1, custom: 1, total: 1 }, breakdown: '' },
        { points: 5, basePoints: 5, category: 'night' as const, impactLevel: 'severe', multipliers: { duration: 1, recurring: 1, organizer: 1, custom: 1, total: 1 }, breakdown: '' },
      ]
      const result = calculateMeetingTotalSacrifice(scores)
      expect(result.totalPoints).toBe(9)
      expect(result.averagePoints).toBe(3)
      expect(result.maxPoints).toBe(5)
    })
    
    it('should calculate fairness index', () => {
      // Equal distribution = high fairness
      const equalScores = [
        { points: 3, basePoints: 3, category: 'evening' as const, impactLevel: 'medium', multipliers: { duration: 1, recurring: 1, organizer: 1, custom: 1, total: 1 }, breakdown: '' },
        { points: 3, basePoints: 3, category: 'evening' as const, impactLevel: 'medium', multipliers: { duration: 1, recurring: 1, organizer: 1, custom: 1, total: 1 }, breakdown: '' },
        { points: 3, basePoints: 3, category: 'evening' as const, impactLevel: 'medium', multipliers: { duration: 1, recurring: 1, organizer: 1, custom: 1, total: 1 }, breakdown: '' },
      ]
      const equalResult = calculateMeetingTotalSacrifice(equalScores)
      expect(equalResult.fairnessIndex).toBe(1) // Perfect fairness
      
      // Unequal distribution = lower fairness
      const unequalScores = [
        { points: 1, basePoints: 1, category: 'golden' as const, impactLevel: 'minimal', multipliers: { duration: 1, recurring: 1, organizer: 1, custom: 1, total: 1 }, breakdown: '' },
        { points: 1, basePoints: 1, category: 'golden' as const, impactLevel: 'minimal', multipliers: { duration: 1, recurring: 1, organizer: 1, custom: 1, total: 1 }, breakdown: '' },
        { points: 10, basePoints: 10, category: 'graveyard' as const, impactLevel: 'extreme', multipliers: { duration: 1, recurring: 1, organizer: 1, custom: 1, total: 1 }, breakdown: '' },
      ]
      const unequalResult = calculateMeetingTotalSacrifice(unequalScores)
      expect(unequalResult.fairnessIndex).toBeLessThan(1)
    })
    
    it('should detect imbalance warning', () => {
      const scores = [
        { points: 1, basePoints: 1, category: 'golden' as const, impactLevel: 'minimal', multipliers: { duration: 1, recurring: 1, organizer: 1, custom: 1, total: 1 }, breakdown: '' },
        { points: 1, basePoints: 1, category: 'golden' as const, impactLevel: 'minimal', multipliers: { duration: 1, recurring: 1, organizer: 1, custom: 1, total: 1 }, breakdown: '' },
        { points: 10, basePoints: 10, category: 'graveyard' as const, impactLevel: 'extreme', multipliers: { duration: 1, recurring: 1, organizer: 1, custom: 1, total: 1 }, breakdown: '' },
      ]
      const result = calculateMeetingTotalSacrifice(scores)
      expect(result.imbalanceWarning).toBeTruthy()
      expect(result.imbalanceWarning).toContain('Participant 3')
    })
    
    it('should handle empty input', () => {
      const result = calculateMeetingTotalSacrifice([])
      expect(result.totalPoints).toBe(0)
      expect(result.fairnessIndex).toBe(1)
      expect(result.imbalanceWarning).toBeNull()
    })
  })
})

describe('Leaderboard Calculations', () => {
  describe('calculateLeaderboard', () => {
    const mockUsers = new Map([
      ['user1', { name: 'Alice', email: 'alice@test.com', timezone: 'America/New_York' }],
      ['user2', { name: 'Bob', email: 'bob@test.com', timezone: 'Europe/London' }],
      ['user3', { name: 'Charlie', email: 'charlie@test.com', timezone: 'Asia/Tokyo' }],
    ])
    
    const mockScores = [
      { userId: 'user1', points: 10, category: 'graveyard', meetingSlotId: 'slot1' },
      { userId: 'user1', points: 5, category: 'night', meetingSlotId: 'slot2' },
      { userId: 'user2', points: 3, category: 'evening', meetingSlotId: 'slot1' },
      { userId: 'user2', points: 2, category: 'acceptable', meetingSlotId: 'slot2' },
      { userId: 'user3', points: 1, category: 'golden', meetingSlotId: 'slot1' },
    ]
    
    it('should rank users by total sacrifice (descending)', () => {
      const result = calculateLeaderboard(mockScores, mockUsers)
      
      expect(result[0].userId).toBe('user1') // 15 pts
      expect(result[0].rank).toBe(1)
      expect(result[0].totalPoints).toBe(15)
      
      expect(result[1].userId).toBe('user2') // 5 pts
      expect(result[1].rank).toBe(2)
      
      expect(result[2].userId).toBe('user3') // 1 pt
      expect(result[2].rank).toBe(3)
    })
    
    it('should calculate meeting count correctly', () => {
      const result = calculateLeaderboard(mockScores, mockUsers)
      expect(result[0].meetingCount).toBe(2) // user1 has 2 slots
      expect(result[1].meetingCount).toBe(2) // user2 has 2 slots
      expect(result[2].meetingCount).toBe(1) // user3 has 1 slot
    })
    
    it('should count worst slot categories', () => {
      const result = calculateLeaderboard(mockScores, mockUsers)
      const alice = result.find(r => r.userId === 'user1')!
      expect(alice.worstSlotCount.graveyard).toBe(1)
      expect(alice.worstSlotCount.night).toBe(1)
    })
    
    it('should calculate percent of total', () => {
      const result = calculateLeaderboard(mockScores, mockUsers)
      const totalPoints = 15 + 5 + 1 // 21
      expect(result[0].percentOfTotal).toBe(Math.round((15 / 21) * 100))
    })
    
    it('should determine fairness status', () => {
      const result = calculateLeaderboard(mockScores, mockUsers)
      // user1 has 15 pts, avg is 7 pts, so 15/7 = 2.14x = high_sacrifice
      expect(result[0].fairnessStatus).toBe('high_sacrifice')
    })
    
    it('should calculate trend when previous period provided', () => {
      const prevPeriod = new Map([
        ['user1', 10], // was 10, now 15 = +50%
        ['user2', 10], // was 10, now 5 = -50%
        ['user3', 1],  // was 1, now 1 = stable
      ])
      
      const result = calculateLeaderboard(mockScores, mockUsers, prevPeriod)
      
      const alice = result.find(r => r.userId === 'user1')!
      expect(alice.trend).toBe('up')
      
      const bob = result.find(r => r.userId === 'user2')!
      expect(bob.trend).toBe('down')
    })
  })
})

describe('Score History', () => {
  describe('aggregateScoreHistory', () => {
    it('should aggregate scores by date', () => {
      const now = DateTime.now()
      const scores = [
        { calculatedAt: now.toISO()!, points: 5, category: 'night' },
        { calculatedAt: now.toISO()!, points: 3, category: 'evening' },
        { calculatedAt: now.minus({ days: 1 }).toISO()!, points: 2, category: 'acceptable' },
      ]
      
      const result = aggregateScoreHistory(scores, 7)
      const today = result.find(d => d.date === now.toISODate())
      
      expect(today).toBeDefined()
      expect(today!.points).toBe(8)
      expect(today!.meetingCount).toBe(2)
    })
    
    it('should include all days in range', () => {
      const result = aggregateScoreHistory([], 7)
      expect(result.length).toBe(7)
    })
    
    it('should sort by date ascending', () => {
      const result = aggregateScoreHistory([], 7)
      for (let i = 1; i < result.length; i++) {
        expect(result[i].date > result[i - 1].date).toBe(true)
      }
    })
  })
})

describe('Utility Functions', () => {
  describe('getCategoryColor', () => {
    it('should return color classes for each category', () => {
      const categories = [
        'golden', 'good', 'acceptable', 'early_morning', 
        'evening', 'late_evening', 'night', 'late_night', 'graveyard'
      ] as const
      
      for (const category of categories) {
        const colors = getCategoryColor(category)
        expect(colors.bg).toBeTruthy()
        expect(colors.text).toBeTruthy()
        expect(colors.border).toBeTruthy()
      }
    })
  })
  
  describe('getImpactEmoji', () => {
    it('should return appropriate emoji for impact level', () => {
      expect(getImpactEmoji('minimal')).toBe('😊')
      expect(getImpactEmoji('low')).toBe('🙂')
      expect(getImpactEmoji('medium')).toBe('😐')
      expect(getImpactEmoji('high')).toBe('😟')
      expect(getImpactEmoji('severe')).toBe('😩')
      expect(getImpactEmoji('extreme')).toBe('💀')
    })
    
    it('should handle unknown impact levels', () => {
      expect(getImpactEmoji('unknown')).toBe('❓')
    })
  })
  
  describe('formatPoints', () => {
    it('should format zero as "0"', () => {
      expect(formatPoints(0)).toBe('0')
    })
    
    it('should format small numbers with 1 decimal', () => {
      expect(formatPoints(1.5)).toBe('1.5')
      expect(formatPoints(3.75)).toBe('3.8')
    })
    
    it('should format large numbers as integers', () => {
      expect(formatPoints(10)).toBe('10')
      expect(formatPoints(142.5)).toBe('143')
    })
  })
  
  describe('getRankMedal', () => {
    it('should return medal emojis for top 3', () => {
      expect(getRankMedal(1)).toBe('🥇')
      expect(getRankMedal(2)).toBe('🥈')
      expect(getRankMedal(3)).toBe('🥉')
    })
    
    it('should return #N for ranks 4+', () => {
      expect(getRankMedal(4)).toBe('#4')
      expect(getRankMedal(10)).toBe('#10')
    })
  })
})
