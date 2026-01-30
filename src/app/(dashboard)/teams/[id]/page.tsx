/**
 * Team Detail Page
 * View team members, invite new members, manage roles
 */
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TeamDetailView } from './team-detail-view'

interface TeamDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Types for queries
  interface TeamData { id: string; name: string; slug: string; created_at: string }
  interface MemberData {
    id: string
    user_id: string
    role: string
    joined_at: string
    user: { email: string; name: string | null; avatar_url: string | null; timezone: string } | null
  }
  interface InviteData {
    id: string
    team_id: string
    email: string
    invite_code: string
    status: string
    created_at: string
    expires_at: string
  }

  // Fetch team details
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single() as { data: TeamData | null; error: unknown }

  if (teamError || !team) {
    notFound()
  }

  // Fetch team members with user details
  const { data: members } = await supabase
    .from('team_members')
    .select(`
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
    `)
    .eq('team_id', id)
    .order('joined_at', { ascending: true }) as { data: MemberData[] | null }

  // Check if current user is a member
  const currentMembership = members?.find(m => m.user_id === user.id)
  if (!currentMembership) {
    redirect('/teams')
  }

  // Fetch pending invites
  const { data: invites } = await supabase
    .from('team_invites')
    .select('*')
    .eq('team_id', id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false }) as { data: InviteData[] | null }

  const formattedMembers = members?.map(m => ({
    id: m.id,
    user_id: m.user_id,
    email: m.user?.email || '',
    name: m.user?.name || undefined,
    avatar_url: m.user?.avatar_url || undefined,
    timezone: m.user?.timezone || 'UTC',
    role: m.role as 'owner' | 'admin' | 'member',
    joined_at: m.joined_at,
  })) || []

  return (
    <TeamDetailView
      team={team}
      members={formattedMembers}
      invites={invites || []}
      currentUserId={user.id}
      currentUserRole={currentMembership.role}
    />
  )
}
