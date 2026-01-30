'use client'

/**
 * Sacrifice Score Leaderboard Component
 * CA-026: Shows team sacrifice scores with rankings
 */

import { useState, useEffect } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  getRankMedal,
  getFairnessStatusBadge,
  formatPoints,
  getCategoryColor,
  type LeaderboardEntry,
} from '@/lib/sacrifice-score'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle,
  Trophy,
  Moon,
  Sun,
  Coffee,
} from 'lucide-react'

interface LeaderboardProps {
  teamId: string
  onMemberClick?: (userId: string) => void
}

interface LeaderboardData {
  team: { id: string; name: string }
  period: { days: number; startDate: string }
  stats: {
    totalPoints: number
    averagePerMember: number
    memberCount: number
    meetingCount: number
  }
  leaderboard: LeaderboardEntry[]
  fairnessAlerts: Array<{
    userId: string
    userName: string
    status: string
    multiplierVsAverage: number
  }>
}

export function SacrificeLeaderboard({ teamId, onMemberClick }: LeaderboardProps) {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState('30')
  
  useEffect(() => {
    fetchLeaderboard()
  }, [teamId, days])
  
  const fetchLeaderboard = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `/api/sacrifice-score?type=team&teamId=${teamId}&days=${days}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
  
  const getTrendIcon = (trend: string, percent: number) => {
    if (trend === 'up') {
      return (
        <span className="flex items-center text-red-500 text-sm">
          <TrendingUp className="h-3 w-3 mr-0.5" />
          +{percent}%
        </span>
      )
    }
    if (trend === 'down') {
      return (
        <span className="flex items-center text-green-500 text-sm">
          <TrendingDown className="h-3 w-3 mr-0.5" />
          {percent}%
        </span>
      )
    }
    return (
      <span className="flex items-center text-gray-400 text-sm">
        <Minus className="h-3 w-3 mr-0.5" />
        stable
      </span>
    )
  }
  
  const getInitials = (name: string | null, email: string): string => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }
  
  if (loading) {
    return <LeaderboardSkeleton />
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={fetchLeaderboard} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  if (!data || data.leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Sacrifice Data Yet</h3>
          <p className="text-muted-foreground">
            Schedule some meetings to start tracking sacrifice scores!
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{data.team.name}</h2>
          <p className="text-muted-foreground">
            Team Sacrifice Leaderboard
          </p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Fairness Alerts */}
      {data.fairnessAlerts.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Fairness Alert
                </h3>
                {data.fairnessAlerts.map((alert, i) => (
                  <p key={i} className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>{alert.userName}</strong> has{' '}
                    {alert.multiplierVsAverage}x the team average sacrifice.
                    Consider rotating meeting times.
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Points</p>
            <p className="text-2xl font-bold">{formatPoints(data.stats.totalPoints)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Avg per Member</p>
            <p className="text-2xl font-bold">{formatPoints(data.stats.averagePerMember)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Members</p>
            <p className="text-2xl font-bold">{data.stats.memberCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Meetings</p>
            <p className="text-2xl font-bold">{data.stats.meetingCount}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Sacrifice Rankings
          </CardTitle>
          <CardDescription>
            Who&apos;s sacrificing the most for the team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.leaderboard.map((entry) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-muted/50 cursor-pointer ${
                  entry.fairnessStatus === 'critical' 
                    ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800' 
                    : entry.fairnessStatus === 'high_sacrifice'
                      ? 'bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800'
                      : ''
                }`}
                onClick={() => onMemberClick?.(entry.userId)}
              >
                {/* Rank */}
                <div className="w-10 text-center">
                  <span className="text-2xl">{getRankMedal(entry.rank)}</span>
                </div>
                
                {/* Avatar & Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(entry.userName, entry.userEmail)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {entry.userName || entry.userEmail}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {entry.timezone}
                    </p>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-4 text-right">
                  {/* Bad slot indicators */}
                  <TooltipProvider>
                    <div className="flex items-center gap-2">
                      {entry.worstSlotCount.graveyard > 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="destructive" className="h-6">
                              <Moon className="h-3 w-3 mr-1" />
                              {entry.worstSlotCount.graveyard}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {entry.worstSlotCount.graveyard} graveyard shifts (11PM-7AM)
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {(entry.worstSlotCount.lateNight + entry.worstSlotCount.night) > 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="secondary" className="h-6 bg-orange-100 text-orange-700">
                              <Coffee className="h-3 w-3 mr-1" />
                              {entry.worstSlotCount.lateNight + entry.worstSlotCount.night}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {entry.worstSlotCount.lateNight + entry.worstSlotCount.night} late night meetings
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {entry.worstSlotCount.earlyMorning > 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="secondary" className="h-6 bg-yellow-100 text-yellow-700">
                              <Sun className="h-3 w-3 mr-1" />
                              {entry.worstSlotCount.earlyMorning}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {entry.worstSlotCount.earlyMorning} early morning meetings (7-8AM)
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                  
                  {/* Points */}
                  <div className="w-20 text-right">
                    <p className="text-xl font-bold">{formatPoints(entry.totalPoints)}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.meetingCount} meetings
                    </p>
                  </div>
                  
                  {/* Trend */}
                  <div className="w-16">
                    {getTrendIcon(entry.trend, entry.trendPercent)}
                  </div>
                  
                  {/* Fairness badge */}
                  <div className="w-24">
                    {entry.fairnessStatus !== 'balanced' && (
                      <Badge variant={getFairnessStatusBadge(entry.fairnessStatus).variant}>
                        {getFairnessStatusBadge(entry.fairnessStatus).label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
