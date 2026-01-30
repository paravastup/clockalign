/**
 * Calculate Sacrifice Score API
 * CA-025: Calculate score on meeting create
 * 
 * Endpoints:
 * - POST: Calculate and store sacrifice scores for a meeting slot
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DateTime } from 'luxon'
import { 
  calculateScoreForTimezone,
  calculateMeetingTotalSacrifice,
  type SacrificeScoreResult,
} from '@/lib/sacrifice-score'

interface CalculateScoreRequest {
  meetingSlotId: string
  meetingId: string
  durationMinutes?: number
  isRecurring?: boolean
}

interface ParticipantScore {
  participantId: string
  userId: string | null
  email: string
  name: string | null
  timezone: string
  isOrganizer: boolean
  score: SacrificeScoreResult
  localTime: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse request body
    const body: CalculateScoreRequest = await request.json()
    const { meetingSlotId, meetingId, durationMinutes, isRecurring } = body
    
    if (!meetingSlotId || !meetingId) {
      return NextResponse.json(
        { error: 'meetingSlotId and meetingId are required' },
        { status: 400 }
      )
    }
    
    // Get meeting details
    const { data: meetingData, error: meetingError } = await supabase
      .from('meetings')
      .select(`
        id,
        title,
        duration_minutes,
        is_recurring,
        organizer_id,
        team_id
      `)
      .eq('id', meetingId)
      .single()
    
    if (meetingError || !meetingData) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }
    
    const meeting = meetingData as {
      id: string
      title: string
      duration_minutes: number
      is_recurring: boolean
      organizer_id: string | null
      team_id: string | null
    }
    
    // Get meeting slot
    const { data: slotData, error: slotError } = await supabase
      .from('meeting_slots')
      .select('id, start_time, end_time, status')
      .eq('id', meetingSlotId)
      .single()
    
    if (slotError || !slotData) {
      return NextResponse.json({ error: 'Meeting slot not found' }, { status: 404 })
    }
    
    const slot = slotData as {
      id: string
      start_time: string
      end_time: string
      status: string
    }
    
    // Get participants
    const { data: participantsData, error: participantsError } = await supabase
      .from('meeting_participants')
      .select('id, user_id, email, name, timezone')
      .eq('meeting_id', meetingId)
    
    if (participantsError) {
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
    }
    
    if (!participantsData || participantsData.length === 0) {
      return NextResponse.json({ error: 'No participants found' }, { status: 400 })
    }
    
    const participants = participantsData as Array<{
      id: string
      user_id: string | null
      email: string
      name: string | null
      timezone: string
    }>
    
    // Calculate scores for each participant
    const effectiveDuration = durationMinutes || meeting.duration_minutes || 30
    const effectiveRecurring = isRecurring ?? meeting.is_recurring
    const slotStart = DateTime.fromISO(slot.start_time)
    
    const participantScores: ParticipantScore[] = []
    const scoresToInsert: Array<{
      participant_id: string
      meeting_slot_id: string
      points: number
      local_start_time: string
      category: string
      multiplier: number
    }> = []
    
    for (const participant of participants) {
      const isOrganizer = participant.user_id === meeting.organizer_id
      const localTime = slotStart.setZone(participant.timezone)
      
      const score = calculateScoreForTimezone(
        slotStart,
        participant.timezone,
        {
          durationMinutes: effectiveDuration,
          isRecurring: effectiveRecurring,
          isOrganizer,
        }
      )
      
      participantScores.push({
        participantId: participant.id,
        userId: participant.user_id,
        email: participant.email,
        name: participant.name,
        timezone: participant.timezone,
        isOrganizer,
        score,
        localTime: localTime.toFormat('h:mm a'),
      })
      
      scoresToInsert.push({
        participant_id: participant.id,
        meeting_slot_id: meetingSlotId,
        points: score.points,
        local_start_time: localTime.toFormat('HH:mm:ss'),
        category: score.category,
        multiplier: score.multipliers.total,
      })
    }
    
    // Insert/update scores in database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('sacrifice_scores')
      .upsert(
        scoresToInsert.map(s => ({
          ...s,
          calculated_at: new Date().toISOString(),
        })),
        { 
          onConflict: 'participant_id,meeting_slot_id',
          ignoreDuplicates: false,
        }
      )
    
    if (insertError) {
      console.error('Failed to insert scores:', insertError)
      return NextResponse.json({ error: 'Failed to save scores' }, { status: 500 })
    }
    
    // Calculate total sacrifice
    const totalSacrifice = calculateMeetingTotalSacrifice(
      participantScores.map(p => p.score)
    )
    
    // Update meeting slot with total sacrifice
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('meeting_slots')
      .update({
        total_sacrifice_points: Math.round(totalSacrifice.totalPoints),
        golden_score: Math.round(100 - totalSacrifice.averagePoints * 10), // Inverse relationship
      })
      .eq('id', meetingSlotId)
    
    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id,
        title: meeting.title,
      },
      slot: {
        id: slot.id,
        startTime: slot.start_time,
        endTime: slot.end_time,
      },
      participants: participantScores.map(p => ({
        participantId: p.participantId,
        name: p.name || p.email,
        timezone: p.timezone,
        localTime: p.localTime,
        points: p.score.points,
        category: p.score.category,
        impactLevel: p.score.impactLevel,
        breakdown: p.score.breakdown,
        isOrganizer: p.isOrganizer,
      })),
      summary: {
        totalSacrifice: totalSacrifice.totalPoints,
        averageSacrifice: totalSacrifice.averagePoints,
        maxSacrifice: totalSacrifice.maxPoints,
        fairnessIndex: totalSacrifice.fairnessIndex,
        imbalanceWarning: totalSacrifice.imbalanceWarning,
      },
    })
  } catch (error) {
    console.error('Calculate score API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Preview scores without saving (for meeting creation flow)
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse request body
    const body = await request.json()
    const { 
      startTime, 
      durationMinutes = 30, 
      isRecurring = false,
      participants, // Array of { email, timezone, isOrganizer? }
    } = body
    
    if (!startTime || !participants || participants.length === 0) {
      return NextResponse.json(
        { error: 'startTime and participants are required' },
        { status: 400 }
      )
    }
    
    const slotStart = DateTime.fromISO(startTime)
    
    if (!slotStart.isValid) {
      return NextResponse.json({ error: 'Invalid startTime format' }, { status: 400 })
    }
    
    // Calculate preview scores
    const participantScores = participants.map((p: any, index: number) => {
      const isOrganizer = p.isOrganizer || index === 0 // First participant is organizer by default
      const localTime = slotStart.setZone(p.timezone)
      
      const score = calculateScoreForTimezone(
        slotStart,
        p.timezone,
        {
          durationMinutes,
          isRecurring,
          isOrganizer,
        }
      )
      
      return {
        email: p.email,
        name: p.name,
        timezone: p.timezone,
        localTime: localTime.toFormat('h:mm a ZZZZ'),
        localHour: localTime.hour,
        points: score.points,
        category: score.category,
        impactLevel: score.impactLevel,
        isOrganizer,
      }
    })
    
    // Calculate total sacrifice
    const totalSacrifice = calculateMeetingTotalSacrifice(
      participantScores.map((p: { points: number; category: string; impactLevel: string }) => ({
        points: p.points,
        basePoints: p.points,
        category: p.category,
        impactLevel: p.impactLevel,
        multipliers: { duration: 1, recurring: 1, organizer: 1, custom: 1, total: 1 },
        breakdown: '',
      }))
    )
    
    return NextResponse.json({
      preview: true,
      slot: {
        startTime,
        durationMinutes,
        isRecurring,
      },
      participants: participantScores,
      summary: {
        totalSacrifice: totalSacrifice.totalPoints,
        averageSacrifice: totalSacrifice.averagePoints,
        maxSacrifice: totalSacrifice.maxPoints,
        fairnessIndex: totalSacrifice.fairnessIndex,
        imbalanceWarning: totalSacrifice.imbalanceWarning,
      },
      recommendation: totalSacrifice.averagePoints <= 2 
        ? 'good' 
        : totalSacrifice.averagePoints <= 4 
          ? 'acceptable' 
          : 'poor',
    })
  } catch (error) {
    console.error('Preview score API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
