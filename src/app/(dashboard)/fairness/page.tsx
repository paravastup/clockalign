/**
 * Fairness / Sacrifice Score Page
 * Team leaderboard and fairness metrics
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BarChart3, Trophy, Users, TrendingUp, AlertTriangle } from 'lucide-react'

export default async function FairnessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch user's teams
  const { data: memberships } = await supabase
    .from('team_members')
    .select('team:teams(id, name)')
    .eq('user_id', user.id) as { data: Array<{ team: { id: string; name: string } | null }> | null }

  const teams = memberships?.map(m => m.team).filter(Boolean) as Array<{ id: string; name: string }> || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-teal-950 dark:text-teal-50">Fairness Dashboard</h1>
        <p className="text-muted-foreground">
          Track meeting sacrifice across your teams
        </p>
      </div>

      {teams.length === 0 ? (
        <Card className="text-center py-16 card-elevated">
          <CardContent>
            <div className="w-20 h-20 rounded-2xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-sky-600" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight mb-3">No teams yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-[15px] leading-relaxed">
              Create or join a team to start tracking meeting fairness across your colleagues.
            </p>
            <Button size="lg" variant="shine" className="rounded-full px-8 h-12 bg-teal-700 hover:bg-teal-800" asChild>
              <Link href="/teams/new">
                Create a Team
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Leaderboard */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30">
                      <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold tracking-tight">Sacrifice Leaderboard</CardTitle>
                      <CardDescription className="text-[13px]">
                        Who&apos;s taking the hit for the team
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="rounded-full font-medium border-amber-200 text-amber-900 bg-amber-50">Last 30 days</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Placeholder leaderboard */}
                <div className="space-y-4 opacity-50">
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <div className="text-2xl">🥇</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-amber-900 dark:text-amber-100">Waiting for data...</span>
                        <span className="text-sm text-amber-700">0 pts</span>
                      </div>
                      <Progress value={0} className="h-2 bg-amber-100" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl">🥈</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">Schedule meetings</span>
                        <span className="text-sm text-muted-foreground">0 pts</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl">🥉</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">to see scores</span>
                        <span className="text-sm text-muted-foreground">0 pts</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-muted/50 border-dashed border">
                  <p className="text-sm text-muted-foreground text-center">
                    📊 Schedule meetings to start tracking sacrifice scores. 
                    The leaderboard will show who&apos;s taking early morning and late night calls.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold tracking-tight">Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sacrifice Score</span>
                  <span className="font-bold text-lg text-amber-600">0 pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Hours Reclaimed</span>
                  <span className="font-bold text-lg text-emerald-600">0h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Meetings This Month</span>
                  <span className="font-bold text-lg text-teal-600">0</span>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated border-amber-200/60 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2 text-amber-900 dark:text-amber-100">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Fairness Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                  No imbalances detected. Schedule more meetings to track fairness trends.
                </p>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold tracking-tight">Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {teams.map((team) => (
                    <Link 
                      key={team?.id}
                      href={`/teams/${team?.id}`}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors duration-200"
                    >
                      <span className="text-sm font-medium">{team?.name}</span>
                      <BarChart3 className="h-4 w-4 text-sky-500" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Feature Preview */}
      <Card className="card-elevated border-dashed border-teal-200/60 dark:border-teal-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50">
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight text-teal-950 dark:text-teal-50">
                Coming in Day 3: Full Sacrifice Score System
              </CardTitle>
              <CardDescription className="text-[13px]">
                Track fairness with detailed analytics and smart rotation suggestions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="font-semibold mb-1.5 tracking-tight text-teal-900 dark:text-teal-100">📈 Score History</div>
              <p className="text-muted-foreground text-[13px] leading-relaxed">
                Track sacrifice trends over time with charts
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="font-semibold mb-1.5 tracking-tight text-teal-900 dark:text-teal-100">🔄 Auto Rotation</div>
              <p className="text-muted-foreground text-[13px] leading-relaxed">
                Smart suggestions to balance recurring meetings
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="font-semibold mb-1.5 tracking-tight text-teal-900 dark:text-teal-100">📧 Karma Reports</div>
              <p className="text-muted-foreground text-[13px] leading-relaxed">
                Weekly digest of your team&apos;s fairness metrics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
