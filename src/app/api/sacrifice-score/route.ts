/**
 * Sacrifice Score API Routes
 * CA-024: GET /api/sacrifice-score
 * 
 * Endpoints:
 * - GET: Get sacrifice scores (user, team, or meeting)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  calculateLeaderboard, 
  aggregateScoreHistory,
  type LeaderboardEntry,
  type ScoreHistoryEntry,
} from '@/lib/sacrifice-score'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse query params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'user' // 'user' | 'team' | 'meeting'
    const teamId = searchParams.get('teamId')
    const meetingId = searchParams.get('meetingId')
    const userId = searchParams.get('userId') || user.id
    const days = parseInt(searchParams.get('days') || '30', 10)
    
    // Different queries based on type
    switch (type) {
      case 'user':
        return await getUserScore(supabase, userId, days)
      
      case 'team':
        if (!teamId) {
          return NextResponse.json({ error: 'teamId is required for team scores' }, { status: 400 })
        }
        return await getTeamLeaderboard(supabase, user.id, teamId, days)
      
      case 'meeting':
        if (!meetingId) {
          return NextResponse.json({ error: 'meetingId is required for meeting scores' }, { status: 400 })
        }
        return await getMeetingScores(supabase, user.id, meetingId)
      
      case 'history':
        return await getUserScoreHistory(supabase, userId, days)
      
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Sacrifice score API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get a single user's sacrifice score summary
 */
async function getUserScore(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  days: number
) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  // Get sacrifice scores for this user
  const { data: scores, error } = await supabase
    .from('sacrifice_scores')
    .select(`
      id,
      points,
      category,
      calculated_at,
      participant:meeting_participants!inner(
        user_id,
        meeting:meetings!inner(
          id,
          title,
          team_id
        )
      )
    `)
    .gte('calculated_at', startDate.toISOString())
    .order('calculated_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching user scores:', error)
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
  }
  
  // Filter to only this user's scores
  const userScores = scores?.filter(
    (s: any) => s.participant?.user_id === userId
  ) || []
  
  // Calculate summary
  const totalPoints = userScores.reduce((sum: number, s: any) => sum + s.points, 0)
  const meetingIds = new Set(userScores.map((s: any) => s.participant?.meeting?.id))
  const meetingCount = meetingIds.size
  
  // Category breakdown
  const categoryBreakdown: Record<string, number> = {}
  for (const score of userScores as Array<{ category: string }>) {
    categoryBreakdown[score.category] = (categoryBreakdown[score.category] || 0) + 1
  }
  
  return NextResponse.json({
    userId,
    period: { days, startDate: startDate.toISOString() },
    summary: {
      totalPoints: Math.round(totalPoints * 10) / 10,
      meetingCount,
      averagePerMeeting: meetingCount > 0 
        ? Math.round((totalPoints / meetingCount) * 10) / 10 
        : 0,
    },
    categoryBreakdown,
    recentScores: userScores.slice(0, 10).map((s: any) => ({
      points: s.points,
      category: s.category,
      meetingTitle: s.participant?.meeting?.title,
      calculatedAt: s.calculated_at,
    })),
  })
}

/**
 * Get team leaderboard
 */
