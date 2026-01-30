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
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: Home },
  { title: 'Meetings', href: '/meetings', icon: Calendar },
  { title: 'Teams', href: '/teams', icon: Users },
  { title: 'Fairness', href: '/fairness', icon: BarChart3 },
  { title: 'Settings', href: '/settings', icon: Settings },
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

  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
        isActive 
          ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400' 
          : 'text-muted-foreground hover:text-foreground hover:bg-accent',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-teal-500')} />
      {!collapsed && <span>{item.title}</span>}
      {!collapsed && item.badge && (
        <span className="ml-auto rounded-full bg-teal-500 px-2 py-0.5 text-xs text-white">
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
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/30">
                <Clock className="h-4 w-4" />
              </div>
              {!collapsed && (
                <span className="text-lg font-semibold tracking-tight">ClockAlign</span>
              )}
            </Link>
            {!collapsed && onCollapsedChange && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onCollapsedChange(true)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* New Meeting Button */}
          <div className={cn('p-4', collapsed && 'px-3')}>
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button size="icon" className="w-full btn-primary-gradient rounded-lg">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">New Meeting</TooltipContent>
              </Tooltip>
            ) : (
              <Button className="w-full gap-2 btn-primary-gradient rounded-lg h-10" asChild>
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

          {/* Collapse Toggle (when collapsed) */}
          {collapsed && onCollapsedChange && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="icon"
                className="w-full"
                onClick={() => onCollapsedChange(false)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
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
