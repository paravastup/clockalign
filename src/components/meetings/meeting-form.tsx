'use client'

/**
 * Meeting Creation Form Component
 * CA-043: Multi-step form for creating meetings with golden windows integration
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { NudgeBanner } from '@/components/async-nudge/nudge-banner'
import { analyzeForAsyncNudge, type NudgeResult } from '@/lib/async-nudge'
import {
  Calendar,
  Clock,
  Users,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ParticipantInput {
  email: string
  name?: string
}

interface MeetingFormData {
  title: string
  description: string
  duration: number
  meetingType: 'standup' | 'planning' | '1on1' | 'review' | 'brainstorm' | 'other'
  teamId?: string
  participants: ParticipantInput[]
  isRecurring: boolean
  recurrenceRule?: string
}

interface GoldenWindow {
  rank: number
  utcHour: number
  utcStartFormatted: string
  goldenScore: number
  qualityScore: number
  recommendation: string
  summary: string
  allAvailable: boolean
  participants: Array<{
    id: string
    name: string
    timezone: string
    localHour: number
    localTimeFormatted: string
    sharpness: number
    isAvailable: boolean
  }>
}

interface MeetingFormProps {
  teamId?: string
  onSuccess?: (meetingId: string) => void
  onCancel?: () => void
}

const STEPS = [
  { id: 'details', title: 'Meeting Details', icon: Calendar },
  { id: 'participants', title: 'Participants', icon: Users },
  { id: 'timing', title: 'Find Time', icon: Clock },
  { id: 'confirm', title: 'Confirm', icon: Check },
]

const MEETING_TYPES = [
  { value: 'standup', label: 'Standup', icon: '🏃' },
  { value: 'planning', label: 'Planning', icon: '📋' },
  { value: '1on1', label: '1:1', icon: '👥' },
  { value: 'review', label: 'Review', icon: '🔍' },
  { value: 'brainstorm', label: 'Brainstorm', icon: '💡' },
  { value: 'other', label: 'Other', icon: '📅' },
]

const DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
]

export function MeetingForm({ teamId, onSuccess, onCancel }: MeetingFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [findingTimes, setFindingTimes] = useState(false)
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])
  const [goldenWindows, setGoldenWindows] = useState<GoldenWindow[]>([])
  const [selectedSlot, setSelectedSlot] = useState<GoldenWindow | null>(null)
  const [nudge, setNudge] = useState<NudgeResult | null>(null)
  const [showNudge, setShowNudge] = useState(true)
  
  const [formData, setFormData] = useState<MeetingFormData>({
    title: '',
    description: '',
    duration: 30,
    meetingType: 'other',
    teamId: teamId || '',
    participants: [],
    isRecurring: false,
  })
  
  const [participantEmail, setParticipantEmail] = useState('')
  
  // Fetch teams on mount
  useEffect(() => {
    fetchTeams()
  }, [])
  
  // Analyze for async nudge when form changes
  useEffect(() => {
    if (formData.title && formData.participants.length > 0) {
      analyzeNudge()
    }
  }, [formData.title, formData.duration, formData.participants.length, formData.isRecurring])
  
  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error)
    }
  }
  
  const analyzeNudge = () => {
    // Simple estimate for now - real calculation would use participant data
    const totalSacrifice = formData.participants.length * 3 // Placeholder
    const result = analyzeForAsyncNudge({
      title: formData.title,
      meetingType: formData.meetingType,
      durationMinutes: formData.duration,
      participantCount: formData.participants.length + 1, // +1 for organizer
      totalSacrificePoints: totalSacrifice,
      maxIndividualSacrifice: 5,
      isRecurring: formData.isRecurring,
      timezoneSpread: 6, // Placeholder
    })
    setNudge(result)
  }
  
  const findGoldenWindows = async () => {
    setFindingTimes(true)
    try {
      // In a real app, we'd use participant IDs
      // For now, use team if selected
      const params = new URLSearchParams({
        topN: '5',
        includeHeatmap: 'true',
      })
      
      if (formData.teamId) {
        params.set('teamId', formData.teamId)
      }
      
      const response = await fetch(`/api/golden-windows?${params}`)
      if (response.ok) {
        const data = await response.json()
        setGoldenWindows(data.bestTimes || [])
      } else {
        toast.error('Could not find optimal times')
      }
    } catch (error) {
      console.error('Failed to find golden windows:', error)
      toast.error('Failed to analyze schedules')
    } finally {
      setFindingTimes(false)
    }
  }
  
  const addParticipant = () => {
    if (!participantEmail || !participantEmail.includes('@')) {
      toast.error('Please enter a valid email')
      return
    }
    
    if (formData.participants.some(p => p.email === participantEmail)) {
      toast.error('Participant already added')
      return
    }
    
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, { email: participantEmail }],
    }))
    setParticipantEmail('')
  }
  
  const removeParticipant = (email: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.email !== email),
    }))
  }
  
  const handleSubmit = async () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot')
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          selectedSlot: {
            utcHour: selectedSlot.utcHour,
            goldenScore: selectedSlot.goldenScore,
          },
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success('Meeting scheduled!')
        onSuccess?.(data.meeting.id)
        router.push(`/meetings/${data.meeting.id}`)
      } else {
        throw new Error('Failed to create meeting')
      }
    } catch (error) {
      toast.error('Failed to schedule meeting')
    } finally {
      setLoading(false)
    }
  }
  
  const nextStep = () => {
    if (currentStep === 1 && formData.participants.length === 0) {
      toast.error('Add at least one participant')
      return
    }
    if (currentStep === 1) {
      findGoldenWindows()
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
  }
  
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }
  
  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.title.length >= 3
      case 1:
        return formData.participants.length > 0 || formData.teamId
      case 2:
        return selectedSlot !== null
      default:
        return true
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between px-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const isComplete = index < currentStep
          const isCurrent = index === currentStep
          
          return (
            <div 
              key={step.id}
              className="flex items-center"
            >
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                isCurrent && 'bg-teal-50 text-teal-700',
                isComplete && 'text-teal-600',
                !isCurrent && !isComplete && 'text-gray-400'
              )}>
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  isCurrent && 'bg-teal-600 text-white',
                  isComplete && 'bg-teal-100',
                  !isCurrent && !isComplete && 'bg-gray-100'
                )}>
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium">
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={cn(
                  'w-8 h-0.5 mx-2',
                  isComplete ? 'bg-teal-300' : 'bg-gray-200'
                )} />
              )}
            </div>
          )
        })}
      </div>
      
      {/* Async nudge banner */}
      {showNudge && nudge && nudge.shouldNudge && currentStep === 0 && (
        <NudgeBanner
          nudge={nudge}
          onDismiss={() => setShowNudge(false)}
          onSelectAlternative={(alt) => {
            toast.success(`Great choice! Opening ${alt.name}...`)
            // In real app, would redirect to async tool
          }}
          onContinueWithMeeting={() => setShowNudge(false)}
        />
      )}
      
      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 0: Details */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  placeholder="Weekly Team Sync"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief agenda or notes..."
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meeting Type</Label>
                  <Select
                    value={formData.meetingType}
                    onValueChange={(value: typeof formData.meetingType) => 
                      setFormData(prev => ({ ...prev, meetingType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEETING_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            {type.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select
                    value={String(formData.duration)}
                    onValueChange={value => 
                      setFormData(prev => ({ ...prev, duration: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map(d => (
                        <SelectItem key={d.value} value={String(d.value)}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                <div>
                  <Label>Recurring Meeting</Label>
                  <p className="text-sm text-muted-foreground">
                    This meeting repeats regularly
                  </p>
                </div>
                <Switch
                  checked={formData.isRecurring}
                  onCheckedChange={checked => 
                    setFormData(prev => ({ ...prev, isRecurring: checked }))
                  }
                />
              </div>
            </div>
          )}
          
          {/* Step 1: Participants */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {teams.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Team (optional)</Label>
                  <Select
                    value={formData.teamId || 'none'}
                    onValueChange={value => 
                      setFormData(prev => ({ 
                        ...prev, 
                        teamId: value === 'none' ? '' : value 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a team..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No team - add manually</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Add Participants</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={participantEmail}
                    onChange={e => setParticipantEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addParticipant()}
                  />
                  <Button onClick={addParticipant}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {formData.participants.length > 0 && (
                <div className="space-y-2">
                  <Label>Participants ({formData.participants.length})</Label>
                  <div className="space-y-2">
                    {formData.participants.map(p => (
                      <div 
                        key={p.email}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {p.email.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{p.email}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeParticipant(p.email)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 2: Find Time */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center pb-4">
                <Sparkles className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <h3 className="font-semibold text-lg">Golden Windows</h3>
                <p className="text-sm text-muted-foreground">
                  Best times when everyone is sharp, not just available
                </p>
              </div>
              
              {findingTimes ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : goldenWindows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-amber-500" />
                  <p>No optimal times found for this group.</p>
                  <p className="text-sm">Try adjusting participants or duration.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {goldenWindows.map((slot) => (
                    <button
                      key={slot.utcHour}
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        'w-full p-4 rounded-lg border-2 text-left transition-all',
                        selectedSlot?.utcHour === slot.utcHour
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={slot.recommendation === 'excellent' ? 'default' : 'secondary'}
                            className={slot.recommendation === 'excellent' ? 'bg-emerald-500' : ''}
                          >
                            #{slot.rank}
                          </Badge>
                          <span className="font-semibold">
                            {slot.utcStartFormatted}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {slot.qualityScore}% energy
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {slot.summary}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {slot.participants?.slice(0, 3).map((p) => (
                          <Badge 
                            key={p.id} 
                            variant="secondary"
                            className="text-xs"
                          >
                            {p.name}: {p.localTimeFormatted}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Step 3: Confirm */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center pb-4">
                <Check className="h-12 w-12 text-teal-500 mx-auto mb-2" />
                <h3 className="font-semibold text-lg">Ready to Schedule</h3>
              </div>
              
              <div className="space-y-4 p-4 rounded-lg bg-gray-50">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title</span>
                  <span className="font-medium">{formData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{formData.duration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">{formData.meetingType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Participants</span>
                  <span className="font-medium">{formData.participants.length + 1}</span>
                </div>
                {selectedSlot && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">{selectedSlot.utcStartFormatted}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recurring</span>
                  <span className="font-medium">{formData.isRecurring ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="ghost"
              onClick={currentStep === 0 ? onCancel : prevStep}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStep === 0 ? 'Cancel' : 'Back'}
            </Button>
            
            {currentStep < STEPS.length - 1 ? (
              <Button onClick={nextStep} disabled={!canProceed()}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {loading ? 'Scheduling...' : 'Schedule Meeting'}
                <Check className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
