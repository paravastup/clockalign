'use client'

/**
 * Score History Chart Component
 * CA-027: Shows user's sacrifice score history over time
 */

import { useState, useEffect, useMemo } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type ScoreHistoryEntry, getCategoryColor } from '@/lib/sacrifice-score'
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Calendar,
} from 'lucide-react'

interface ScoreHistoryChartProps {
  userId?: string // If not provided, shows current user's history
  teamId?: string // Optional team context for comparison
  onPeriodChange?: (days: number) => void
}

interface HistoryData {
  userId: string
  period: { days: number; startDate: string }
  history: ScoreHistoryEntry[]
  cumulative: Array<{ date: string; cumulative: number }>
}

export function ScoreHistoryChart({ 
  userId, 
  teamId,
  onPeriodChange,
}: ScoreHistoryChartProps) {
  const [data, setData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState('30')
  const [chartType, setChartType] = useState<'daily' | 'cumulative'>('daily')
  
  useEffect(() => {
    fetchHistory()
    onPeriodChange?.(parseInt(days))
  }, [userId, days])
  
  const fetchHistory = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        type: 'history',
        days,
      })
      if (userId) params.set('userId', userId)
      
      const response = await fetch(`/api/sacrifice-score?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch history')
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (!data?.history) return null
    
    const nonZeroDays = data.history.filter(d => d.points > 0)
    const totalPoints = data.history.reduce((sum, d) => sum + d.points, 0)
    const totalMeetings = data.history.reduce((sum, d) => sum + d.meetingCount, 0)
    const maxDay = data.history.reduce(
      (max, d) => d.points > max.points ? d : max,
      { date: '', points: 0, meetingCount: 0, categories: {} }
    )
    
    // Calculate trend (compare last 7 days vs previous 7 days)
    const last7 = data.history.slice(-7).reduce((sum, d) => sum + d.points, 0)
    const prev7 = data.history.slice(-14, -7).reduce((sum, d) => sum + d.points, 0)
    const trend = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : 0
    
    return {
      totalPoints,
      totalMeetings,
      avgPerDay: nonZeroDays.length > 0 ? totalPoints / nonZeroDays.length : 0,
      maxDay,
      trend,
      activeDays: nonZeroDays.length,
    }
  }, [data])
  
  // Get max value for chart scaling
  const maxValue = useMemo(() => {
    if (!data?.history) return 0
    if (chartType === 'cumulative' && data.cumulative) {
      return Math.max(...data.cumulative.map(d => d.cumulative))
    }
    return Math.max(...data.history.map(d => d.points))
  }, [data, chartType])
  
  const handleDaysChange = (value: string) => {
    setDays(value)
  }
  
  if (loading) {
    return <HistoryChartSkeleton />
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={fetchHistory} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  if (!data || data.history.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
          <p className="text-muted-foreground">
            Your sacrifice score history will appear here as you attend meetings.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Score History</h3>
          <p className="text-sm text-muted-foreground">
            Your sacrifice over time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={chartType} onValueChange={(v: 'daily' | 'cumulative') => setChartType(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="cumulative">Cumulative</SelectItem>
            </SelectContent>
          </Select>
          <Select value={days} onValueChange={handleDaysChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Total Points</p>
              <p className="text-xl font-bold">
                {stats.totalPoints.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Meetings</p>
              <p className="text-xl font-bold">{stats.totalMeetings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Avg/Active Day</p>
              <p className="text-xl font-bold">
                {stats.avgPerDay.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">7-Day Trend</p>
              <p className={`text-xl font-bold flex items-center ${
                stats.trend > 10 ? 'text-red-500' : 
                stats.trend < -10 ? 'text-green-500' : ''
              }`}>
                {stats.trend > 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : stats.trend < 0 ? (
                  <TrendingDown className="h-4 w-4 mr-1" />
                ) : null}
                {stats.trend > 0 ? '+' : ''}{stats.trend.toFixed(0)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Chart */}
      <Card>
        <CardContent className="pt-4">
          <div className="h-[200px] flex items-end gap-1">
            {chartType === 'daily' ? (
              // Daily bar chart
              data.history.map((day, i) => {
                const height = maxValue > 0 ? (day.points / maxValue) * 100 : 0
                const isToday = i === data.history.length - 1
                
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center justify-end group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                      <div className="bg-popover text-popover-foreground border rounded-md shadow-md p-2 text-xs whitespace-nowrap">
                        <p className="font-semibold">{formatDate(day.date)}</p>
                        <p>{day.points.toFixed(1)} points</p>
                        <p>{day.meetingCount} meeting(s)</p>
                      </div>
                    </div>
                    
                    {/* Bar */}
                    <div
                      className={`w-full rounded-t transition-all ${
                        isToday 
                          ? 'bg-primary' 
                          : day.points === 0 
                            ? 'bg-muted' 
                            : day.points > stats!.avgPerDay * 2
                              ? 'bg-red-400'
                              : day.points > stats!.avgPerDay
                                ? 'bg-orange-400'
                                : 'bg-primary/60'
                      }`}
                      style={{ 
                        height: `${Math.max(height, day.points > 0 ? 4 : 1)}%`,
                        minHeight: day.points > 0 ? '4px' : '1px',
                      }}
                    />
                  </div>
                )
              })
            ) : (
              // Cumulative line chart (rendered as area)
              <svg className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Area fill */}
                <path
                  d={`
                    M 0 ${200}
                    ${data.cumulative.map((d, i) => {
                      const x = (i / (data.cumulative.length - 1)) * 100
                      const y = maxValue > 0 ? 200 - (d.cumulative / maxValue) * 200 : 200
                      return `L ${x}% ${y}`
                    }).join(' ')}
                    L 100% ${200}
                    Z
                  `}
                  fill="url(#areaGradient)"
                />
                
                {/* Line */}
                <path
                  d={`
                    M 0 ${maxValue > 0 ? 200 - (data.cumulative[0]?.cumulative || 0) / maxValue * 200 : 200}
                    ${data.cumulative.map((d, i) => {
                      const x = (i / (data.cumulative.length - 1)) * 100
                      const y = maxValue > 0 ? 200 - (d.cumulative / maxValue) * 200 : 200
                      return `L ${x}% ${y}`
                    }).join(' ')}
                  `}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                />
                
                {/* End point */}
                {data.cumulative.length > 0 && (
                  <circle
                    cx="100%"
                    cy={maxValue > 0 
                      ? 200 - (data.cumulative[data.cumulative.length - 1].cumulative / maxValue) * 200 
                      : 200}
                    r="4"
                    fill="hsl(var(--primary))"
                  />
                )}
              </svg>
            )}
          </div>
          
          {/* X-axis labels */}
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{formatDate(data.history[0]?.date || '')}</span>
            {parseInt(days) > 14 && (
              <span>{formatDate(data.history[Math.floor(data.history.length / 2)]?.date || '')}</span>
            )}
            <span>{formatDate(data.history[data.history.length - 1]?.date || '')}</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Worst day highlight */}
      {stats && stats.maxDay.points > 0 && (
        <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Toughest Day: {formatDate(stats.maxDay.date)}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  {stats.maxDay.points.toFixed(1)} points from{' '}
                  {stats.maxDay.meetingCount} meeting(s)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function HistoryChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardContent className="pt-4">
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
