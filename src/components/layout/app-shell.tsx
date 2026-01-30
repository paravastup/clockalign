'use client'

import * as React from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Main content area */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
        )}
      >
        <Header user={user} />
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
