/**
 * Async Nudge Stats API Route
 * GET /api/async-nudge/stats - Get hours reclaimed statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateReclaimedStats, type AsyncType } from '@/lib/async-nudge'
import { DateTime } from 'luxon'

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
    const userId = searchParams.get('userId')
    const days = parseInt(searchParams.get('days') || '30', 10)
    
    // Calculate date range
    const now = DateTime.utc()
    const startDate = now.minus({ days }).toISO()
    const previousStartDate = now.minus({ days: days * 2 }).toISO()
    
    // Build query for current period
    let query = supabase
      .from('async_nudges')
      .select(`
        id,
        decision,
        hours_saved,
        async_type,
        created_at,
        meeting:meetings!async_nudges_meeting_id_fkey(
          id,
          title,
          organizer_id,
          team_id
        )
      `)
      .gte('created_at', startDate)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (teamId) {
      query = query.eq('meeting.team_id', teamId)
    }
    
    const { data: currentPeriod, error } = await query
    
    if (error) {
      console.error('Failed to fetch async nudges:', error)
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      )
    }
    
    // Define type for nudge records
    interface NudgeRecord {
      id: string
      decision: string
      hours_saved: number | null
      async_type: string | null
      created_at: string
      meeting: { id: string; team_id: string | null; organizer_id: string | null } | null
    }
    
    // Fetch previous period for trend calculation
    let prevQuery = supabase
      .from('async_nudges')
      .select(`
        id,
        decision,
        hours_saved,
        async_type,
        created_at,
        meeting:meetings!async_nudges_meeting_id_fkey(
          id,
          team_id,
          organizer_id
        )
      `)
      .gte('created_at', previousStartDate)
      .lt('created_at', startDate)
    
    if (teamId) {
      prevQuery = prevQuery.eq('meeting.team_id', teamId)
    }
    
    const { data: previousPeriod } = await prevQuery
    
    // Transform to expected format
    const currentRecords = ((currentPeriod || []) as NudgeRecord[]).map(record => ({
      decision: record.decision as 'went_async' | 'scheduled_anyway',
      hoursSaved: record.hours_saved || 0,
      asyncType: record.async_type as AsyncType | null,
      createdAt: new Date(record.created_at),
    }))
    
    const previousRecords = ((previousPeriod || []) as NudgeRecord[]).map(record => ({
      decision: record.decision as 'went_async' | 'scheduled_anyway',
      hoursSaved: record.hours_saved || 0,
      asyncType: record.async_type as AsyncType | null,
      createdAt: new Date(record.created_at),
    }))
    
    // Calculate stats
    const stats = calculateReclaimedStats(currentRecords, previousRecords)
    
    return NextResponse.json(stats)
    
  } catch (error) {
    console.error('Async nudge stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
