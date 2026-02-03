/**
 * Dashboard Page - Premium UI
 * Main hub after login with enhanced empty states and micro-interactions
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Clock, 
  Zap,
  Trophy,
  Timer,
  ArrowRight,
  Sparkles,
  Globe,
  type LucideIcon
} from 'lucide-react'
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { WelcomeHeader } from '@/components/dashboard/welcome-header'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch user profile (use maybeSingle to avoid throwing if profile doesn't exist yet)
  const { data: profileData, error: profileError } = await supabase
    .from('users')
    .select('name, timezone, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('Dashboard profile fetch error:', profileError)
  }

  const profile = profileData as { name: string | null; timezone: string; onboarding_completed?: boolean } | null

  // Fetch team count
  const { count: teamCount } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id) as { count: number | null }

  // Fetch upcoming meetings
  const { data: upcomingMeetingsData } = await supabase
    .from('meetings')
    .select('id, title, start_time')
    .eq('organizer_id', user.id)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(5)

  const upcomingMeetings = upcomingMeetingsData as { id: string; title: string; start_time: string }[] | null
  const meetingCount = upcomingMeetings?.length || 0
  const firstName = profile?.name?.split(' ')[0] || user.email?.split('@')[0] || 'there'

  // Onboarding tasks
  const onboardingTasks = [
    { id: 'timezone', label: 'Set your timezone', completed: !!profile?.timezone, href: '/settings' },
    { id: 'team', label: 'Create or join a team', completed: (teamCount || 0) > 0, href: '/teams' },
    { id: 'meeting', label: 'Schedule your first meeting', completed: meetingCount > 0, href: '/meetings/new' },
  ]
  const completedTasks = onboardingTasks.filter(t => t.completed).length
  const showOnboarding = completedTasks < onboardingTasks.length && !profile?.onboarding_completed

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <WelcomeHeader firstName={firstName} timezone={profile?.timezone} />

      {/* Onboarding Checklist */}
      {showOnboarding && (
        <OnboardingChecklist 
          tasks={onboardingTasks} 
          completedCount={completedTasks}
          totalCount={onboardingTasks.length}
        />
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Upcoming"
          value={meetingCount}
          suffix=""
          subtitle="Meetings this week"
          icon={Calendar}
          iconColor="text-[hsl(var(--brand))]"
          trend={meetingCount > 0 ? { value: 2, label: 'vs last week' } : undefined}
        />

        <StatsCard
          title="Sacrifice Score"
          value={0}
          suffix=""
          subtitle="Perfect balance! 🎉"
          icon={Trophy}
          iconColor="text-amber-500"
          subtitleColor="text-emerald-600 dark:text-emerald-400"
        />

        <StatsCard
          title="Reclaimed"
          value={0}
          suffix="h"
          subtitle="Async time saved"
          icon={Timer}
          iconColor="text-emerald-500"
        />

        <StatsCard
          title="Team"
          value={(teamCount || 0) + 1}
          suffix=""
          subtitle="Members total"
          icon={Users}
          iconColor="text-sky-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Actions
            </h2>
            <Link
              href="/meetings"
              className="text-xs text-[hsl(var(--brand))] hover:text-[hsl(var(--brand))]/80 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <ActionCard
              href="/meetings/new"
              icon={Calendar}
              title="New Meeting"
              description="Find a time that works for everyone"
            />

            <ActionCard
              href="/teams/new"
              icon={Users}
              title="Add Team"
              description="Invite members to track fairness"
            />
          </div>

          <ActionCard
            href="/fairness"
            icon={BarChart3}
            title="Fairness Dashboard"
            description="See who is taking the scheduling hit across your team"
            size="large"
          />
        </div>

        {/* Side Panel */}
        <div className="space-y-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Optimization
          </h2>

          <Card className="relative overflow-hidden border-border">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Zap className="h-32 w-32 text-foreground" />
            </div>
            <CardHeader className="relative z-10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-muted text-amber-500">
                  <Sparkles className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-semibold">Golden Windows</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Optimize meetings for energy levels, not just availability. We analyze your schedule to find peak times.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                asChild
              >
                <Link href="/settings">Set Preferences</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Timezone Card */}
          <Card className="relative overflow-hidden border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-muted text-muted-foreground">
                  <Globe className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-semibold">Your Timezone</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {profile?.timezone || 'Not set'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 -ml-2 text-[hsl(var(--brand))] hover:text-[hsl(var(--brand))]/80"
                asChild
              >
                <Link href="/settings">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  Change timezone
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Meetings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Upcoming Meetings
          </h2>
        </div>

        {meetingCount === 0 ? (
          <Card className="border-dashed border-border">
            <EmptyState
              title="No meetings scheduled"
              description="Your calendar is clear. When you're ready, schedule a fair meeting that works for everyone's timezone."
              illustration="calendar"
              action={{
                label: 'Schedule Meeting',
                href: '/meetings/new',
              }}
              secondaryAction={{
                label: 'Learn more',
                href: '/finder',
              }}
              size="md"
            />
          </Card>
        ) : (
          <div className="grid gap-3">
            {upcomingMeetings?.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Stats Card Component
interface StatsCardProps {
  title: string
  value: number
  suffix: string
  subtitle: string
  icon: LucideIcon
  iconColor: string
  subtitleColor?: string
  trend?: { value: number; label: string }
}

function StatsCard({
  title,
  value,
  suffix,
  subtitle,
  icon: Icon,
  iconColor,
  subtitleColor = 'text-muted-foreground',
  trend,
}: StatsCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1 border-border">
      {/* Background hover effect */}
      <div className="absolute inset-0 bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-xl bg-muted group-hover:scale-110 transition-transform duration-300">
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-baseline gap-1">
          <AnimatedCounter
            value={value}
            className="text-2xl font-bold tracking-tight text-foreground"
          />
          {suffix && (
            <span className="text-lg font-semibold text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className={`text-xs ${subtitleColor}`}>{subtitle}</p>
          {trend && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              +{trend.value} {trend.label}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Action Card Component
interface ActionCardProps {
  href: string
  icon: LucideIcon
  title: string
  description: string
  size?: 'default' | 'large'
}

function ActionCard({
  href,
  icon: Icon,
  title,
  description,
  size = 'default',
}: ActionCardProps) {
  const isLarge = size === 'large'

  return (
    <Link href={href} className="block group">
      <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1 border-border hover:border-[hsl(var(--brand))]/40 ${
        isLarge ? 'flex items-center gap-6 p-6' : 'p-6'
      }`}>
        {/* Background decoration */}
        <div className="absolute inset-0 bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Icon className="h-16 w-16 text-muted-foreground/20 -mr-4 -mt-4" />
        </div>

        {/* Icon */}
        <div className={`relative z-10 ${isLarge ? 'h-12 w-12' : 'h-10 w-10 mb-4'} rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-5 w-5 text-[hsl(var(--brand))]" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h3 className={`font-semibold mb-1 text-foreground group-hover:text-[hsl(var(--brand))] transition-colors ${isLarge ? 'text-lg' : ''}`}>
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Arrow indicator */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <ArrowRight className="h-5 w-5 text-[hsl(var(--brand))]" />
        </div>
      </Card>
    </Link>
  )
}

// Meeting Card Component
function MeetingCard({ meeting }: { meeting: { id: string; title: string; start_time: string } }) {
  const date = new Date(meeting.start_time)
  const isToday = new Date().toDateString() === date.toDateString()
  const isTomorrow = new Date(Date.now() + 86400000).toDateString() === date.toDateString()

  let dateLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (isToday) dateLabel = 'Today'
  if (isTomorrow) dateLabel = 'Tomorrow'

  return (
    <Link href={`/meetings/${meeting.id}`}>
      <Card className="group hover:border-[hsl(var(--brand))]/40 border-border transition-all duration-300 hover:shadow-md">
        <CardContent className="p-4 flex items-center gap-4">
          {/* Date badge */}
          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-muted text-[hsl(var(--brand))] shrink-0">
            <span className="text-xs font-medium uppercase">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
            <span className="text-lg font-bold">{date.getDate()}</span>
          </div>

          {/* Meeting info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate group-hover:text-[hsl(var(--brand))] transition-colors">
              {meeting.title}
            </h4>
            <p className="text-sm text-muted-foreground">
              {dateLabel} at {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>

          {/* Arrow */}
          <ArrowRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-[hsl(var(--brand))] transition-colors transform group-hover:translate-x-1" />
        </CardContent>
      </Card>
    </Link>
  )
}
