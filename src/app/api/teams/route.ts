/**
 * Teams API - List and Create
 * GET /api/teams - List user's teams
 * POST /api/teams - Create a new team
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Types
  interface MembershipData {
    id: string
    role: string
    team: { id: string; name: string; slug: string; created_at: string } | null
  }

  // Fetch teams the user is a member of
  const { data: memberships, error } = await supabase
    .from('team_members')
    .select(`
      id,
      role,
      team:teams(
        id,
        name,
        slug,
        created_at
      )
    `)
    .eq('user_id', user.id) as { data: MembershipData[] | null; error: unknown }

  if (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }

  const teams = memberships?.map(m => ({
    ...m.team,
    role: m.role,
  })) || []

  return NextResponse.json({ teams })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, slug, invites = [] } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
    }

    // Create the team
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: team, error: teamError } = await (supabase.from('teams') as any)
      .insert({
        name: name.trim(),
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        created_by: user.id,
      })
      .select()
      .single()

    if (teamError) {
      if (teamError.code === '23505') {
        return NextResponse.json({ error: 'A team with this name already exists' }, { status: 400 })
      }
      throw teamError
    }

    // Add the creator as owner
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: memberError } = await (supabase.from('team_members') as any)
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'owner',
      })

    if (memberError) throw memberError

    // Create invites if any
    if (invites.length > 0) {
      const inviteRecords = invites.map((email: string) => ({
        team_id: team.id,
        email: email.toLowerCase(),
        invite_code: generateInviteCode(),
        invited_by: user.id,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('team_invites') as any).insert(inviteRecords)
    }

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}

function generateInviteCode(): string {
  return Array.from({ length: 8 }, () => 
    'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
  ).join('')
}
