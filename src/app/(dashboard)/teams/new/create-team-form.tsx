'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
// import { createClient } from '@/lib/supabase/client'
import { Users, Mail, X, Check, ArrowRight, ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface CreateTeamFormProps {
  userId: string  // Used for context
}

type Step = 'name' | 'invite' | 'confirm'

export function CreateTeamForm({ userId: _userId }: CreateTeamFormProps) {
  const router = useRouter()
  // supabase client available for future use
  void _userId
  
  const [step, setStep] = React.useState<Step>('name')
  const [loading, setLoading] = React.useState(false)
  
  // Form data
  const [teamName, setTeamName] = React.useState('')
  const [inviteEmail, setInviteEmail] = React.useState('')
  const [invitedEmails, setInvitedEmails] = React.useState<string[]>([])

  const steps: Step[] = ['name', 'invite', 'confirm']
  const currentStepIndex = steps.indexOf(step)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const addEmail = () => {
    const email = inviteEmail.trim().toLowerCase()
    if (email && !invitedEmails.includes(email) && email.includes('@')) {
      setInvitedEmails([...invitedEmails, email])
      setInviteEmail('')
    }
  }

  const removeEmail = (email: string) => {
    setInvitedEmails(invitedEmails.filter(e => e !== email))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addEmail()
    }
  }

  const createTeam = async () => {
    setLoading(true)
    
    try {
      // Create slug from team name
      const slug = teamName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Math.random().toString(36).substring(2, 6)

      // Call the API to create the team
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName,
          slug,
          invites: invitedEmails,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create team')
      }

      const { team } = await response.json()
      
      toast.success('Team created successfully!')
      router.push(`/teams/${team.id}`)
      router.refresh()
    } catch (error) {
      console.error('Error creating team:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span className="font-medium">
            {step === 'name' && 'Team Name'}
            {step === 'invite' && 'Invite Members'}
            {step === 'confirm' && 'Confirmation'}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step 1: Team Name */}
      {step === 'name' && (
        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>What&apos;s your team called?</CardTitle>
            <CardDescription>
              Choose a name that your team will recognize
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g., Engineering, Product, Marketing"
                autoFocus
              />
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={() => setStep('invite')}
                disabled={!teamName.trim()}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Invite Members */}
      {step === 'invite' && (
        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Invite team members</CardTitle>
            <CardDescription>
              Add your teammates by email. You can always add more later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="colleague@company.com"
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={addEmail}
                  disabled={!inviteEmail.trim() || !inviteEmail.includes('@')}
                >
                  Add
                </Button>
              </div>
            </div>

            {invitedEmails.length > 0 && (
              <div className="space-y-2">
                <Label>Pending Invites ({invitedEmails.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {invitedEmails.map((email) => (
                    <Badge 
                      key={email} 
                      variant="secondary" 
                      className="gap-1 pr-1"
                    >
                      {email}
                      <button 
                        onClick={() => removeEmail(email)}
                        className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep('name')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep('confirm')}>
                {invitedEmails.length > 0 ? 'Continue' : 'Skip for now'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && (
        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Ready to create your team!</CardTitle>
            <CardDescription>
              Review the details below and create your team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 rounded-lg bg-muted/50">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Team Name</span>
                <span className="font-medium">{teamName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Members to Invite</span>
                <span className="font-medium">
                  {invitedEmails.length > 0 ? invitedEmails.length : 'None yet'}
                </span>
              </div>
              {invitedEmails.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex flex-wrap gap-2">
                    {invitedEmails.map((email) => (
                      <Badge key={email} variant="outline">{email}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep('invite')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={createTeam} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Create Team
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
