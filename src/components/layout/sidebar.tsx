'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Home,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  Clock,
  PlusCircle,
  Crown,
  ArrowRight,
} from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { SubscriptionBadge } from '@/components/premium-gate'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  color?: string
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: Home, color: 'teal' },
  { title: 'Meetings', href: '/meetings', icon: Calendar, color: 'teal' },
  { title: 'Teams', href: '/teams', icon: Users, color: 'sky' },
  { title: 'Fairness', href: '/fairness', icon: BarChart3, color: 'amber' },
  { title: 'Settings', href: '/settings', icon: Settings, color: 'zinc' },
]

interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

function NavLink({
  item,
  collapsed,
  isActive
}: {
  item: NavItem
  collapsed: boolean
  isActive: boolean
}) {
  const Icon = item.icon

  const colorStyles = {
    teal: {
      active: 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300',
      icon: 'text-teal-600 dark:text-teal-400',
      hover: 'hover:bg-teal-50/50 dark:hover:bg-teal-950/30 hover:text-teal-700 dark:hover:text-teal-300',
    },
    sky: {
      active: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300',
      icon: 'text-sky-600 dark:text-sky-400',
      hover: 'hover:bg-sky-50/50 dark:hover:bg-sky-950/30 hover:text-sky-700 dark:hover:text-sky-300',
    },
    amber: {
      active: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
      icon: 'text-amber-600 dark:text-amber-400',
      hover: 'hover:bg-amber-50/50 dark:hover:bg-amber-950/30 hover:text-amber-700 dark:hover:text-amber-300',
    },
    zinc: {
      active: 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100',
      icon: 'text-zinc-600 dark:text-zinc-400',
      hover: 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-800 dark:hover:text-zinc-200',
    },
  }

  const colors = colorStyles[item.color as keyof typeof colorStyles] || colorStyles.teal

  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
        isActive
          ? colors.active
          : cn('text-zinc-500 dark:text-zinc-400', colors.hover),
        collapsed && 'justify-center px-2'
      )}
    >
      <div className={cn(
        'p-1.5 rounded-lg transition-all duration-200',
        isActive
          ? cn('bg-white dark:bg-zinc-900 shadow-sm', colors.icon)
          : 'bg-zinc-100/50 dark:bg-zinc-800/50 group-hover:bg-white dark:group-hover:bg-zinc-800 group-hover:shadow-sm'
      )}>
        <Icon className={cn('h-[16px] w-[16px] shrink-0', isActive ? colors.icon : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300')} />
      </div>
      {!collapsed && <span>{item.title}</span>}
      {!collapsed && item.badge && (
        <span className="ml-auto rounded-full bg-teal-500 px-2 py-0.5 text-xs text-white font-semibold shadow-sm">
          {item.badge}
        </span>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-4">
          {item.title}
          {item.badge && (
            <span className="ml-auto text-xs text-muted-foreground">{item.badge}</span>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  return linkContent
}

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={cn(
            'flex h-16 items-center border-b border-border/50 px-4',
            collapsed ? 'justify-center' : 'justify-between'
          )}>
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-500/30 group-hover:shadow-teal-500/40 transition-shadow">
                <Clock className="h-4 w-4" />
              </div>
              {!collapsed && (
                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-teal-800 to-teal-600 dark:from-teal-200 dark:to-teal-400 bg-clip-text text-transparent">
                  ClockAlign
                </span>
              )}
            </Link>
            {!collapsed && onCollapsedChange && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => onCollapsedChange(true)}
              >
                <ChevronLeft className="h-4 w-4 text-zinc-400" />
              </Button>
            )}
          </div>

          {/* New Meeting Button */}
          <div className={cn('p-4', collapsed && 'px-3')}>
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button size="icon" className="w-full h-10 rounded-xl btn-primary-gradient shadow-lg shadow-teal-500/25" asChild>
                    <Link href="/meetings/new">
                      <PlusCircle className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">New Meeting</TooltipContent>
              </Tooltip>
            ) : (
              <Button className="w-full gap-2 h-11 rounded-xl btn-primary-gradient shadow-lg shadow-teal-500/25 text-white font-semibold" asChild>
                <Link href="/meetings/new">
                  <PlusCircle className="h-4 w-4" />
                  New Meeting
                </Link>
              </Button>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                />
              ))}
            </nav>
          </ScrollArea>

          {/* Upgrade Banner */}
          <SidebarUpgradeBanner collapsed={collapsed} />

          {/* Collapse Toggle (when collapsed) */}
          {collapsed && onCollapsedChange && (
            <div className="border-t border-border/50 p-2">
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-9 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => onCollapsedChange(false)}
              >
                <ChevronRight className="h-4 w-4 text-zinc-400" />
              </Button>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}

/**
 * Sidebar Upgrade Banner
 * Shows upgrade CTA for free users, Pro badge for subscribers
 */
function SidebarUpgradeBanner({ collapsed }: { collapsed: boolean }) {
  const { isPro, isLoading, isTrialing } = useSubscription()

  if (isLoading) {
    return null
  }

  if (isPro) {
    // Show Pro badge for subscribers
    if (collapsed) {
      return (
        <div className="border-t border-border/50 p-2">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
                  <Crown className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isTrialing ? 'Pro Trial' : 'Pro Plan'}
            </TooltipContent>
          </Tooltip>
        </div>
      )
    }

    return (
      <div className="border-t border-border/50 p-3">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <div className="p-1 rounded-md bg-gradient-to-br from-amber-400 to-orange-500">
            <Crown className="h-3 w-3 text-white" />
          </div>
          <span className="text-xs font-medium text-amber-900 dark:text-amber-100">
            {isTrialing ? 'Pro Trial' : 'Pro Plan'}
          </span>
        </div>
      </div>
    )
  }

  // Show upgrade CTA for free users
  if (collapsed) {
    return (
      <div className="border-t border-border/50 p-2">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link href="/pricing">
              <Button size="icon" variant="ghost" className="w-full h-9 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30">
                <Crown className="h-4 w-4 text-amber-500" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Upgrade to Pro</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="border-t border-border/50 p-3">
      <Link href="/pricing">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-950/50 dark:hover:to-orange-950/50 transition-colors cursor-pointer group">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
            <Crown className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Upgrade to Pro</p>
            <p className="text-xs text-amber-700/70 dark:text-amber-300/70">Unlock all features</p>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>
    </div>
  )
}

// Mobile sidebar using Sheet
export function MobileSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-4">
            <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-lg font-semibold">ClockAlign</span>
            </Link>
          </div>

          {/* New Meeting Button */}
          <div className="p-4">
            <Button className="w-full gap-2" asChild onClick={() => setOpen(false)}>
              <Link href="/meetings/new">
                <PlusCircle className="h-4 w-4" />
                New Meeting
              </Link>
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive 
                        ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    <Icon className={cn('h-[18px] w-[18px]', isActive && 'text-teal-500')} />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}
