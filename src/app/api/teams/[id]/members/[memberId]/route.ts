/**
 * Team Member API
 * PATCH /api/teams/[id]/members/[memberId] - Update role
 * DELETE /api/teams/[id]/members/[memberId] - Remove member
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string; memberId: string }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id: teamId, memberId } = await params
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

  // Get target member's current role
  const { data: targetMember } = await supabase
    .from('team_members')
    .select('role, user_id')
    .eq('id', memberId)
    .eq('team_id', teamId)
    .single() as { data: { role: string; user_id: string } | null }

  if (!targetMember) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  // Can't modify owner
  if (targetMember.role === 'owner') {
    return NextResponse.json({ error: 'Cannot modify team owner' }, { status: 403 })
  }

  // Only owner can make/remove admins
  if (membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can change roles' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { role } = body

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('team_members') as any)
      .update({ role })
      .eq('id', memberId)
      .eq('team_id', teamId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id: teamId, memberId } = await params
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

  // Get target member
  const { data: targetMember } = await supabase
    .from('team_members')
    .select('role, user_id')
    .eq('id', memberId)
    .eq('team_id', teamId)
    .single() as { data: { role: string; user_id: string } | null }

  if (!targetMember) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  // Can't remove owner
  if (targetMember.role === 'owner') {
    return NextResponse.json({ error: 'Cannot remove team owner' }, { status: 403 })
  }

  // Admins can only remove regular members
  if (membership.role === 'admin' && targetMember.role === 'admin') {
    return NextResponse.json({ error: 'Admins cannot remove other admins' }, { status: 403 })
  }

  try {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)
      .eq('team_id', teamId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
