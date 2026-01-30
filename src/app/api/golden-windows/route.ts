/**
 * Golden Windows API Route
 * 
 * GET /api/golden-windows - Calculate optimal meeting times for participants
 * 
 * Query Parameters:
 * - teamId: Team to get golden windows for
 * - participantIds: Comma-separated user IDs (alternative to teamId)
 * - date: Reference date (ISO format, defaults to today)
 * - topN: Number of best times to return (default: 5)
 * - requireAllAvailable: Only show times when everyone's available (default: true)
 * - minQualityScore: Minimum quality score threshold (default: 0)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DateTime } from 'luxon'
import {
  findBestTimes,
  generateHeatmapData,
  findBestTimeRanges,
  parseUserPreferences,
  Participant,
  BestTimeSlot,
  HeatmapData,
  ChronoType,
  formatHour
} from '@/lib/golden-windows'

interface UserRow {
  id: string
  email: string
  name: string | null
  timezone: string
  energy_profile: {
    chronotype?: ChronoType
    workStartHour?: number
    workEndHour?: number
    customEnergyCurve?: Record<number, number>
    customUnavailableHours?: number[]
  } | null
  preferences: Record<string, unknown> | null
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const teamId = searchParams.get('teamId')
    const participantIdsParam = searchParams.get('participantIds')
    const dateParam = searchParams.get('date')
    const topN = parseInt(searchParams.get('topN') || '5', 10)
    const requireAllAvailable = searchParams.get('requireAllAvailable') !== 'false'
    const minQualityScore = parseInt(searchParams.get('minQualityScore') || '0', 10)
    const includeHeatmap = searchParams.get('includeHeatmap') === 'true'
    const includeRanges = searchParams.get('includeRanges') === 'true'
    
    // Validate we have either teamId or participantIds
    if (!teamId && !participantIdsParam) {
      return NextResponse.json(
        { error: 'Either teamId or participantIds is required' },
        { status: 400 }
      )
    }
    
    // Get participants
    let participants: Participant[] = []
    
    if (teamId) {
      // Get team members
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId)
      
      if (teamError) {
        return NextResponse.json(
          { error: 'Failed to fetch team members', details: teamError.message },
          { status: 500 }
        )
      }
      
      if (!teamMembers || teamMembers.length === 0) {
        return NextResponse.json(
          { error: 'No team members found' },
          { status: 404 }
        )
      }
      
      const userIds = (teamMembers as Array<{ user_id: string }>).map(m => m.user_id)
      
      // Get user details
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, timezone, energy_profile, preferences')
        .in('id', userIds)
      
      if (usersError) {
        return NextResponse.json(
          { error: 'Failed to fetch user details', details: usersError.message },
          { status: 500 }
        )
      }
      
      participants = (users as UserRow[]).map(u => parseUserPreferences(
        u.id,
        u.email,
        u.name || undefined,
        u.timezone,
        u.energy_profile || {}
      ))
    } else {
      // Get specific participants by IDs
      const participantIds = participantIdsParam!.split(',').map(id => id.trim())
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, timezone, energy_profile, preferences')
        .in('id', participantIds)
      
      if (usersError) {
        return NextResponse.json(
          { error: 'Failed to fetch user details', details: usersError.message },
          { status: 500 }
        )
      }
      
      participants = (users as UserRow[]).map(u => parseUserPreferences(
        u.id,
        u.email,
        u.name || undefined,
        u.timezone,
        u.energy_profile || {}
      ))
    }
    
    if (participants.length === 0) {
      return NextResponse.json(
        { error: 'No valid participants found' },
        { status: 404 }
      )
    }
    
    // Parse reference date
    const referenceDate = dateParam 
      ? DateTime.fromISO(dateParam)
      : DateTime.utc()
    
    if (!referenceDate.isValid) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }
    
    // Calculate golden windows
    const bestTimes = findBestTimes(participants, {
      topN,
      requireAllAvailable,
      minQualityScore,
      referenceDate
    })
    
    // Build response
    const response: {
      bestTimes: Array<{
        rank: number
        utcHour: number
        utcStartFormatted: string
        goldenScore: number
        qualityScore: number
        recommendation: string
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
      }>
      participantCount: number
      timezones: string[]
      heatmap?: HeatmapData
      timeRanges?: Array<{
        startHour: number
        endHour: number
        durationHours: number
        avgQualityScore: number
        recommendation: string
      }>
    } = {
      bestTimes: bestTimes.map(slot => ({
        rank: slot.rank,
        utcHour: slot.utcStart.hour,
        utcStartFormatted: slot.utcStart.toFormat('HH:mm') + ' UTC',
        goldenScore: slot.goldenScore,
        qualityScore: slot.qualityScore,
        recommendation: slot.recommendation,
        summary: slot.summary,
        allAvailable: slot.allAvailable,
        participants: slot.participants.map(pw => ({
          id: pw.participant.id,
          name: pw.participant.name || pw.participant.email,
          timezone: pw.participant.timezone,
          localHour: pw.localHour,
          localTimeFormatted: formatHour(pw.localHour),
          sharpness: Math.round(pw.sharpness * 100),
          isAvailable: pw.isAvailable
        }))
      })),
      participantCount: participants.length,
      timezones: [...new Set(participants.map(p => p.timezone))]
    }
    
    // Include heatmap if requested
    if (includeHeatmap) {
      response.heatmap = generateHeatmapData(participants, referenceDate)
    }
    
    // Include time ranges if requested
    if (includeRanges) {
      response.timeRanges = findBestTimeRanges(participants, { referenceDate })
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Golden windows API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
