/**
 * Team Invite Detail API
 * DELETE /api/teams/[id]/invite/[inviteId] - Cancel invite
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string; inviteId: string }>
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id: teamId, inviteId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin or owner
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single() as { data: { role: string } | null }

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { error } = await supabase
      .from('team_invites')
      .delete()
      .eq('id', inviteId)
      .eq('team_id', teamId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling invite:', error)
    return NextResponse.json({ error: 'Failed to cancel invite' }, { status: 500 })
  }
}
