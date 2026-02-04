/**
 * Dashboard Page - Clean Minimal UI
 * Modern, professional dashboard with subtle visual hierarchy
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Calendar,
  Users,
  BarChart3,
  Clock,
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
    <div className="space-y-10">
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

      {/* Stats Row - Clean inline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatItem
          label="Upcoming"
          value={meetingCount}
          suffix=""
          detail="meetings"
          icon={Calendar}
        />
        <StatItem
          label="Sacrifice"
          value={0}
          suffix=""
          detail="perfect balance"
          icon={Trophy}
        />
        <StatItem
          label="Reclaimed"
          value={0}
          suffix="h"
          detail="async saved"
          icon={Timer}
        />
        <StatItem
          label="Team"
          value={(teamCount || 0) + 1}
          suffix=""
          detail="members"
          icon={Users}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Quick Actions - Left */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">Quick Actions</h2>
            <Link
              href="/meetings"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              All meetings <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ActionItem
              href="/meetings/new"
              icon={Calendar}
              title="New Meeting"
              description="Find fair times"
            />
            <ActionItem
              href="/teams/new"
              icon={Users}
              title="Add Team"
              description="Track fairness"
            />
          </div>

          <ActionItem
            href="/fairness"
            icon={BarChart3}
            title="Fairness Dashboard"
            description="See who's taking the scheduling hit"
            featured
          />
        </div>

        {/* Side Panel - Right */}
        <div className="space-y-6">
          <h2 className="text-sm font-medium text-foreground">Settings</h2>

          {/* Golden Windows */}
          <div className="group p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 hover:from-amber-500/10 hover:to-orange-500/10 transition-colors">
            <div className="flex items-start gap-3 mb-3">
              <Sparkles className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground">Golden Windows</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Optimize for energy, not just availability
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start -ml-2 text-muted-foreground hover:text-foreground" asChild>
              <Link href="/settings">
                Set preferences <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </Link>
            </Button>
          </div>

          {/* Timezone */}
          <div className="p-5 rounded-2xl bg-muted/30">
            <div className="flex items-start gap-3 mb-3">
              <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground">Timezone</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {profile?.timezone?.replace(/_/g, ' ') || 'Not configured'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start -ml-2 text-muted-foreground hover:text-foreground" asChild>
              <Link href="/settings">
                <Clock className="w-3.5 h-3.5 mr-2" />
                {profile?.timezone ? 'Change' : 'Set timezone'}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Upcoming Meetings */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-foreground">Upcoming Meetings</h2>

        {meetingCount === 0 ? (
          <div className="py-12 text-center">
            <EmptyState
              title="No meetings scheduled"
              description="Schedule a fair meeting that works for everyone's timezone."
              illustration="calendar"
              action={{
                label: 'Schedule Meeting',
                href: '/meetings/new',
              }}
              size="sm"
            />
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingMeetings?.map((meeting) => (
              <MeetingRow key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Minimal stat display
function StatItem({
  label,
  value,
  suffix,
  detail,
  icon: Icon,
}: {
  label: string
  value: number
  suffix: string
  detail: string
  icon: LucideIcon
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <AnimatedCounter
          value={value}
          className="text-3xl font-semibold tracking-tight text-foreground"
        />
        {suffix && <span className="text-xl text-muted-foreground">{suffix}</span>}
      </div>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

// Clean action item
function ActionItem({
  href,
  icon: Icon,
  title,
  description,
  featured = false,
}: {
  href: string
  icon: LucideIcon
  title: string
  description: string
  featured?: boolean
}) {
  return (
    <Link href={href} className="group block">
      <div className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
        featured
          ? 'bg-[hsl(var(--brand))]/5 hover:bg-[hsl(var(--brand))]/10'
          : 'hover:bg-muted/50'
      }`}>
        <div className={`p-2.5 rounded-lg ${featured ? 'bg-[hsl(var(--brand))]/10' : 'bg-muted'}`}>
          <Icon className={`w-5 h-5 ${featured ? 'text-[hsl(var(--brand))]' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground group-hover:text-[hsl(var(--brand))] transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-[hsl(var(--brand))] group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  )
}

// Simple meeting row
function MeetingRow({ meeting }: { meeting: { id: string; title: string; start_time: string } }) {
  const date = new Date(meeting.start_time)
  const meetingDateStr = date.toDateString()
  // Compute today/tomorrow using the meeting date as reference to avoid impure Date calls
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isToday = meetingDateStr === today.toDateString()
  const isTomorrow = meetingDateStr === tomorrow.toDateString()

  let dateLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (isToday) dateLabel = 'Today'
  if (isTomorrow) dateLabel = 'Tomorrow'

  return (
    <Link href={`/meetings/${meeting.id}`} className="group block">
      <div className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="w-12 text-center">
          <div className="text-lg font-semibold text-foreground">{date.getDate()}</div>
          <div className="text-xs text-muted-foreground uppercase">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate group-hover:text-[hsl(var(--brand))] transition-colors">
            {meeting.title}
          </h4>
          <p className="text-sm text-muted-foreground">
            {dateLabel} · {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
      </div>
    </Link>
  )
}