async function getTeamLeaderboard(
  supabase: Awaited<ReturnType<typeof createClient>>,
  currentUserId: string,
  teamId: string,
  days: number
): Promise<NextResponse> {
  // Verify user is a member of this team
  const { data: membership } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', currentUserId)
    .single()
  
  if (!membership) {
    return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
  }
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  // Get all scores for this team
  const { data: scores, error } = await supabase
    .from('sacrifice_scores')
    .select(`
      id,
      points,
      category,
      meeting_slot_id,
      calculated_at,
      participant:meeting_participants!inner(
        user_id,
        meeting:meetings!inner(
          id,
          team_id
        )
      )
    `)
    .eq('participant.meeting.team_id', teamId)
    .gte('calculated_at', startDate.toISOString())
  
  if (error) {
    console.error('Error fetching team scores:', error)
    return NextResponse.json({ error: 'Failed to fetch team scores' }, { status: 500 })
  }
  
  // Get team members with user info
  const { data: members } = await supabase
    .from('team_members')
    .select(`
      user_id,
      user:users(id, name, email, timezone)
    `)
    .eq('team_id', teamId)
  
  // Build user info map
  const userMap = new Map<string, { name: string | null; email: string; timezone: string }>()
  for (const member of (members || []) as Array<{ user_id: string; user: { name: string | null; email: string; timezone: string } | null }>) {
    const u = member.user
    if (u) {
      userMap.set(member.user_id, {
        name: u.name,
        email: u.email,
        timezone: u.timezone,
      })
    }
  }
  
  // Transform scores for leaderboard calculation
  const transformedScores = (scores || [])
    .filter((s: any) => s.participant?.user_id)
    .map((s: any) => ({
      userId: s.participant.user_id,
      points: s.points,
      category: s.category,
      meetingSlotId: s.meeting_slot_id,
    }))
  
  // Calculate previous period scores for trend
  const prevStartDate = new Date(startDate)
  prevStartDate.setDate(prevStartDate.getDate() - days)
  
  const { data: prevScores } = await supabase
    .from('sacrifice_scores')
    .select(`
      points,
      participant:meeting_participants!inner(
        user_id,
        meeting:meetings!inner(team_id)
      )
    `)
    .eq('participant.meeting.team_id', teamId)
    .gte('calculated_at', prevStartDate.toISOString())
    .lt('calculated_at', startDate.toISOString())
  
  const prevPeriodMap = new Map<string, number>()
  for (const s of (prevScores || []) as Array<{ points: number; participant?: { user_id: string } }>) {
    const uid = s.participant?.user_id
    if (uid) {
      prevPeriodMap.set(uid, (prevPeriodMap.get(uid) || 0) + s.points)
    }
  }
  
  // Calculate leaderboard
  const leaderboard = calculateLeaderboard(transformedScores, userMap, prevPeriodMap)
  
  // Get team info
  const { data: team } = await supabase
    .from('teams')
    .select('id, name')
    .eq('id', teamId)
    .single()
  
  // Calculate team stats
  const totalTeamPoints = leaderboard.reduce((sum, e) => sum + e.totalPoints, 0)
  const avgPoints = leaderboard.length > 0 ? totalTeamPoints / leaderboard.length : 0
  
  return NextResponse.json({
    team: team || { id: teamId, name: 'Unknown Team' },
    period: { days, startDate: startDate.toISOString() },
    stats: {
      totalPoints: Math.round(totalTeamPoints * 10) / 10,
      averagePerMember: Math.round(avgPoints * 10) / 10,
      memberCount: leaderboard.length,
      meetingCount: new Set(transformedScores.map(s => s.meetingSlotId)).size,
    },
    leaderboard,
    fairnessAlerts: leaderboard
      .filter(e => e.fairnessStatus === 'critical' || e.fairnessStatus === 'high_sacrifice')
      .map(e => ({
        userId: e.userId,
        userName: e.userName || e.userEmail,
        status: e.fairnessStatus,
        multiplierVsAverage: avgPoints > 0 ? Math.round((e.totalPoints / avgPoints) * 10) / 10 : 0,
      })),
  })
}

/**
 * Get scores for a specific meeting
 */
