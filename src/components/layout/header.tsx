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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-950/60 px-4 md:px-6">
      <MobileSidebar />

      <div className="flex-1" />

      {/* Timezone indicator */}
      {user.timezone && (
        <div className="hidden md:flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-200/50 dark:border-zinc-800/50">
          <Globe className="h-3.5 w-3.5 text-teal-500" />
          <span className="text-xs font-medium">{user.timezone.replace('_', ' ')}</span>
        </div>
      )}

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
        <Bell className="h-[18px] w-[18px] text-zinc-500 dark:text-zinc-400" />
        <span className="sr-only">Notifications</span>
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ring-2 ring-transparent hover:ring-teal-200 dark:hover:ring-teal-800 transition-all">
            <Avatar className="h-9 w-9 ring-2 ring-zinc-100 dark:ring-zinc-800">
              <AvatarImage src={user.avatar_url} alt={user.name || user.email} />
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount sideOffset={8}>
          <DropdownMenuLabel className="font-normal p-3">
            <div className="flex flex-col space-y-1">
              {user.name && (
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user.name}</p>
              )}
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="py-2 cursor-pointer">
            <Link href="/settings" className="cursor-pointer flex items-center">
              <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 mr-2">
                <User className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
              </div>
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="py-2 cursor-pointer">
            <Link href="/settings" className="cursor-pointer flex items-center">
              <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 mr-2">
                <Settings className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
              </div>
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="py-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30"
          >
            <div className="p-1.5 rounded-md bg-red-50 dark:bg-red-950/30 mr-2">
              <LogOut className="h-3.5 w-3.5 text-red-500" />
            </div>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
