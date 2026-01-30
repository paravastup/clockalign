'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MobileSidebar } from './sidebar'
import { Settings, LogOut, User, Globe, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  user: {
    email?: string
    name?: string
    avatar_url?: string
    timezone?: string
  }
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const initials = user.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.charAt(0).toUpperCase() || '?'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      <MobileSidebar />
      
      <div className="flex-1" />

      {/* Timezone indicator */}
      {user.timezone && (
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
          <Globe className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{user.timezone.replace('_', ' ')}</span>
        </div>
      )}

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9 hover:bg-accent">
        <Bell className="h-[18px] w-[18px]" />
        <span className="sr-only">Notifications</span>
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-accent transition-all">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar_url} alt={user.name || user.email} />
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              {user.name && (
                <p className="text-sm font-medium leading-none">{user.name}</p>
              )}
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
