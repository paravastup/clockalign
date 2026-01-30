'use client'

import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
// import { TimezoneDisplay } from '@/components/timezone-picker'
import { MoreHorizontal, Shield, Crown, UserMinus, RefreshCw, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DateTime } from 'luxon'

export interface TeamMember {
  id: string
  user_id: string
  email: string
  name?: string
  avatar_url?: string
  timezone: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
}

interface TeamMemberListProps {
  members: TeamMember[]
  currentUserId: string
  isOwnerOrAdmin?: boolean
  onRemoveMember?: (memberId: string) => void
  onChangeRole?: (memberId: string, newRole: 'admin' | 'member') => void
}

function getRoleBadge(role: TeamMember['role']) {
  switch (role) {
    case 'owner':
      return (
        <Badge variant="default" className="gap-1">
          <Crown className="h-3 w-3" />
          Owner
        </Badge>
      )
    case 'admin':
      return (
        <Badge variant="secondary" className="gap-1">
          <Shield className="h-3 w-3" />
          Admin
        </Badge>
      )
    default:
      return null
  }
}

function getLocalTime(timezone: string): string {
  return DateTime.now().setZone(timezone).toFormat('h:mm a')
}

export function TeamMemberList({
  members,
  currentUserId,
  isOwnerOrAdmin = false,
  onRemoveMember,
  onChangeRole,
}: TeamMemberListProps) {
  // Sort members: owner first, then admins, then regular members
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, member: 2 }
    return roleOrder[a.role] - roleOrder[b.role]
  })

  return (
    <div className="space-y-2">
      {sortedMembers.map((member) => {
        const initials = member.name 
          ? member.name.split(' ').map(n => n[0]).join('').toUpperCase()
          : member.email.charAt(0).toUpperCase()
        
        const isCurrentUser = member.user_id === currentUserId
        const canManage = isOwnerOrAdmin && !isCurrentUser && member.role !== 'owner'

        return (
          <div
            key={member.id}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border bg-card',
              isCurrentUser && 'border-primary/30 bg-primary/5'
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.avatar_url} alt={member.name || member.email} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {member.name || member.email}
                    {isCurrentUser && (
                      <span className="text-muted-foreground ml-1">(you)</span>
                    )}
                  </span>
                  {getRoleBadge(member.role)}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    <span>{member.timezone.split('/').pop()?.replace(/_/g, ' ')}</span>
                    <span>•</span>
                    <span>{getLocalTime(member.timezone)}</span>
                  </div>
                </div>
              </div>
            </div>

            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Member actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {member.role === 'member' ? (
                    <DropdownMenuItem onClick={() => onChangeRole?.(member.id, 'admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Make Admin
                    </DropdownMenuItem>
                  ) : member.role === 'admin' ? (
                    <DropdownMenuItem onClick={() => onChangeRole?.(member.id, 'member')}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Remove Admin
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onRemoveMember?.(member.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    Remove from Team
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Compact member avatars for list views
export function TeamMemberAvatars({ 
  members, 
  max = 4 
}: { 
  members: Pick<TeamMember, 'name' | 'email' | 'avatar_url'>[]
  max?: number 
}) {
  const displayMembers = members.slice(0, max)
  const remaining = members.length - max

  return (
    <div className="flex -space-x-2">
      {displayMembers.map((member, i) => {
        const initials = member.name 
          ? member.name.split(' ').map(n => n[0]).join('').toUpperCase()
          : member.email.charAt(0).toUpperCase()
        
        return (
          <Avatar 
            key={i} 
            className="h-8 w-8 border-2 border-background"
          >
            <AvatarImage src={member.avatar_url} alt={member.name || member.email} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        )
      })}
      {remaining > 0 && (
        <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
          <span className="text-xs font-medium text-muted-foreground">+{remaining}</span>
        </div>
      )}
    </div>
  )
}