async function getMeetingScores(
  supabase: Awaited<ReturnType<typeof createClient>>,
  currentUserId: string,
  meetingId: string
) {
  // Get meeting with participants and scores
  const { data: meeting, error } = await supabase
    .from('meetings')
    .select(`
      id,
      title,
      duration_minutes,
      is_recurring,
      team_id,
      organizer_id,
      participants:meeting_participants(
        id,
        user_id,
        email,
        name,
        timezone,
        scores:sacrifice_scores(
          points,
          category,
          local_start_time,
          multiplier
        )
      ),
      slots:meeting_slots(
        id,
        start_time,
        end_time,
        status,
        golden_score,
        total_sacrifice_points
      )
    `)
    .eq('id', meetingId)
    .single()
  
  if (error || !meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }
  
  // Cast meeting to expected shape
  const meetingData = meeting as {
    id: string
    title: string
    team_id: string | null
    participants: Array<{
      id: string
      user_id: string | null
      email: string
      name: string | null
      timezone: string
      scores: Array<{ points: number; category: string; local_start_time: string; multiplier: number }> | null
    }> | null
    slots: Array<{
      id: string
      start_time: string
      end_time: string
      status: string
      golden_score: number | null
      total_sacrifice_points: number
    }> | null
  }
  
  // If meeting has a team, verify membership
  if (meetingData.team_id) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', meetingData.team_id)
      .eq('user_id', currentUserId)
      .single()
    
    // Also allow if user is a participant
    const isParticipant = meetingData.participants?.some(
      (p) => p.user_id === currentUserId
    )
    
    if (!membership && !isParticipant) {
      return NextResponse.json({ error: 'Not authorized to view this meeting' }, { status: 403 })
    }
  }
  
  // Format participant scores
  const participantScores = meetingData.participants?.map((p) => {
    const score = p.scores?.[0]
    return {
      participantId: p.id,
      userId: p.user_id,
      email: p.email,
      name: p.name,
      timezone: p.timezone,
      score: score ? {
        points: score.points,
        category: score.category,
        localTime: score.local_start_time,
        multiplier: score.multiplier,
      } : null,
    }
  }) || []
  
  // Get the confirmed slot if any
  const confirmedSlot = meetingData.slots?.find((s) => s.status === 'confirmed')
  
  return NextResponse.json({
    meeting: {
      id: meetingData.id,
      title: meetingData.title,
    },
    slot: confirmedSlot ? {
      startTime: confirmedSlot.start_time,
      endTime: confirmedSlot.end_time,
      goldenScore: confirmedSlot.golden_score,
      totalSacrificePoints: confirmedSlot.total_sacrifice_points,
    } : null,
    participants: participantScores,
    summary: {
      totalParticipants: participantScores.length,
      totalSacrifice: participantScores.reduce(
        (sum: number, p: any) => sum + (p.score?.points || 0), 
        0
      ),
      worstOffParticipant: participantScores.reduce(
        (worst: any, p: any) => (!worst || (p.score?.points || 0) > worst.points) 
          ? { name: p.name || p.email, points: p.score?.points || 0 }
          : worst,
        null
      ),
    },
  })
}

/**
 * Get user score history for charting
 */
async function getUserScoreHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  days: number
) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const { data: scores, error } = await supabase
    .from('sacrifice_scores')
    .select(`
      points,
      category,
      calculated_at,
      participant:meeting_participants!inner(user_id)
    `)
    .gte('calculated_at', startDate.toISOString())
    .order('calculated_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching score history:', error)
    return NextResponse.json({ error: 'Failed to fetch score history' }, { status: 500 })
  }
  
  // Filter to user's scores
  const userScores = (scores || [])
    .filter((s: any) => s.participant?.user_id === userId)
    .map((s: any) => ({
      calculatedAt: s.calculated_at,
      points: s.points,
      category: s.category,
    }))
  
  const history = aggregateScoreHistory(userScores, days)
  
  return NextResponse.json({
    userId,
    period: { days, startDate: startDate.toISOString() },
    history,
    cumulative: history.reduce((acc, day) => {
      const prevTotal = acc.length > 0 ? acc[acc.length - 1].cumulative : 0
      acc.push({
        date: day.date,
        cumulative: prevTotal + day.points,
      })
      return acc
    }, [] as Array<{ date: string; cumulative: number }>),
  })
}
