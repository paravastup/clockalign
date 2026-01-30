/**
 * Teams List Page
 * View and manage your teams
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TeamMemberAvatars } from '@/components/team-member-list'
import { Users, Plus, ArrowRight, Globe, Crown, Shield } from 'lucide-react'

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Types for queries
  interface TeamMembershipData {
    id: string
    role: string
    team: { id: string; name: string; slug: string; created_at: string } | null
  }
  interface AllMemberData {
    team_id: string
    user: { name: string | null; email: string; avatar_url: string | null; timezone: string } | null
  }

  // Fetch user's teams with member counts
  const { data: teamMemberships } = await supabase
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
    .eq('user_id', user.id) as { data: TeamMembershipData[] | null }

  // Get team IDs the user is a member of
  const teamIds = teamMemberships?.map(tm => tm.team?.id).filter(Boolean) as string[] || []

  // Fetch all members for those teams
  const { data: allMembers } = teamIds.length > 0 
    ? await supabase
        .from('team_members')
        .select(`
          team_id,
          user:users(
            name,
            email,
            avatar_url,
            timezone
          )
        `)
        .in('team_id', teamIds) as { data: AllMemberData[] | null }
    : { data: [] as AllMemberData[] }

  // Group members by team
  const membersByTeam: Record<string, AllMemberData[]> = {}
  allMembers?.forEach(member => {
    if (!member.team_id) return
    if (!membersByTeam[member.team_id]) {
      membersByTeam[member.team_id] = []
    }
    membersByTeam[member.team_id].push(member)
  })

  const teams = teamMemberships?.map(tm => ({
    ...tm.team,
    role: tm.role,
    members: membersByTeam[tm.team?.id || ''] || [],
  })) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage your teams and track fairness across timezones
          </p>
        </div>
        <Button asChild>
          <Link href="/teams/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Link>
        </Button>
      </div>

      {teams.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No teams yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create a team to start tracking meeting fairness across your distributed colleagues.
            </p>
            <Button size="lg" asChild>
              <Link href="/teams/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Team
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="group hover:border-primary/50 hover:shadow-md transition-all">
              <Link href={`/teams/${team.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      {team.role === 'owner' && (
                        <Badge variant="secondary" className="gap-1">
                          <Crown className="h-3 w-3" />
                        </Badge>
                      )}
                      {team.role === 'admin' && (
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <TeamMemberAvatars 
                      members={team.members.map(m => ({
                        name: m.user?.name || '',
                        email: m.user?.email || '',
                        avatar_url: m.user?.avatar_url || '',
                      }))} 
                    />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      <span>
                        {new Set(team.members.map(m => m.user?.timezone).filter(Boolean)).size} timezone{new Set(team.members.map(m => m.user?.timezone).filter(Boolean)).size !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
