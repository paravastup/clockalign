'use client'

/**
 * Golden Windows Heatmap Component
 * 
 * A 24-hour x N-participants grid visualization showing:
 * - Individual participant energy levels at each hour
 * - Combined "golden score" for team overlap
 * - Visual indicators for best meeting times
 */

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  HeatmapData,
  HeatmapRow,
  HeatmapCell,
  getHeatmapCellColor,
  getCombinedScoreColor,
  formatHour,
  getSharpnessEmoji
} from '@/lib/golden-windows'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ============================================
// TYPES
// ============================================

interface HeatmapProps {
  data: HeatmapData
  /** Highlight these UTC hours as recommended */
  highlightedHours?: number[]
  /** Show the combined score row at bottom */
  showCombinedRow?: boolean
  /** Compact mode for smaller screens */
  compact?: boolean
  /** Callback when a cell is clicked */
  onCellClick?: (hour: number, participantId: string) => void
  /** Callback when combined score cell is clicked */
  onHourClick?: (hour: number) => void
  className?: string
}

// ============================================
// HEATMAP COMPONENT
// ============================================

export function GoldenWindowsHeatmap({
  data,
  highlightedHours = [],
  showCombinedRow = true,
  compact = false,
  onCellClick,
  onHourClick,
  className
}: HeatmapProps) {
  // Memoize hour labels (every 3 hours in compact mode)
  const hourLabels = useMemo(() => {
    if (compact) {
      return data.hours.filter(h => h % 3 === 0)
    }
    return data.hours
  }, [data.hours, compact])
  
  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn('overflow-x-auto', className)}>
        <div className="min-w-[640px]">
          {/* Header row with UTC hours */}
          <div className="flex">
            {/* Participant column header */}
            <div className={cn(
              'flex-shrink-0 text-xs font-medium text-muted-foreground',
              compact ? 'w-24' : 'w-40'
            )}>
              Participant
            </div>
            
            {/* Hour labels */}
            <div className="flex-1 flex">
              {data.hours.map(hour => (
                <div
                  key={hour}
                  className={cn(
                    'flex-1 text-center text-xs font-medium',
                    highlightedHours.includes(hour) 
                      ? 'text-green-600 font-bold' 
                      : 'text-muted-foreground',
                    compact && !hourLabels.includes(hour) && 'invisible'
                  )}
                >
                  {formatHour(hour).replace(' AM', 'a').replace(' PM', 'p')}
                </div>
              ))}
            </div>
          </div>
          
          {/* Participant rows */}
          {data.rows.map(row => (
            <HeatmapRowComponent
              key={row.participantId}
              row={row}
              highlightedHours={highlightedHours}
              compact={compact}
              onCellClick={onCellClick}
            />
          ))}
          
          {/* Combined score row */}
          {showCombinedRow && (
            <CombinedScoreRow
              combinedScores={data.combinedScores}
              highlightedHours={highlightedHours}
              compact={compact}
              onHourClick={onHourClick}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

// ============================================
// HEATMAP ROW COMPONENT
// ============================================

interface HeatmapRowComponentProps {
  row: HeatmapRow
  highlightedHours: number[]
  compact: boolean
  onCellClick?: (hour: number, participantId: string) => void
}

function HeatmapRowComponent({
  row,
  highlightedHours,
  compact,
  onCellClick
}: HeatmapRowComponentProps) {
  return (
    <div className="flex items-center group">
      {/* Participant info */}
      <div className={cn(
        'flex-shrink-0 py-1 truncate',
        compact ? 'w-24' : 'w-40'
      )}>
        <div className="text-sm font-medium truncate">
          {row.participantName}
        </div>
        <div className="text-xs text-muted-foreground">
          {row.utcOffset}
        </div>
      </div>
      
      {/* Cells */}
      <div className="flex-1 flex">
        {row.cells.map(cell => (
          <HeatmapCellComponent
            key={cell.hour}
            cell={cell}
            isHighlighted={highlightedHours.includes(cell.hour)}
            compact={compact}
            onClick={() => onCellClick?.(cell.hour, cell.participantId)}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================
// HEATMAP CELL COMPONENT
// ============================================

interface HeatmapCellComponentProps {
  cell: HeatmapCell
  isHighlighted: boolean
  compact: boolean
  onClick?: () => void
}

function HeatmapCellComponent({
  cell,
  isHighlighted,
  compact,
  onClick
}: HeatmapCellComponentProps) {
  const colors = getHeatmapCellColor(cell.intensity, cell.isAvailable)
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            'flex-1 transition-all',
            compact ? 'h-6 min-w-[12px]' : 'h-8 min-w-[20px]',
            colors.bg,
            'border border-white/50',
            isHighlighted && 'ring-2 ring-green-500 ring-offset-1',
            onClick && 'cursor-pointer hover:opacity-80'
          )}
        >
          {!compact && cell.intensity >= 70 && (
            <span className={cn('text-xs', colors.text)}>
              {Math.round(cell.intensity)}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <div className="font-medium">
          {formatHour(cell.localHour)} local time
        </div>
        <div className="text-muted-foreground">
          {cell.isAvailable ? (
            <>Sharpness: {cell.intensity}% {getSharpnessEmoji(cell.sharpness)}</>
          ) : (
            <>Unavailable 💤</>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

// ============================================
// COMBINED SCORE ROW
// ============================================

interface CombinedScoreRowProps {
  combinedScores: Array<{
    hour: number
    goldenScore: number
    allAvailable: boolean
  }>
  highlightedHours: number[]
  compact: boolean
  onHourClick?: (hour: number) => void
}

function CombinedScoreRow({
  combinedScores,
  highlightedHours,
  compact,
  onHourClick
}: CombinedScoreRowProps) {
  return (
    <div className="flex items-center border-t-2 border-gray-200 mt-1 pt-1">
      {/* Label */}
      <div className={cn(
        'flex-shrink-0 py-1',
        compact ? 'w-24' : 'w-40'
      )}>
        <div className="text-sm font-semibold text-green-700">
          Golden Score
        </div>
        <div className="text-xs text-muted-foreground">
          Team average
        </div>
      </div>
      
      {/* Combined cells */}
      <div className="flex-1 flex">
        {combinedScores.map(score => {
          const colors = getCombinedScoreColor(score.goldenScore, score.allAvailable)
          const isHighlighted = highlightedHours.includes(score.hour)
          
          return (
            <Tooltip key={score.hour}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onHourClick?.(score.hour)}
                  className={cn(
                    'flex-1 flex items-center justify-center transition-all font-medium',
                    compact ? 'h-6 min-w-[12px] text-[10px]' : 'h-8 min-w-[20px] text-xs',
                    colors.bg,
                    colors.text,
                    'border',
                    colors.border,
                    isHighlighted && 'ring-2 ring-green-500 ring-offset-1',
                    onHourClick && 'cursor-pointer hover:opacity-80',
                    !score.allAvailable && 'opacity-50'
                  )}
                >
                  {score.allAvailable ? score.goldenScore : '—'}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <div className="font-medium">
                  {formatHour(score.hour)} UTC
                </div>
                {score.allAvailable ? (
                  <div className="text-muted-foreground">
                    Team sharpness: {score.goldenScore}%
                    {score.goldenScore >= 80 && ' ✨'}
                  </div>
                ) : (
                  <div className="text-red-500">
                    Not all participants available
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// HEATMAP LEGEND
// ============================================

export function HeatmapLegend({ className }: { className?: string }) {
  const levels = [
    { intensity: 95, label: '90%+', description: 'Peak energy' },
    { intensity: 80, label: '70-90%', description: 'High energy' },
    { intensity: 60, label: '50-70%', description: 'Moderate' },
    { intensity: 40, label: '30-50%', description: 'Low energy' },
    { intensity: 20, label: '<30%', description: 'Very low' },
    { intensity: 0, label: 'Unavail.', description: 'Not available', isUnavailable: true }
  ]
  
  return (
    <div className={cn('flex flex-wrap gap-4', className)}>
      <div className="text-sm font-medium text-muted-foreground">
        Energy Level:
      </div>
      <div className="flex flex-wrap gap-2">
        {levels.map(level => {
          const colors = getHeatmapCellColor(level.intensity, !level.isUnavailable)
          return (
            <div key={level.label} className="flex items-center gap-1.5">
              <div className={cn(
                'w-4 h-4 rounded-sm border border-gray-200',
                colors.bg
              )} />
              <span className="text-xs text-muted-foreground">
                {level.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// COMPACT LEGEND (for mobile)
// ============================================

export function HeatmapLegendCompact({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <span className="text-muted-foreground">Energy:</span>
      <div className="flex items-center gap-0.5">
        <div className="w-3 h-3 bg-red-200 rounded-sm" />
        <span className="text-muted-foreground">Low</span>
      </div>
      <div className="flex h-2 w-16 rounded-sm overflow-hidden">
        <div className="flex-1 bg-red-200" />
        <div className="flex-1 bg-orange-200" />
        <div className="flex-1 bg-yellow-200" />
        <div className="flex-1 bg-green-200" />
        <div className="flex-1 bg-green-400" />
        <div className="flex-1 bg-green-500" />
      </div>
      <div className="flex items-center gap-0.5">
        <div className="w-3 h-3 bg-green-500 rounded-sm" />
        <span className="text-muted-foreground">High</span>
      </div>
    </div>
  )
}

export default GoldenWindowsHeatmap
