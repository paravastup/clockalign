/**
 * Meetings API Routes
 * POST /api/meetings - Create a new meeting
 * GET /api/meetings - List user's meetings
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateScoreForTimezone } from '@/lib/sacrifice-score'
import { DateTime } from 'luxon'

interface CreateMeetingBody {
  title: string
  description?: string
  duration: number
  meetingType: 'standup' | 'planning' | '1on1' | 'review' | 'brainstorm' | 'other'
  teamId?: string
  participants: Array<{ email: string; name?: string }>
  isRecurring: boolean
  selectedSlot?: {
    utcHour: number
    goldenScore: number
  }
}

export async function POST(request: NextRequest) {
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
    
    const body: CreateMeetingBody = await request.json()
    
    // Validate required fields
    if (!body.title || body.title.length < 3) {
      return NextResponse.json(
        { error: 'Title must be at least 3 characters' },
        { status: 400 }
      )
    }
    
    // Create the meeting
    const { data: meeting, error: meetingError } = await (supabase
      .from('meetings') as ReturnType<typeof supabase.from>)
      .insert({
        title: body.title,
        description: body.description || null,
        duration_minutes: body.duration || 30,
        meeting_type: body.meetingType || 'other',
        organizer_id: user.id,
        team_id: body.teamId || null,
        is_recurring: body.isRecurring || false,
      } as Record<string, unknown>)
      .select()
      .single()
    
    if (meetingError) {
      console.error('Failed to create meeting:', meetingError)
      return NextResponse.json(
        { error: 'Failed to create meeting', details: meetingError.message },
        { status: 500 }
      )
    }
    
    // Get organizer timezone
    const { data: organizer } = await supabase
      .from('users')
      .select('timezone')
      .eq('id', user.id)
      .single()
    
    const organizerTimezone = (organizer as { timezone: string } | null)?.timezone || 'UTC'
    
    // Add participants
    if (body.participants && body.participants.length > 0) {
      const participantInserts = body.participants.map(p => ({
        meeting_id: (meeting as { id: string }).id,
        email: p.email,
        name: p.name || null,
        timezone: 'UTC', // Will be updated when user responds
        status: 'pending',
      }))
      
      const { error: participantsError } = await (supabase
        .from('meeting_participants') as ReturnType<typeof supabase.from>)
        .insert(participantInserts as unknown as Record<string, unknown>[])
      
      if (participantsError) {
        console.error('Failed to add participants:', participantsError)
        // Don't fail the whole request, meeting is created
      }
    }
    
    // Create meeting slot if time was selected
    if (body.selectedSlot) {
      // Create a DateTime for the next occurrence of this UTC hour
      const now = DateTime.utc()
      let slotTime = now.set({ hour: body.selectedSlot.utcHour, minute: 0, second: 0 })
      
      // If that time has passed today, schedule for tomorrow
      if (slotTime < now) {
        slotTime = slotTime.plus({ days: 1 })
      }
      
      const endTime = slotTime.plus({ minutes: body.duration || 30 })
      
      // Calculate total sacrifice (simplified - would be per-participant in real app)
      const sacrificeScore = calculateScoreForTimezone(
        slotTime.toISO()!,
        organizerTimezone,
        { durationMinutes: body.duration }
      )
      
      const { error: slotError } = await (supabase
        .from('meeting_slots') as ReturnType<typeof supabase.from>)
        .insert({
          meeting_id: (meeting as { id: string }).id,
          start_time: slotTime.toISO(),
          end_time: endTime.toISO(),
          status: 'confirmed',
          golden_score: body.selectedSlot.goldenScore,
          total_sacrifice_points: Math.round(sacrificeScore.points * (body.participants?.length || 1)),
        } as Record<string, unknown>)
      
      if (slotError) {
        console.error('Failed to create slot:', slotError)
      }
    }
    
    const meetingData = meeting as { id: string; title: string }
    return NextResponse.json({
      meeting: {
        id: meetingData.id,
        title: meetingData.title,
      },
      message: 'Meeting created successfully',
    })
    
  } catch (error) {
    console.error('Meetings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
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
    
    const searchParams = request.nextUrl.searchParams
    const teamId = searchParams.get('teamId')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    
    // Build query
    let query = supabase
      .from('meetings')
      .select(`
        id,
        title,
        description,
        duration_minutes,
        meeting_type,
        is_recurring,
        created_at,
        organizer:users!meetings_organizer_id_fkey(id, name, email),
        team:teams(id, name),
        meeting_slots(id, start_time, end_time, status, golden_score),
        meeting_participants(id, email, name, status)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (teamId) {
      query = query.eq('team_id', teamId)
    }
    
    const { data: meetings, error } = await query
    
    if (error) {
      console.error('Failed to fetch meetings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch meetings' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ meetings })
    
  } catch (error) {
    console.error('Meetings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
