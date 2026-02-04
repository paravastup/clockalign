/**
 * Integration Tests: Sacrifice Score Tracking Flow
 * CA-030: Test the full flow from meeting creation to score tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DateTime } from 'luxon'

// Mock Supabase client for integration tests
const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
}

// Mock Next.js request/response
class MockRequest {
  private _url: string
  private _body: any
  
  constructor(url: string, options?: { method?: string; body?: string }) {
    this._url = url
    this._body = options?.body ? JSON.parse(options.body) : null
  }
  
  get url() {
    return this._url
  }
  
  async json() {
    return this._body
  }
}

// Import the actual calculation functions (not mocked)
import {
  calculateSacrificeScore,
  calculateScoreForTimezone,
  calculateMeetingTotalSacrifice,
  calculateLeaderboard,
  getPainWeight,
  type SacrificeScoreResult,
} from '@/lib/sacrifice-score'

describe('Sacrifice Score Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('Meeting Creation Flow', () => {
    it('should calculate scores correctly for a 3-timezone meeting', () => {
      // Scenario: 9 AM SF meeting
      // SF (UTC-8): 9 AM = good (1.5 pts)
      // London (UTC): 5 PM = acceptable (2 pts)  
      // Mumbai (UTC+5:30): 10:30 PM = late_night (6 pts)
      
      const meetingTimeUTC = DateTime.fromISO('2025-02-01T17:00:00Z')
      
      const participants = [
        { timezone: 'America/Los_Angeles', isOrganizer: true },
        { timezone: 'Europe/London', isOrganizer: false },
        { timezone: 'Asia/Kolkata', isOrganizer: false },
      ]
      
      const scores: SacrificeScoreResult[] = participants.map(p => 
        calculateScoreForTimezone(meetingTimeUTC, p.timezone, {
          durationMinutes: 30,
          isOrganizer: p.isOrganizer,
        })
      )
      
      // Verify individual scores
      // SF: 9 AM = good (1.5 base), organizer (0.8x) = 1.2
      expect(scores[0].category).toBe('good')
      expect(scores[0].points).toBe(1.2)
      
      // London: 5 PM = acceptable (2 pts)
      expect(scores[1].category).toBe('acceptable')
      expect(scores[1].points).toBe(2)
      
      // Mumbai: 10:30 PM = late_night (6 pts)
      expect(scores[2].category).toBe('late_night')
      expect(scores[2].points).toBe(6)
      
      // Verify total
      const total = calculateMeetingTotalSacrifice(scores)
      expect(total.totalPoints).toBe(9.2)
      expect(total.maxPoints).toBe(6)
      
      // Mumbai has 3x+ the average (9.2/3 ≈ 3), so should trigger imbalance
      // Actually 6 / 3.07 = 1.95x, just under 2x threshold
      // With 4+ points and >2x average, should trigger warning
    })
    
    it('should correctly identify golden window meetings', () => {
      // 10 AM PST = 6 PM London = 11:30 PM Mumbai
      // This is NOT a golden window due to Mumbai being in graveyard
      
      const meetingTime = DateTime.fromISO('2025-02-01T18:00:00Z')
      
      const scores = [
        calculateScoreForTimezone(meetingTime, 'America/Los_Angeles'),
        calculateScoreForTimezone(meetingTime, 'Europe/London'),
        calculateScoreForTimezone(meetingTime, 'Asia/Kolkata'),
      ]
      
      // SF: 10 AM = golden (1 pt)
      expect(scores[0].category).toBe('golden')
      
      // London: 6 PM = evening (3 pts)
      expect(scores[1].category).toBe('evening')
      
      // Mumbai: 11:30 PM = graveyard (10 pts)
      expect(scores[2].category).toBe('graveyard')
      
      const total = calculateMeetingTotalSacrifice(scores)
      // With graveyard slot, fairness index should be low
      expect(total.fairnessIndex).toBeLessThan(0.5)
    })
    
    it('should handle recurring meeting multiplier', () => {
      const meetingTime = DateTime.fromISO('2025-02-01T17:00:00Z')
      
      const oneTimeScore = calculateScoreForTimezone(
        meetingTime,
        'Asia/Kolkata',
        { isRecurring: false }
      )
      
      const recurringScore = calculateScoreForTimezone(
        meetingTime,
        'Asia/Kolkata',
        { isRecurring: true }
      )
      
      // Recurring should be 1.5x the one-time score
      expect(recurringScore.points).toBe(oneTimeScore.points * 1.5)
    })
    
    it('should handle long meetings correctly', () => {
      const meetingTime = DateTime.fromISO('2025-02-01T14:00:00Z')
      
      const shortMeeting = calculateScoreForTimezone(
        meetingTime,
        'America/New_York',
        { durationMinutes: 30 }
      )
      
      const longMeeting = calculateScoreForTimezone(
        meetingTime,
        'America/New_York',
        { durationMinutes: 120 } // 2 hour meeting
      )
      
      // 2 hour meeting should be 4x the 30 min meeting
      expect(longMeeting.points).toBe(shortMeeting.points * 4)
    })
  })
  
  describe('Leaderboard Calculation Flow', () => {
    it('should correctly rank team members over multiple meetings', () => {
      const users = new Map([
        ['alice', { name: 'Alice', email: 'alice@test.com', timezone: 'America/Los_Angeles' }],
        ['bob', { name: 'Bob', email: 'bob@test.com', timezone: 'Europe/London' }],
        ['priya', { name: 'Priya', email: 'priya@test.com', timezone: 'Asia/Kolkata' }],
      ])
      
      // Simulate 4 weeks of weekly standups at 9 AM PST
      // Alice: 9 AM = good (1.5 pts each)
      // Bob: 5 PM = acceptable (2 pts each)
      // Priya: 10:30 PM = late_night (6 pts each)
      const scores = [
        // Week 1
        { userId: 'alice', points: 1.5, category: 'good', meetingSlotId: 'week1' },
        { userId: 'bob', points: 2, category: 'acceptable', meetingSlotId: 'week1' },
        { userId: 'priya', points: 6, category: 'late_night', meetingSlotId: 'week1' },
        // Week 2
        { userId: 'alice', points: 1.5, category: 'good', meetingSlotId: 'week2' },
        { userId: 'bob', points: 2, category: 'acceptable', meetingSlotId: 'week2' },
        { userId: 'priya', points: 6, category: 'late_night', meetingSlotId: 'week2' },
        // Week 3
        { userId: 'alice', points: 1.5, category: 'good', meetingSlotId: 'week3' },
        { userId: 'bob', points: 2, category: 'acceptable', meetingSlotId: 'week3' },
        { userId: 'priya', points: 6, category: 'late_night', meetingSlotId: 'week3' },
        // Week 4
        { userId: 'alice', points: 1.5, category: 'good', meetingSlotId: 'week4' },
        { userId: 'bob', points: 2, category: 'acceptable', meetingSlotId: 'week4' },
        { userId: 'priya', points: 6, category: 'late_night', meetingSlotId: 'week4' },
      ]
      
      const leaderboard = calculateLeaderboard(scores, users)
      
      // Priya should be #1 with 24 points
      expect(leaderboard[0].userName).toBe('Priya')
      expect(leaderboard[0].totalPoints).toBe(24)
      expect(leaderboard[0].meetingCount).toBe(4)
      expect(leaderboard[0].worstSlotCount.lateNight).toBe(4)
      
      // Bob should be #2 with 8 points
      expect(leaderboard[1].userName).toBe('Bob')
      expect(leaderboard[1].totalPoints).toBe(8)
      
      // Alice should be #3 with 6 points
      expect(leaderboard[2].userName).toBe('Alice')
      expect(leaderboard[2].totalPoints).toBe(6)
      
      // Priya: avg = (24+8+6)/3 = 12.67, Priya has 24/12.67 = 1.9x
      // 1.9x is > 1.3x (above_average) but < 2x (high_sacrifice)
      expect(leaderboard[0].fairnessStatus).toBe('above_average')
    })
    
    it('should detect improving vs worsening trends', () => {
      const users = new Map([
        ['alice', { name: 'Alice', email: 'alice@test.com', timezone: 'UTC' }],
      ])
      
      const currentScores = [
        { userId: 'alice', points: 5, category: 'night', meetingSlotId: 'slot1' },
      ]
      
      // Previous period: Alice had 10 points (now has 5 = down 50%)
      const prevPeriod = new Map([['alice', 10]])
      
      const leaderboard = calculateLeaderboard(currentScores, users, prevPeriod)
      
      expect(leaderboard[0].trend).toBe('down') // Improving!
      expect(leaderboard[0].trendPercent).toBe(-50)
    })
    
    it('should handle new team members with no previous data', () => {
      const users = new Map([
        ['newbie', { name: 'New Person', email: 'new@test.com', timezone: 'UTC' }],
      ])
      
      const currentScores = [
        { userId: 'newbie', points: 3, category: 'evening', meetingSlotId: 'slot1' },
      ]
      
      const prevPeriod = new Map() // No previous data
      
      const leaderboard = calculateLeaderboard(currentScores, users, prevPeriod)
      
      expect(leaderboard[0].trend).toBe('up') // New = up from 0
      expect(leaderboard[0].trendPercent).toBe(100)
    })
  })
  
  describe('Fairness Detection', () => {
    it('should identify critical imbalance when one person takes all graveyard shifts', () => {
      const users = new Map([
        ['alice', { name: 'Alice', email: 'alice@test.com', timezone: 'UTC' }],
        ['bob', { name: 'Bob', email: 'bob@test.com', timezone: 'UTC' }],
        ['charlie', { name: 'Charlie', email: 'charlie@test.com', timezone: 'UTC' }],
      ])
      
      // Charlie takes all the bad slots
      const scores = [
        { userId: 'alice', points: 1, category: 'golden', meetingSlotId: 'slot1' },
        { userId: 'bob', points: 1, category: 'golden', meetingSlotId: 'slot1' },
        { userId: 'charlie', points: 10, category: 'graveyard', meetingSlotId: 'slot1' },
        
        { userId: 'alice', points: 1, category: 'golden', meetingSlotId: 'slot2' },
        { userId: 'bob', points: 1, category: 'golden', meetingSlotId: 'slot2' },
        { userId: 'charlie', points: 10, category: 'graveyard', meetingSlotId: 'slot2' },
        
        { userId: 'alice', points: 1, category: 'golden', meetingSlotId: 'slot3' },
        { userId: 'bob', points: 1, category: 'golden', meetingSlotId: 'slot3' },
        { userId: 'charlie', points: 10, category: 'graveyard', meetingSlotId: 'slot3' },
      ]
      
      const leaderboard = calculateLeaderboard(scores, users)
      
      const charlie = leaderboard.find(l => l.userName === 'Charlie')!
      
      // Charlie has 30 pts, avg is (30+3+3)/3 = 12, so 30/12 = 2.5x
      expect(charlie.fairnessStatus).toBe('high_sacrifice')
      expect(charlie.totalPoints).toBe(30)
      expect(charlie.worstSlotCount.graveyard).toBe(3)
    })
    
    it('should recognize fair distribution across team', () => {
      const users = new Map([
        ['alice', { name: 'Alice', email: 'alice@test.com', timezone: 'UTC' }],
        ['bob', { name: 'Bob', email: 'bob@test.com', timezone: 'UTC' }],
        ['charlie', { name: 'Charlie', email: 'charlie@test.com', timezone: 'UTC' }],
      ])
      
      // Rotating bad slots
      const scores = [
        // Meeting 1: Alice takes bad slot
        { userId: 'alice', points: 6, category: 'late_night', meetingSlotId: 'slot1' },
        { userId: 'bob', points: 1, category: 'golden', meetingSlotId: 'slot1' },
        { userId: 'charlie', points: 1, category: 'golden', meetingSlotId: 'slot1' },
        
        // Meeting 2: Bob takes bad slot
        { userId: 'alice', points: 1, category: 'golden', meetingSlotId: 'slot2' },
        { userId: 'bob', points: 6, category: 'late_night', meetingSlotId: 'slot2' },
        { userId: 'charlie', points: 1, category: 'golden', meetingSlotId: 'slot2' },
        
        // Meeting 3: Charlie takes bad slot
        { userId: 'alice', points: 1, category: 'golden', meetingSlotId: 'slot3' },
        { userId: 'bob', points: 1, category: 'golden', meetingSlotId: 'slot3' },
        { userId: 'charlie', points: 6, category: 'late_night', meetingSlotId: 'slot3' },
      ]
      
      const leaderboard = calculateLeaderboard(scores, users)
      
      // Everyone has 8 points - all balanced
      for (const entry of leaderboard) {
        expect(entry.totalPoints).toBe(8)
        expect(entry.fairnessStatus).toBe('balanced')
      }
    })
  })
  
  describe('Edge Cases', () => {
    it('should handle meetings at exact hour boundaries', () => {
      // Test boundary between good and golden (9:59 AM vs 10:00 AM)
      const borderline = DateTime.fromISO('2025-02-01T17:59:00Z') // 9:59 AM PST
      const golden = DateTime.fromISO('2025-02-01T18:00:00Z') // 10:00 AM PST
      
      const borderlineScore = calculateScoreForTimezone(borderline, 'America/Los_Angeles')
      const goldenScore = calculateScoreForTimezone(golden, 'America/Los_Angeles')
      
      // 9:xx AM is still "good" not "golden"
      expect(borderlineScore.category).toBe('good')
      expect(goldenScore.category).toBe('golden')
    })
    
    it('should handle timezones with half-hour offsets', () => {
      // India (UTC+5:30), Nepal (UTC+5:45)
      const meetingTime = DateTime.fromISO('2025-02-01T12:00:00Z') // Noon UTC
      
      const indiaScore = calculateScoreForTimezone(meetingTime, 'Asia/Kolkata')
      // 12:00 UTC = 17:30 IST = acceptable (2 pts)
      expect(indiaScore.category).toBe('acceptable')
      
      const nepalScore = calculateScoreForTimezone(meetingTime, 'Asia/Kathmandu')
      // 12:00 UTC = 17:45 NST = acceptable (2 pts)
      expect(nepalScore.category).toBe('acceptable')
    })
    
    it('should handle DST transitions correctly', () => {
      // March 10, 2025 is DST transition in US
      // 2 AM becomes 3 AM
      const preDST = DateTime.fromISO('2025-03-09T17:00:00Z')
      const postDST = DateTime.fromISO('2025-03-10T17:00:00Z')
      
      const preScore = calculateScoreForTimezone(preDST, 'America/New_York')
      const postScore = calculateScoreForTimezone(postDST, 'America/New_York')
      
      // Pre-DST: 5 PM UTC = 12 PM EST = golden
      // Post-DST: 5 PM UTC = 1 PM EDT = golden
      expect(preScore.category).toBe('golden')
      expect(postScore.category).toBe('golden')
    })
    
    it('should handle meetings spanning midnight', () => {
      // 11 PM start with 2 hour duration
      // The score is based on start time, not end time
      const lateNight = DateTime.fromISO('2025-02-01T23:00:00Z')
      
      const score = calculateScoreForTimezone(
        lateNight,
        'UTC',
        { durationMinutes: 120 }
      )
      
      // 11 PM UTC = graveyard, 2 hour meeting = 4x
      expect(score.category).toBe('graveyard')
      expect(score.points).toBe(40) // 10 * 4
    })
    
    it('should handle empty participants gracefully', () => {
      const total = calculateMeetingTotalSacrifice([])
      expect(total.totalPoints).toBe(0)
      expect(total.averagePoints).toBe(0)
      expect(total.fairnessIndex).toBe(1)
    })
    
    it('should handle single participant meetings', () => {
      const score = calculateScoreForTimezone(
        '2025-02-01T14:00:00Z',
        'America/New_York'
      )
      
      const total = calculateMeetingTotalSacrifice([score])
      expect(total.totalPoints).toBe(score.points)
      expect(total.fairnessIndex).toBe(1) // Single person = perfect fairness
    })
  })
  
  describe('Real-world Scenarios', () => {
    it('should model a typical US/Europe/Asia distributed team standup', () => {
      // Company wants daily standup for SF, London, Bangalore team
      // Best time might be 8 AM SF / 4 PM London / 9:30 PM Bangalore
      
      const standupTime = DateTime.fromISO('2025-02-01T16:00:00Z')
      
      const sfScore = calculateScoreForTimezone(
        standupTime,
        'America/Los_Angeles',
        { isRecurring: true }
      )
      
      const londonScore = calculateScoreForTimezone(
        standupTime,
        'Europe/London', 
        { isRecurring: true }
      )
      
      const bangaloreScore = calculateScoreForTimezone(
        standupTime,
        'Asia/Kolkata',
        { isRecurring: true }
      )
      
      // SF: 8 AM = acceptable (2 * 1.5 recurring = 3)
      expect(sfScore.category).toBe('acceptable')
      expect(sfScore.points).toBe(3)
      
      // London: 4 PM = good (1.5 * 1.5 = 2.25, rounded to 2.3)
      expect(londonScore.category).toBe('good')
      expect(londonScore.points).toBe(2.3)
      
      // Bangalore: 9:30 PM = night (5 * 1.5 = 7.5)
      expect(bangaloreScore.category).toBe('night')
      expect(bangaloreScore.points).toBe(7.5)
      
      const total = calculateMeetingTotalSacrifice([sfScore, londonScore, bangaloreScore])
      
      // Total: 3 + 2.3 + 7.5 = 12.8
      // Bangalore taking most of the pain
      expect(total.totalPoints).toBeCloseTo(12.8, 1)
      expect(total.maxPoints).toBe(7.5)
    })
    
    it('should show benefit of rotating meeting times', () => {
      // Week 1: Favors SF (9 AM SF)
      const week1 = DateTime.fromISO('2025-02-01T17:00:00Z')
      const week1Scores = [
        calculateScoreForTimezone(week1, 'America/Los_Angeles'), // 9 AM = 1.5
        calculateScoreForTimezone(week1, 'Europe/London'), // 5 PM = 2
        calculateScoreForTimezone(week1, 'Asia/Kolkata'), // 10:30 PM = 6
      ]
      
      // Week 2: Favors London (2 PM London)
      const week2 = DateTime.fromISO('2025-02-03T14:00:00Z')
      const week2Scores = [
        calculateScoreForTimezone(week2, 'America/Los_Angeles'), // 6 AM = 10
        calculateScoreForTimezone(week2, 'Europe/London'), // 2 PM = 1
        calculateScoreForTimezone(week2, 'Asia/Kolkata'), // 7:30 PM = 3
      ]
      
      // Week 3: Favors Asia (10 AM Bangalore)
      const week3 = DateTime.fromISO('2025-02-05T04:30:00Z')
      const week3Scores = [
        calculateScoreForTimezone(week3, 'America/Los_Angeles'), // 8:30 PM = 4
        calculateScoreForTimezone(week3, 'Europe/London'), // 4:30 AM = 10
        calculateScoreForTimezone(week3, 'Asia/Kolkata'), // 10 AM = 1
      ]
      
      // Calculate totals per person over 3 weeks
      const sfTotal = week1Scores[0].points + week2Scores[0].points + week3Scores[0].points
      const londonTotal = week1Scores[1].points + week2Scores[1].points + week3Scores[1].points
      const indiaTotal = week1Scores[2].points + week2Scores[2].points + week3Scores[2].points
      
      // With rotation, everyone shares the pain more evenly
      // SF: 1.5 + 10 + 4 = 15.5
      // London: 2 + 1 + 10 = 13
      // India: 6 + 3 + 1 = 10
      expect(sfTotal).toBeCloseTo(15.5, 1)
      expect(londonTotal).toBeCloseTo(13, 1)
      expect(indiaTotal).toBeCloseTo(10, 1)
      
      // Much more balanced than always meeting at 9 AM SF!
      // (Without rotation, over 3 weeks: SF=4.5, London=6, India=18)
    })
  })
})
