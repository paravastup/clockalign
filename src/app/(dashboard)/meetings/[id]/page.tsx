/**
 * Meeting Detail Page
 * CA-044: Shows meeting details, participants, and sacrifice scores
 */

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Edit,
  Trash2,
  ArrowLeft,
  ExternalLink,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Repeat,
  Sparkles,
} from 'lucide-react'
import { formatHour, getSharpnessEmoji } from '@/lib/golden-windows'
import { getCategoryColor, formatPoints } from '@/lib/sacrifice-score'
import { DateTime } from 'luxon'

interface PageProps {
  params: Promise<{ id: string }>
}

const MEETING_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  standup: { label: 'Standup', icon: '🏃' },
  planning: { label: 'Planning', icon: '📋' },
  '1on1': { label: '1:1', icon: '👥' },
  review: { label: 'Review', icon: '🔍' },
  brainstorm: { label: 'Brainstorm', icon: '💡' },
  other: { label: 'Meeting', icon: '📅' },
}

const STATUS_CONFIG = {
  pending: { icon: HelpCircle, color: 'text-yellow-500', label: 'Pending' },
  accepted: { icon: CheckCircle2, color: 'text-green-500', label: 'Accepted' },
  declined: { icon: XCircle, color: 'text-red-500', label: 'Declined' },
  tentative: { icon: HelpCircle, color: 'text-blue-500', label: 'Tentative' },
}

export default async function MeetingDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Fetch meeting with participants
  const { data: meeting, error } = await supabase
    .from('meetings')
    .select(`
      *,
      organizer:users!meetings_organizer_id_fkey(id, name, email, timezone),
      team:teams(id, name),
      meeting_participants(
        id,
        user_id,
        email,
        name,
        timezone,
        status,
        user:users(id, name, email, timezone, energy_profile)
      ),
      meeting_slots(
        id,
        start_time,
        end_time,
        status,
        golden_score,
        total_sacrifice_points
      )
    `)
    .eq('id', id)
    .single()
  
  if (error || !meeting) {
    notFound()
  }
  
  // Type the meeting data
  const meetingData = meeting as {
    id: string
    title: string
    description: string | null
    duration_minutes: number
    meeting_type: string | null
    is_recurring: boolean
    organizer: { id: string; name: string | null; email: string; timezone: string } | null
    team: { id: string; name: string } | null
    meeting_participants: Array<{
      id: string
      user_id: string | null
      email: string
      name: string | null
      timezone: string
      status: string
      user?: { id: string; name: string | null; email: string; timezone: string; energy_profile: Record<string, unknown> | null } | null
    }>
    meeting_slots: Array<{
      id: string
      start_time: string
      end_time: string
      status: string
      golden_score: number | null
      total_sacrifice_points: number | null
    }>
  }
  
  // Get confirmed slot
  const confirmedSlot = meetingData.meeting_slots?.find(s => s.status === 'confirmed')
  
  const organizer = meetingData.organizer
  const participants = meetingData.meeting_participants || []
  const team = meetingData.team
  
  const typeInfo = MEETING_TYPE_LABELS[meetingData.meeting_type || 'other'] || MEETING_TYPE_LABELS.other
  
  const getInitials = (name: string | null, email: string): string => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }
  
  const formatMeetingTime = (startTime: string, timezone: string) => {
    const dt = DateTime.fromISO(startTime).setZone(timezone)
    return {
      date: dt.toFormat('EEEE, MMMM d, yyyy'),
      time: dt.toFormat('h:mm a'),
      timezone: dt.toFormat('ZZZZ'),
    }
  }
  
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/meetings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{typeInfo.icon}</span>
              <h1 className="text-2xl font-bold tracking-tight">
                {meetingData.title}
              </h1>
              {meetingData.is_recurring && (
                <Badge variant="secondary" className="gap-1">
                  <Repeat className="h-3 w-3" />
                  Recurring
                </Badge>
              )}
            </div>
            {meetingData.description && (
              <p className="text-muted-foreground">{meetingData.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
      
      {/* Main content grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column - Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Time Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal-600" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {confirmedSlot ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-teal-50">
                      <Clock className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        {formatMeetingTime(confirmedSlot.start_time, organizer?.timezone || 'UTC').date}
                      </p>
                      <p className="text-muted-foreground">
                        {formatMeetingTime(confirmedSlot.start_time, organizer?.timezone || 'UTC').time} ({meetingData.duration_minutes} min)
                      </p>
                    </div>
                  </div>
                  
                  {/* Golden score */}
                  {confirmedSlot.golden_score !== null && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          Golden Score: {Math.round(confirmedSlot.golden_score)}%
                        </p>
                        <p className="text-xs text-amber-600">
                          Energy alignment across all participants
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Sacrifice score warning */}
                  {confirmedSlot.total_sacrifice_points && confirmedSlot.total_sacrifice_points > 15 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">
                          High Sacrifice: {confirmedSlot.total_sacrifice_points} points
                        </p>
                        <p className="text-xs text-orange-600">
                          Consider rotating times in future meetings
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Time not yet confirmed</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Participants Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-600" />
                Participants ({participants.length + 1})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Organizer */}
                {organizer && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-teal-50">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-teal-200 text-teal-700">
                          {getInitials(organizer.name, organizer.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {organizer.name || organizer.email}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {organizer.timezone}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-teal-600">Organizer</Badge>
                  </div>
                )}
                
                <Separator />
                
                {/* Other participants */}
                {participants.map(p => {
                  const StatusIcon = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG]?.icon || HelpCircle
                  const statusColor = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG]?.color || 'text-gray-500'
                  const statusLabel = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG]?.label || 'Unknown'
                  
                  return (
                    <div 
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(p.name, p.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {p.name || p.email}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {p.timezone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                        <span className={`text-sm ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Summary */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{typeInfo.icon} {typeInfo.label}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{meetingData.duration_minutes} min</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Recurring</span>
                <span className="font-medium">{meetingData.is_recurring ? 'Yes' : 'No'}</span>
              </div>
              {team && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Team</span>
                    <Link href={`/teams/${team.id}`} className="font-medium text-teal-600 hover:underline">
                      {team.name}
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Sacrifice Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-amber-500" />
                Sacrifice Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-amber-600">
                  {confirmedSlot?.total_sacrifice_points || 0}
                </div>
                <p className="text-sm text-muted-foreground">total points</p>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Points are distributed across {participants.length + 1} participants based on their local times
              </p>
            </CardContent>
          </Card>
          
          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              <Button className="w-full" variant="outline" asChild>
                <a href="#" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Add to Calendar
                </a>
              </Button>
              <Button className="w-full" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Invite More People
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
