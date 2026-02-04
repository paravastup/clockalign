/**
 * Team Invite API
 * POST /api/teams/[id]/invite - Send invite
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateInviteCode } from '@/lib/security/code-generation'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id: teamId } = await params
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
    const body = await request.json()
    const { email } = body

    if (!email?.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user is already a member
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single() as { data: { id: string } | null }

    if (existingUser) {
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', existingUser.id)
        .single() as { data: { id: string } | null }

      if (existingMember) {
        return NextResponse.json({ error: 'User is already a team member' }, { status: 400 })
      }
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from('team_invites')
      .select('id')
      .eq('team_id', teamId)
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
      .single() as { data: { id: string } | null }

    if (existingInvite) {
      return NextResponse.json({ error: 'Invite already pending for this email' }, { status: 400 })
    }

    // Create invite
    const inviteCode = generateInviteCode()
    const inviteData = {
      team_id: teamId,
      email: normalizedEmail,
      invite_code: inviteCode,
      invited_by: user.id,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
     
    const { data: invite, error } = await (supabase.from('team_invites') as any)
      .insert(inviteData)
      .select()
      .single()

    if (error) throw error

    // TODO: Send email notification

    return NextResponse.json({ invite }, { status: 201 })
  } catch (error) {
    console.error('Error creating invite:', error)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id: teamId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check membership
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single() as { data: { role: string } | null }

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: invites, error } = await supabase
    .from('team_invites')
    .select('*')
    .eq('team_id', teamId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ invites })
}

// SECURITY: generateInviteCode is now imported from @/lib/security/code-generation
// which uses crypto.randomBytes() instead of Math.random()
