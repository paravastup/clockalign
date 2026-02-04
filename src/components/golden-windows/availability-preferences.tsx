'use client'

/**
 * Availability Preferences Component
 * 
 * Allows users to set:
 * - Work hours (start/end)
 * - Chronotype (early bird / normal / night owl)
 * - Custom energy curve
 * - Specific unavailable hours
 */

import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  ChronoType,
  getChronotypeEnergyCurve,
  DEFAULT_ENERGY_CURVE,
  formatHour
} from '@/lib/golden-windows'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { Sun, Moon, Coffee, Clock, Zap, Save } from 'lucide-react'

// ============================================
// TYPES
// ============================================

export interface AvailabilityPreferences {
  chronotype: ChronoType
  workStartHour: number
  workEndHour: number
  customEnergyCurve?: Record<number, number>
  customUnavailableHours?: number[]
}

interface AvailabilityPreferencesFormProps {
  initialValues?: AvailabilityPreferences
  onSave: (preferences: AvailabilityPreferences) => void | Promise<void>
  isSaving?: boolean
  className?: string
}

// ============================================
// MAIN FORM COMPONENT
// ============================================

export function AvailabilityPreferencesForm({
  initialValues,
  onSave,
  isSaving = false,
  className
}: AvailabilityPreferencesFormProps) {
  const [chronotype, setChronotype] = useState<ChronoType>(
    initialValues?.chronotype || 'normal'
  )
  const [workStartHour, setWorkStartHour] = useState(
    initialValues?.workStartHour ?? 9
  )
  const [workEndHour, setWorkEndHour] = useState(
    initialValues?.workEndHour ?? 18
  )
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customCurve, setCustomCurve] = useState<Record<number, number>>(
    initialValues?.customEnergyCurve || {}
  )
  const [unavailableHours, setUnavailableHours] = useState<number[]>(
    initialValues?.customUnavailableHours || []
  )
  
  const handleSave = useCallback(() => {
    const preferences: AvailabilityPreferences = {
      chronotype,
      workStartHour,
      workEndHour,
      customEnergyCurve: Object.keys(customCurve).length > 0 ? customCurve : undefined,
      customUnavailableHours: unavailableHours.length > 0 ? unavailableHours : undefined
    }
    onSave(preferences)
  }, [chronotype, workStartHour, workEndHour, customCurve, unavailableHours, onSave])
  
  // Get current energy curve based on settings
  const currentEnergyCurve = Object.keys(customCurve).length > 0
    ? customCurve
    : getChronotypeEnergyCurve(chronotype)
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Energy & Availability
        </CardTitle>
        <CardDescription>
          Help us find when you're at your best
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chronotype Selection */}
        <ChronotypeSelector
          value={chronotype}
          onChange={setChronotype}
        />
        
        {/* Work Hours */}
        <WorkHoursSelector
          startHour={workStartHour}
          endHour={workEndHour}
          onStartChange={setWorkStartHour}
          onEndChange={setWorkEndHour}
        />
        
        {/* Energy Preview */}
        <EnergyCurvePreview
          curve={currentEnergyCurve}
          workStart={workStartHour}
          workEnd={workEndHour}
          unavailableHours={unavailableHours}
        />
        
        {/* Advanced Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="advanced-mode"
            checked={showAdvanced}
            onCheckedChange={setShowAdvanced}
          />
          <Label htmlFor="advanced-mode" className="text-sm cursor-pointer">
            Show advanced settings
          </Label>
        </div>
        
        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <UnavailableHoursSelector
              selectedHours={unavailableHours}
              onChange={setUnavailableHours}
            />
            
            <CustomEnergyCurveEditor
              curve={customCurve}
              baseCurve={getChronotypeEnergyCurve(chronotype)}
              onChange={setCustomCurve}
            />
          </div>
        )}
        
        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================
// CHRONOTYPE SELECTOR
// ============================================

interface ChronotypeSelectorProps {
  value: ChronoType
  onChange: (value: ChronoType) => void
}

function ChronotypeSelector({ value, onChange }: ChronotypeSelectorProps) {
  const chronotypes: Array<{
    value: ChronoType
    label: string
    description: string
    icon: React.ReactNode
  }> = [
    {
      value: 'early_bird',
      label: 'Early Bird',
      description: 'Peak energy 6-10 AM',
      icon: <Sun className="h-5 w-5 text-yellow-500" />
    },
    {
      value: 'normal',
      label: 'Normal',
      description: 'Peak energy 9 AM-6 PM',
      icon: <Coffee className="h-5 w-5 text-amber-600" />
    },
    {
      value: 'night_owl',
      label: 'Night Owl',
      description: 'Peak energy 12-8 PM',
      icon: <Moon className="h-5 w-5 text-teal-500" />
    }
  ]
  
  return (
    <div className="space-y-2">
      <Label>When are you most productive?</Label>
      <div className="grid grid-cols-3 gap-2">
        {chronotypes.map(ct => (
          <button
            key={ct.value}
            onClick={() => onChange(ct.value)}
            className={cn(
              'p-3 rounded-lg border text-left transition-all',
              value === ct.value
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              {ct.icon}
              <span className="font-medium text-sm">{ct.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {ct.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// WORK HOURS SELECTOR
// ============================================

interface WorkHoursSelectorProps {
  startHour: number
  endHour: number
  onStartChange: (hour: number) => void
  onEndChange: (hour: number) => void
}

function WorkHoursSelector({
  startHour,
  endHour,
  onStartChange,
  onEndChange
}: WorkHoursSelectorProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Work Hours
      </Label>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground mb-1">Start</Label>
          <Select
            value={startHour.toString()}
            onValueChange={(v) => onStartChange(parseInt(v, 10))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hours.filter(h => h < endHour).map(h => (
                <SelectItem key={h} value={h.toString()}>
                  {formatHour(h)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <span className="text-muted-foreground mt-6">to</span>
        
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground mb-1">End</Label>
          <Select
            value={endHour.toString()}
            onValueChange={(v) => onEndChange(parseInt(v, 10))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hours.filter(h => h > startHour).map(h => (
                <SelectItem key={h} value={h.toString()}>
                  {formatHour(h)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ENERGY CURVE PREVIEW
// ============================================

interface EnergyCurvePreviewProps {
  curve: Record<number, number>
  workStart: number
  workEnd: number
  unavailableHours: number[]
}

function EnergyCurvePreview({
  curve,
  workStart,
  workEnd,
  unavailableHours
}: EnergyCurvePreviewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  return (
    <TooltipProvider>
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">
          Your Energy Pattern
        </Label>
        <div className="flex h-20 items-end gap-0.5">
          {hours.map(hour => {
            const energy = curve[hour] ?? 0.5
            const isWorkHour = hour >= workStart && hour < workEnd
            const isUnavailable = unavailableHours.includes(hour)
            
            return (
              <Tooltip key={hour}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'flex-1 rounded-t transition-all',
                      isUnavailable
                        ? 'bg-gray-200'
                        : isWorkHour
                          ? energy >= 0.8
                            ? 'bg-green-400'
                            : energy >= 0.6
                              ? 'bg-green-300'
                              : energy >= 0.4
                                ? 'bg-yellow-300'
                                : 'bg-orange-300'
                          : 'bg-gray-300'
                    )}
                    style={{ height: `${energy * 100}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <div className="font-medium">{formatHour(hour)}</div>
                    {isUnavailable ? (
                      <div className="text-red-500">Unavailable</div>
                    ) : (
                      <div>Energy: {Math.round(energy * 100)}%</div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>12 AM</span>
        </div>
      </div>
    </TooltipProvider>
  )
}

// ============================================
// UNAVAILABLE HOURS SELECTOR
// ============================================

interface UnavailableHoursSelectorProps {
  selectedHours: number[]
  onChange: (hours: number[]) => void
}

function UnavailableHoursSelector({
  selectedHours,
  onChange
}: UnavailableHoursSelectorProps) {
  const toggleHour = (hour: number) => {
    if (selectedHours.includes(hour)) {
      onChange(selectedHours.filter(h => h !== hour))
    } else {
      onChange([...selectedHours, hour].sort((a, b) => a - b))
    }
  }
  
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  return (
    <div className="space-y-2">
      <Label className="text-sm">
        Mark hours as unavailable
      </Label>
      <div className="flex flex-wrap gap-1">
        {hours.map(hour => (
          <button
            key={hour}
            onClick={() => toggleHour(hour)}
            className={cn(
              'w-10 h-8 text-xs rounded border transition-all',
              selectedHours.includes(hour)
                ? 'bg-gray-300 border-gray-400 text-gray-600 dark:bg-zinc-600 dark:border-zinc-500 dark:text-zinc-300'
                : 'bg-white border-gray-200 hover:border-gray-300 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:border-zinc-500 dark:text-zinc-200'
            )}
          >
            {hour}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Click to toggle unavailable hours (grayed out = unavailable)
      </p>
    </div>
  )
}

// ============================================
// CUSTOM ENERGY CURVE EDITOR
// ============================================

interface CustomEnergyCurveEditorProps {
  curve: Record<number, number>
  baseCurve: Record<number, number>
  onChange: (curve: Record<number, number>) => void
}

function CustomEnergyCurveEditor({
  curve,
  baseCurve,
  onChange
}: CustomEnergyCurveEditorProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  
  const handleSliderChange = (hour: number, value: number[]) => {
    onChange({
      ...curve,
      [hour]: value[0] / 100
    })
  }
  
  const resetToBase = () => {
    onChange({})
  }
  
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">
          Custom Energy Levels
        </Label>
        <Button variant="ghost" size="sm" onClick={resetToBase}>
          Reset to default
        </Button>
      </div>
      
      <div className="grid grid-cols-6 gap-2">
        {hours.map(hour => {
          const customValue = curve[hour]
          const baseValue = baseCurve[hour] ?? 0.5
          const value = customValue ?? baseValue
          const isCustom = customValue !== undefined
          
          return (
            <button
              key={hour}
              onClick={() => setSelectedHour(hour === selectedHour ? null : hour)}
              className={cn(
                'p-2 rounded border text-xs transition-all',
                selectedHour === hour
                  ? 'border-green-500 bg-green-50'
                  : isCustom
                    ? 'border-yellow-300 bg-yellow-50'
                    : 'border-gray-200'
              )}
            >
              <div className="font-medium">{formatHour(hour).replace(' ', '')}</div>
              <div className={cn(
                isCustom ? 'text-yellow-700' : 'text-muted-foreground'
              )}>
                {Math.round(value * 100)}%
              </div>
            </button>
          )
        })}
      </div>
      
      {selectedHour !== null && (
        <div className="p-3 border rounded-lg bg-white dark:bg-zinc-800 dark:border-zinc-700">
          <Label className="text-sm mb-2 block">
            Energy at {formatHour(selectedHour)}
          </Label>
          <Slider
            value={[(curve[selectedHour] ?? baseCurve[selectedHour] ?? 0.5) * 100]}
            onValueChange={(v) => handleSliderChange(selectedHour, v)}
            min={10}
            max={100}
            step={5}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Low energy</span>
            <span>High energy</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default AvailabilityPreferencesForm
