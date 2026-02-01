'use client'

/**
 * Hours Reclaimed Tracker Component
 * CA-042: Displays async time savings with breakdown by type
 */

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  type ReclaimedStats,
  type AsyncType,
  formatHoursReclaimed,
  getAsyncTypeIcon,
} from '@/lib/async-nudge'
import {
  Timer,
  TrendingUp,
  TrendingDown,
  Minus,
  Video,
  FileText,
  BarChart3,
  Mail,
  MessageSquare,
  Zap,
  Sparkles,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface HoursReclaimedProps {
  stats?: ReclaimedStats
  loading?: boolean
  teamId?: string
  userId?: string
}

const typeIcons: Record<AsyncType, React.ReactNode> = {
  loom: <Video className="h-4 w-4" />,
  doc: <FileText className="h-4 w-4" />,
  poll: <BarChart3 className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  slack: <MessageSquare className="h-4 w-4" />,
  other: <Zap className="h-4 w-4" />,
}

const typeLabels: Record<AsyncType, string> = {
  loom: 'Loom Videos',
  doc: 'Documents',
  poll: 'Polls',
  email: 'Emails',
  slack: 'Slack/Chat',
  other: 'Other',
}

const typeColors: Record<AsyncType, string> = {
  loom: 'bg-purple-500',
  doc: 'bg-blue-500',
  poll: 'bg-green-500',
  email: 'bg-amber-500',
  slack: 'bg-pink-500',
  other: 'bg-gray-500',
}

export function HoursReclaimedCard({
  stats,
  loading,
  teamId,
  userId,
}: HoursReclaimedProps) {
  const [period, setPeriod] = useState('30')
  const [data, setData] = useState<ReclaimedStats | null>(stats || null)
  const [isLoading, setIsLoading] = useState(loading || false)
  
  useEffect(() => {
    if (stats) {
      setData(stats)
      return
    }
    
    if (teamId || userId) {
      fetchStats()
    }
  }, [teamId, userId, period, stats])
  
  const fetchStats = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ days: period })
      if (teamId) params.set('teamId', teamId)
      if (userId) params.set('userId', userId)
      
      const response = await fetch(`/api/async-nudge/stats?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch reclaimed stats:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (isLoading) {
    return <HoursReclaimedSkeleton />
  }
  
  // Show empty state with motivation
  if (!data || data.totalHoursReclaimed === 0) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100">
              <Timer className="h-5 w-5 text-emerald-600" />
            </div>
            Hours Reclaimed
          </CardTitle>
          <CardDescription>
            Time saved by going async instead of scheduling meetings
          </CardDescription>
        </CardHeader>
        <CardContent className="relative text-center py-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Start Reclaiming Time</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            When you choose async over meetings, we&apos;ll track the hours you save.
            Every async decision counts!
          </p>
        </CardContent>
      </Card>
    )
  }
  
  // Calculate breakdown for visualization
  const totalTyped = Object.values(data.byType).reduce((sum, t) => sum + t.hours, 0)
  const typeBreakdown = Object.entries(data.byType)
    .filter(([_, val]) => val.hours > 0)
    .map(([type, val]) => ({
      type: type as AsyncType,
      ...val,
      percent: totalTyped > 0 ? (val.hours / totalTyped) * 100 : 0,
    }))
    .sort((a, b) => b.hours - a.hours)
  
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <Timer className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle>Hours Reclaimed</CardTitle>
              <CardDescription>
                Time saved by choosing async
              </CardDescription>
            </div>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-6">
        {/* Main stat */}
        <div className="text-center">
          <div className="text-5xl font-bold text-emerald-600 tracking-tight">
            {formatHoursReclaimed(data.totalHoursReclaimed)}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{data.meetingsConverted} meetings → async</span>
            {data.trend !== 'stable' && (
              <span className={cn(
                'flex items-center ml-2',
                data.trend === 'up' ? 'text-emerald-600' : 'text-red-500'
              )}>
                {data.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {data.trendPercent}%
              </span>
            )}
          </div>
        </div>
        
        {/* Breakdown bar */}
        {typeBreakdown.length > 0 && (
          <div>
            <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
              {typeBreakdown.map(({ type, percent }) => (
                <TooltipProvider key={type}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'h-full transition-all',
                          typeColors[type]
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {typeLabels[type]}: {Math.round(percent)}%
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3">
              {typeBreakdown.map(({ type, count, hours }) => (
                <div 
                  key={type}
                  className="flex items-center gap-1.5 text-sm"
                >
                  <span className={cn(
                    'w-3 h-3 rounded-full',
                    typeColors[type]
                  )} />
                  <span className="text-muted-foreground">
                    {typeLabels[type]}
                  </span>
                  <span className="font-medium">
                    {formatHoursReclaimed(hours)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-semibold">
              {data.meetingsConverted}
            </div>
            <div className="text-xs text-muted-foreground">
              Meetings converted
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold">
              {formatHoursReclaimed(data.averageHoursPerMeeting)}
            </div>
            <div className="text-xs text-muted-foreground">
              Avg saved per meeting
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Compact inline version for dashboard
 */
export function HoursReclaimedBadge({
  hours,
  showIcon = true,
}: {
  hours: number
  showIcon?: boolean
}) {
  return (
    <Badge 
      variant="secondary" 
      className="bg-emerald-50 text-emerald-700 border-emerald-200"
    >
      {showIcon && <Timer className="h-3 w-3 mr-1" />}
      {formatHoursReclaimed(hours)} reclaimed
    </Badge>
  )
}

/**
 * Mini stat for sidebar or header
 */
export function HoursReclaimedMini({ hours }: { hours: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="p-1.5 rounded-lg bg-emerald-50">
        <Timer className="h-4 w-4 text-emerald-600" />
      </div>
      <div>
        <div className="font-semibold text-emerald-700">
          {formatHoursReclaimed(hours)}
        </div>
        <div className="text-xs text-muted-foreground">reclaimed</div>
      </div>
    </div>
  )
}

function HoursReclaimedSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48 mt-1" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Skeleton className="h-12 w-24 mx-auto" />
          <Skeleton className="h-4 w-40 mx-auto mt-2" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <Skeleton className="h-8 w-12 mx-auto" />
            <Skeleton className="h-3 w-20 mx-auto mt-1" />
          </div>
          <div className="text-center">
            <Skeleton className="h-8 w-12 mx-auto" />
            <Skeleton className="h-3 w-20 mx-auto mt-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
