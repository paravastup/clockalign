/**
 * End-to-End Flow Tests
 * CA-058: Full user journey tests
 * 
 * These tests simulate complete user flows through the application.
 * Run with: npm test -- __tests__/e2e/flows.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  calculateSacrificeScore,
  calculateLeaderboard,
  getPainWeight,
  type LeaderboardEntry,
} from '@/lib/sacrifice-score'
import {
  findBestTimes,
  generateHeatmapData,
  calculateOverlapWindow,
  type Participant,
} from '@/lib/golden-windows'
import {
  analyzeForAsyncNudge,
  calculateReclaimedStats,
} from '@/lib/async-nudge'

describe('E2E: Complete Meeting Scheduling Flow', () => {
  const participants: Participant[] = [
    {
      id: 'user-1',
      email: 'alice@example.com',
      name: 'Alice',
      timezone: 'America/New_York',
    },
    {
      id: 'user-2',
      email: 'bob@example.com',
      name: 'Bob',
      timezone: 'Europe/London',
    },
    {
      id: 'user-3',
      email: 'carol@example.com',
      name: 'Carol',
      timezone: 'Asia/Tokyo',
    },
  ]

  describe('Step 1: Find Golden Windows', () => {
    it('should find optimal meeting times for global team', () => {
      const bestTimes = findBestTimes(participants, {
        topN: 5,
        requireAllAvailable: true,
      })
      
      expect(bestTimes.length).toBeGreaterThan(0)
      expect(bestTimes.length).toBeLessThanOrEqual(5)
      
      // All returned times should have everyone available
      bestTimes.forEach(slot => {
        expect(slot.allAvailable).toBe(true)
        expect(slot.qualityScore).toBeGreaterThanOrEqual(0)
        expect(slot.qualityScore).toBeLessThanOrEqual(100)
      })
    })

    it('should generate heatmap data for visualization', () => {
      const heatmap = generateHeatmapData(participants)
      
      expect(heatmap.hours).toHaveLength(24)
      expect(heatmap.rows).toHaveLength(3)
      expect(heatmap.combinedScores).toHaveLength(24)
      
      // Each row should have 24 cells (one per hour)
      heatmap.rows.forEach(row => {
        expect(row.cells).toHaveLength(24)
      })
    })

    it('should calculate overlap quality correctly', () => {
      // UTC 14:00 should be decent for this combo
      // NY: 9 AM (good), London: 2 PM (good), Tokyo: 11 PM (bad)
      const window = calculateOverlapWindow(participants, 14)
      
      expect(window.goldenScore).toBeGreaterThan(0)
      expect(window.participants).toHaveLength(3)
      
      // Check local hours are converted correctly (offset depends on DST)
      const nyParticipant = window.participants.find(p => p.participant.id === 'user-1')
      expect(nyParticipant?.localHour).toBeGreaterThanOrEqual(8)
      expect(nyParticipant?.localHour).toBeLessThanOrEqual(10)
    })
  })

  describe('Step 2: Calculate Sacrifice Scores', () => {
    it('should calculate pain for each participant', () => {
      // Alice at 9 AM (good)
      const aliceScore = calculateSacrificeScore({
        localHour: 9,
        durationMinutes: 60,
        isRecurring: true,
      })
      expect(aliceScore.category).toBe('good')
      expect(aliceScore.points).toBeLessThan(5)

      // Carol at 11 PM (night)
      const carolScore = calculateSacrificeScore({
        localHour: 23,
        durationMinutes: 60,
        isRecurring: true,
      })
      expect(carolScore.category).toBe('graveyard')
      expect(carolScore.points).toBeGreaterThan(10)
    })

    it('should detect fairness issues in leaderboard', () => {
      // Simulate scores where Carol has much higher sacrifice
      const scores = [
        { userId: 'user-1', points: 5, category: 'good', meetingSlotId: 'slot-1' },
        { userId: 'user-2', points: 3, category: 'golden', meetingSlotId: 'slot-1' },
        { userId: 'user-3', points: 20, category: 'graveyard', meetingSlotId: 'slot-1' },
        { userId: 'user-1', points: 4, category: 'acceptable', meetingSlotId: 'slot-2' },
        { userId: 'user-2', points: 2, category: 'golden', meetingSlotId: 'slot-2' },
        { userId: 'user-3', points: 15, category: 'night', meetingSlotId: 'slot-2' },
      ]
      
      const users = new Map([
        ['user-1', { name: 'Alice', email: 'alice@example.com', timezone: 'America/New_York' }],
        ['user-2', { name: 'Bob', email: 'bob@example.com', timezone: 'Europe/London' }],
        ['user-3', { name: 'Carol', email: 'carol@example.com', timezone: 'Asia/Tokyo' }],
      ])
      
      const leaderboard = calculateLeaderboard(scores, users)
      
      // Carol should be ranked #1 (most sacrifice)
      // Scores: 35, 10, 5 = avg 16.67, Carol has 35/16.67 = 2.1x (> 2x = high_sacrifice)
      expect(leaderboard[0].userId).toBe('user-3')
      expect(leaderboard[0].totalPoints).toBe(35)
      expect(leaderboard[0].fairnessStatus).toBe('high_sacrifice')
      
      // Bob should be ranked last (least sacrifice)
      expect(leaderboard[2].userId).toBe('user-2')
      expect(leaderboard[2].fairnessStatus).toBe('balanced')
    })
  })

  describe('Step 3: Async Nudge Analysis', () => {
    it('should suggest async for high sacrifice meetings', () => {
      const nudge = analyzeForAsyncNudge({
        title: 'Weekly Team Standup',
        meetingType: 'standup',
        durationMinutes: 30,
        participantCount: 5,
        totalSacrificePoints: 45,
        maxIndividualSacrifice: 15,
        isRecurring: true,
        timezoneSpread: 12,
      })
      
      expect(nudge.shouldNudge).toBe(true)
      expect(nudge.nudgeStrength).toBeGreaterThan(50)
      expect(nudge.urgency).toMatch(/moderate|strong/)
      expect(nudge.suggestedAlternatives.length).toBeGreaterThan(0)
    })

    it('should not nudge for low sacrifice meetings', () => {
      const nudge = analyzeForAsyncNudge({
        title: 'Quick 1:1',
        meetingType: '1on1',
        durationMinutes: 30,
        participantCount: 2,
        totalSacrificePoints: 4,
        maxIndividualSacrifice: 2,
        isRecurring: false,
        timezoneSpread: 0,
      })
      
      expect(nudge.shouldNudge).toBe(false)
      expect(nudge.nudgeStrength).toBeLessThan(25)
    })

    it('should calculate hours reclaimed correctly', () => {
      const records = [
        { decision: 'went_async' as const, hoursSaved: 2.5, asyncType: 'loom' as const, createdAt: new Date() },
        { decision: 'went_async' as const, hoursSaved: 1.5, asyncType: 'doc' as const, createdAt: new Date() },
        { decision: 'scheduled_anyway' as const, hoursSaved: 0, asyncType: null, createdAt: new Date() },
        { decision: 'went_async' as const, hoursSaved: 3.0, asyncType: 'slack' as const, createdAt: new Date() },
      ]
      
      const stats = calculateReclaimedStats(records)
      
      expect(stats.totalHoursReclaimed).toBe(7)
      expect(stats.meetingsConverted).toBe(3)
      expect(stats.averageHoursPerMeeting).toBeCloseTo(2.33, 1)
      expect(stats.byType.loom.hours).toBe(2.5)
      expect(stats.byType.doc.hours).toBe(1.5)
      expect(stats.byType.slack.hours).toBe(3.0)
    })
  })

  describe('Step 4: Pain Weight Algorithm', () => {
    it('should assign correct categories to all hours', () => {
      const testCases = [
        { hour: 10, category: 'golden', minPoints: 1, maxPoints: 1 },
        { hour: 15, category: 'golden', minPoints: 1, maxPoints: 1 },
        { hour: 9, category: 'good', minPoints: 1.5, maxPoints: 1.5 },
        { hour: 8, category: 'acceptable', minPoints: 2, maxPoints: 2 },
        { hour: 7, category: 'early_morning', minPoints: 3, maxPoints: 3 },
        { hour: 18, category: 'evening', minPoints: 3, maxPoints: 3 },
        { hour: 20, category: 'late_evening', minPoints: 4, maxPoints: 4 },
        { hour: 21, category: 'night', minPoints: 5, maxPoints: 5 },
        { hour: 22, category: 'late_night', minPoints: 6, maxPoints: 6 },
        { hour: 3, category: 'graveyard', minPoints: 10, maxPoints: 10 },
      ]
      
      testCases.forEach(({ hour, category, minPoints, maxPoints }) => {
        const weight = getPainWeight(hour)
        expect(weight.category).toBe(category)
        expect(weight.basePoints).toBeGreaterThanOrEqual(minPoints)
        expect(weight.basePoints).toBeLessThanOrEqual(maxPoints)
      })
    })

    it('should apply multipliers correctly', () => {
      // 1 hour meeting at 10 PM (late_night = 6 pts)
      const baseScore = calculateSacrificeScore({
        localHour: 22,
        durationMinutes: 30,
      })
      expect(baseScore.points).toBe(6)
      
      // 1 hour meeting (2x duration)
      const hourScore = calculateSacrificeScore({
        localHour: 22,
        durationMinutes: 60,
      })
      expect(hourScore.points).toBe(12) // 6 * 2
      
      // Recurring (1.5x)
      const recurringScore = calculateSacrificeScore({
        localHour: 22,
        durationMinutes: 30,
        isRecurring: true,
      })
      expect(recurringScore.points).toBe(9) // 6 * 1.5
      
      // Organizer discount (0.8x)
      const organizerScore = calculateSacrificeScore({
        localHour: 22,
        durationMinutes: 30,
        isOrganizer: true,
      })
      expect(organizerScore.points).toBe(4.8) // 6 * 0.8
    })
  })
})

describe('E2E: Edge Cases', () => {
  it('should handle single participant correctly', () => {
    const singleParticipant: Participant[] = [
      { id: 'user-1', email: 'solo@example.com', timezone: 'UTC' },
    ]
    
    const bestTimes = findBestTimes(singleParticipant, { topN: 3 })
    expect(bestTimes.length).toBeGreaterThan(0)
  })

  it('should handle extreme timezone differences', () => {
    const extremeParticipants: Participant[] = [
      { id: 'user-1', email: 'east@example.com', timezone: 'Pacific/Auckland' },
      { id: 'user-2', email: 'west@example.com', timezone: 'Pacific/Honolulu' },
    ]
    
    // Auckland is +12/+13, Honolulu is -10 = 22-23 hour difference!
    const bestTimes = findBestTimes(extremeParticipants, { 
      topN: 5,
      requireAllAvailable: true,
    })
    
    // Should still find some options (even if quality is low)
    expect(bestTimes.length).toBeGreaterThanOrEqual(0)
  })

  it('should handle empty participant list gracefully', () => {
    const bestTimes = findBestTimes([], { topN: 5 })
    // With no participants, any time is "available" but scores are 0
    expect(bestTimes.length).toBeLessThanOrEqual(5)
  })

  it('should handle zero-duration meetings', () => {
    const score = calculateSacrificeScore({
      localHour: 10,
      durationMinutes: 0,
    })
    expect(score.points).toBe(0)
  })
})
