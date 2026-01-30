/**
 * Dashboard Page
 * Main hub after login - shows quick stats, upcoming meetings, and actions
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Clock, 
  Zap,
  Trophy,
  Timer
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('name, timezone')
    .eq('id', user.id)
    .single() as { data: { name: string | null; timezone: string } | null }

  // Fetch team count
  const { count: teamCount } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id) as { count: number | null }

  // Fetch upcoming meetings count (placeholder - meetings table may not exist yet)
  const meetingCount = 0

  const firstName = profile?.name?.split(' ')[0] || user.email?.split('@')[0] || 'there'
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-teal-950 dark:text-teal-50">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of your fair scheduling stats.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="hover:text-teal-700 hover:border-teal-200">
             <Link href="/settings">
                <Clock className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                {profile?.timezone || 'Set Timezone'}
             </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{meetingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Meetings this week</p>
          </CardContent>
        </Card>
        
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sacrifice Score</CardTitle>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">0</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Perfect balance! 🎉</p>
          </CardContent>
        </Card>
        
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reclaimed</CardTitle>
            <Timer className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">0h</div>
            <p className="text-xs text-muted-foreground mt-1">Async time saved</p>
          </CardContent>
        </Card>
        
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team</CardTitle>
            <Users className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{(teamCount || 0) + 1}</div>
            <p className="text-xs text-muted-foreground mt-1">Members total</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="col-span-2 space-y-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Here</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
               <Link href="/meetings/new" className="block group">
                  <div className="h-full card-elevated p-6 hover:bg-teal-50/40 dark:hover:bg-teal-900/10 transition-colors border-l-4 border-l-transparent hover:border-l-teal-500">
                      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100/50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400">
                          <Calendar className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold mb-1 text-teal-950 dark:text-teal-50">New Meeting</h3>
                      <p className="text-sm text-muted-foreground">Find a time that works for everyone.</p>
                  </div>
               </Link>

               <Link href="/teams/new" className="block group">
                  <div className="h-full card-elevated p-6 hover:bg-sky-50/40 dark:hover:bg-sky-900/10 transition-colors border-l-4 border-l-transparent hover:border-l-sky-500">
                      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100/50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">
                          <Users className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold mb-1 text-teal-950 dark:text-teal-50">Add Team</h3>
                      <p className="text-sm text-muted-foreground">Invite members to track fairness.</p>
                  </div>
               </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-1">
                <Link href="/fairness" className="block group">
                    <div className="card-elevated p-6 hover:bg-amber-50/40 dark:hover:bg-amber-900/10 transition-colors flex items-center gap-6">
                        <div className="h-12 w-12 rounded-full bg-amber-100/50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shrink-0">
                             <BarChart3 className="h-6 w-6" />
                        </div>
                        <div>
                             <h3 className="font-semibold mb-1 text-teal-950 dark:text-teal-50">Fairness Dashboard</h3>
                             <p className="text-sm text-muted-foreground">See who is taking the scheduling hit.</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>

        <div className="space-y-5">
             <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Optimization</h2>
             
             <div className="card-elevated p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap className="h-32 w-32 -mr-10 -mt-10 text-amber-500" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 rounded bg-amber-100 text-amber-700">
                                <Zap className="h-4 w-4 fill-amber-700" />
                            </div>
                            <h3 className="font-semibold text-foreground">Golden Windows</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                            Optimize meetings for energy levels, not just availability. We analyze your sleep schedule to find peak times.
                        </p>
                    </div>
                     <Button variant="outline" size="sm" className="w-full bg-transparent border-amber-200 text-amber-800 hover:bg-amber-50 hover:text-amber-900" asChild>
                        <Link href="/settings">
                            Set Preferences
                        </Link>
                    </Button>
                </div>
             </div>
        </div>

      </div>

      {/* Empty State for Meetings */}
      {meetingCount === 0 && (
         <div className="mt-8 pt-8 border-t border-dashed border-teal-100 dark:border-teal-900/30">
            <div className="text-center space-y-4 max-w-sm mx-auto">
                 <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mx-auto text-teal-600">
                    <Calendar className="h-5 w-5" />
                 </div>
                 <div>
                    <h3 className="font-medium text-foreground">No meetings scheduled</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Your calendar is clear. When you're ready, schedule a fair meeting.
                    </p>
                 </div>
            </div>
         </div>
      )}
    </div>
  )
}
