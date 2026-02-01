'use client'

import * as React from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { MobileNav, FloatingActionButton } from './mobile-nav'
import { CommandPalette, useCommandPalette } from '@/components/ui/command-palette'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
  user: {
    email?: string
    name?: string
    avatar_url?: string
    timezone?: string
  }
}

export function AppShell({ children, user }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const { isOpen: isCommandPaletteOpen, close: closeCommandPalette } = useCommandPalette()

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-950 dark:via-slate-900/20 dark:to-slate-950">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#0d948805_1px,transparent_1px),linear-gradient(to_bottom,#0d948805_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* Ambient glow effects */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Floating Action Button (Desktop) */}
      <FloatingActionButton />

      {/* Command Palette */}
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={closeCommandPalette} />

      {/* Main content area */}
      <div
        className={cn(
          'relative transition-all duration-300 ease-in-out',
          'pb-20 md:pb-0', // Padding for mobile nav
          sidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
        )}
      >
        <Header user={user} />
        <main className="p-4 md:p-6 lg:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  )
}
