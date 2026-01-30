'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
// import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { TeamMemberList, type TeamMember } from '@/components/team-member-list'
import { 
  Users, 
  UserPlus, 
  Copy, 
  Check, 
  Mail, 
  Trash2, 
  BarChart3,
  Loader2,
  Clock,
  X,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'

interface TeamInvite {
  id: string
  team_id: string
  email: string
  invite_code: string
  status: string
  created_at: string
  expires_at: string
}

interface TeamDetailViewProps {
  team: {
    id: string
    name: string
    slug: string
    created_at: string
  }
  members: TeamMember[]
  invites: TeamInvite[]
  currentUserId: string
  currentUserRole: string
}

export function TeamDetailView({
  team,
  members,
  invites,
  currentUserId,
  currentUserRole,
}: TeamDetailViewProps) {
  const router = useRouter()
  const isOwnerOrAdmin = currentUserRole === 'owner' || currentUserRole === 'admin'
  
  const [inviteEmail, setInviteEmail] = React.useState('')
  const [inviteLoading, setInviteLoading] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [deleteLoading, setDeleteLoading] = React.useState(false)

  // Generate invite link (using first invite code or create new one)
  const inviteLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/invite/${team.slug}` 
    : ''

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    toast.success('Invite link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return
    
    setInviteLoading(true)
    try {
      const response = await fetch(`/api/teams/${team.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim().toLowerCase() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send invite')
      }

      toast.success(`Invite sent to ${inviteEmail}`)
      setInviteEmail('')
      setInviteDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send invite')
    } finally {
      setInviteLoading(false)
    }
  }

  const cancelInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/teams/${team.id}/invite/${inviteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to cancel invite')

      toast.success('Invite cancelled')
      router.refresh()
    } catch {
      toast.error('Failed to cancel invite')
    }
  }

  const removeMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/teams/${team.id}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to remove member')

      toast.success('Member removed')
      router.refresh()
    } catch {
      toast.error('Failed to remove member')
    }
  }

  const changeRole = async (memberId: string, newRole: 'admin' | 'member') => {
    try {
      const response = await fetch(`/api/teams/${team.id}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) throw new Error('Failed to update role')

      toast.success(`Role updated to ${newRole}`)
      router.refresh()
    } catch {
      toast.error('Failed to update role')
    }
  }

  const deleteTeam = async () => {
    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete team')

      toast.success('Team deleted')
      router.push('/teams')
      router.refresh()
    } catch {
      toast.error('Failed to delete team')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Get timezone stats
  const timezones = Array.from(new Set(members.map(m => m.timezone)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/teams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
          <p className="text-muted-foreground">
            {members.length} member{members.length !== 1 ? 's' : ''} • {timezones.length} timezone{timezones.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isOwnerOrAdmin && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Members
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Members</DialogTitle>
                <DialogDescription>
                  Send invites via email or share the invite link
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Email Invite */}
                <div className="space-y-2">
                  <Label>Invite by Email</Label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
                    />
                    <Button onClick={sendInvite} disabled={inviteLoading || !inviteEmail.includes('@')}>
                      {inviteLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Share Link */}
                <div className="space-y-2">
                  <Label>Share Invite Link</Label>
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly className="bg-muted" />
                    <Button variant="outline" onClick={copyInviteLink}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          {isOwnerOrAdmin && (
            <TabsTrigger value="invites" className="gap-2">
              <Mail className="h-4 w-4" />
              Pending Invites
              {invites.length > 0 && (
                <Badge variant="secondary" className="ml-1">{invites.length}</Badge>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="settings" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Everyone in {team.name} and their local timezones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamMemberList
                members={members}
                currentUserId={currentUserId}
                isOwnerOrAdmin={isOwnerOrAdmin}
                onRemoveMember={removeMember}
                onChangeRole={changeRole}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invites Tab */}
        {isOwnerOrAdmin && (
          <TabsContent value="invites" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Invites</CardTitle>
                <CardDescription>
                  People who haven&apos;t accepted their invite yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invites.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No pending invites
                  </p>
                ) : (
                  <div className="space-y-2">
                    {invites.map((invite) => (
                      <div 
                        key={invite.id} 
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{invite.email}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Invited {new Date(invite.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => cancelInvite(invite.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>
                Manage team configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input value={team.name} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Team Slug</Label>
                <Input value={team.slug} disabled className="bg-muted" />
              </div>
            </CardContent>
          </Card>

          {currentUserRole === 'owner' && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions for this team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Team?</DialogTitle>
                      <DialogDescription>
                        This will permanently delete {team.name} and remove all members. 
                        This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button 
                        variant="destructive" 
                        onClick={deleteTeam}
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete Team
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
