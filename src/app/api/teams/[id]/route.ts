/**
 * Team API - Get, Update, Delete
 * GET /api/teams/[id] - Get team details
 * PUT /api/teams/[id] - Update team
 * DELETE /api/teams/[id] - Delete team
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is a member of this team
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', id)
    .eq('user_id', user.id)
    .single() as { data: { role: string } | null }

  if (!membership) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  // Fetch team details with members
  const { data: team, error } = await supabase
    .from('teams')
    .select(`
      *,
      members:team_members(
        id,
        user_id,
        role,
        joined_at,
        user:users(
          email,
          name,
          avatar_url,
          timezone
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  return NextResponse.json({ team, userRole: membership.role })
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin or owner
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', id)
    .eq('user_id', user.id)
    .single() as { data: { role: string } | null }

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, settings } = body

    const updates: { name?: string; settings?: Record<string, unknown> } = {}
    if (name) updates.name = name.trim()
    if (settings) updates.settings = settings

     
    const { data: team, error } = await (supabase as any)
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ team })
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only owner can delete
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', id)
    .eq('user_id', user.id)
    .single() as { data: { role: string } | null }

  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only team owner can delete the team' }, { status: 403 })
  }

  try {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}
