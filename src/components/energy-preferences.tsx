'use client'

import * as React from 'react'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Sun, Moon, Sunrise, Zap, Battery } from 'lucide-react'

interface EnergyProfile {
  workStart: number // 0-23
  workEnd: number // 0-23
  goldenStart: number // 0-23
  goldenEnd: number // 0-23
  energyType: 'early_bird' | 'night_owl' | 'balanced'
}

interface EnergyPreferencesProps {
  value?: EnergyProfile
  onChange?: (profile: EnergyProfile) => void
  disabled?: boolean
}

const DEFAULT_PROFILE: EnergyProfile = {
  workStart: 9,
  workEnd: 18,
  goldenStart: 10,
  goldenEnd: 12,
  energyType: 'balanced',
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:00 ${period}`
}

// Helper function for future use
// function getEnergyIcon(hour: number, isGolden: boolean) {
//   if (isGolden) return <Zap className="h-3 w-3 text-amber-500" />
//   if (hour < 6) return <Moon className="h-3 w-3 text-teal-500" />
//   if (hour < 9) return <Sunrise className="h-3 w-3 text-orange-500" />
//   if (hour < 17) return <Sun className="h-3 w-3 text-yellow-500" />
//   if (hour < 20) return <Sunset className="h-3 w-3 text-orange-500" />
//   return <Moon className="h-3 w-3 text-teal-500" />
// }

export function EnergyPreferences({
  value = DEFAULT_PROFILE,
  onChange,
  disabled = false,
}: EnergyPreferencesProps) {
  const profile = { ...DEFAULT_PROFILE, ...value }

  const updateProfile = (updates: Partial<EnergyProfile>) => {
    onChange?.({ ...profile, ...updates })
  }

  // Generate hour labels for the preview
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="space-y-6">
      {/* Energy Type Selection */}
      <div className="space-y-3">
        <Label>What type of person are you?</Label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { type: 'early_bird' as const, label: 'Early Bird', icon: Sunrise, desc: 'Sharp in the morning' },
            { type: 'balanced' as const, label: 'Balanced', icon: Sun, desc: 'Steady throughout' },
            { type: 'night_owl' as const, label: 'Night Owl', icon: Moon, desc: 'Peak in afternoon' },
          ].map(({ type, label, icon: Icon, desc }) => (
            <button
              key={type}
              type="button"
              onClick={() => !disabled && updateProfile({ 
                energyType: type,
                // Auto-adjust golden hours based on type
                goldenStart: type === 'early_bird' ? 8 : type === 'night_owl' ? 14 : 10,
                goldenEnd: type === 'early_bird' ? 11 : type === 'night_owl' ? 17 : 12,
              })}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                profile.energyType === type
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted/50 hover:border-muted-foreground/20',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Icon className={cn(
                'h-6 w-6',
                profile.energyType === type ? 'text-primary' : 'text-muted-foreground'
              )} />
              <span className={cn(
                'font-medium text-sm',
                profile.energyType === type && 'text-primary'
              )}>{label}</span>
              <span className="text-xs text-muted-foreground text-center">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Work Hours Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Work Hours</Label>
          <span className="text-sm text-muted-foreground">
            {formatHour(profile.workStart)} – {formatHour(profile.workEnd)}
          </span>
        </div>
        <div className="space-y-2">
          <Slider
            value={[profile.workStart, profile.workEnd]}
            onValueChange={([start, end]) => {
              if (!disabled) {
                updateProfile({ 
                  workStart: start, 
                  workEnd: end,
                  // Ensure golden hours stay within work hours
                  goldenStart: Math.max(start, Math.min(profile.goldenStart, end - 1)),
                  goldenEnd: Math.min(end, Math.max(profile.goldenEnd, start + 1)),
                })
              }
            }}
            min={0}
            max={24}
            step={1}
            disabled={disabled}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>12 AM</span>
          </div>
        </div>
      </div>

      {/* Golden Hours Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label>Golden Hours</Label>
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              Peak Focus
            </Badge>
          </div>
          <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
            {formatHour(profile.goldenStart)} – {formatHour(profile.goldenEnd)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          When are you at your sharpest? ClockAlign will prioritize meeting times during your golden hours.
        </p>
        <div className="space-y-2">
          <Slider
            value={[profile.goldenStart, profile.goldenEnd]}
            onValueChange={([start, end]) => {
              if (!disabled) {
                updateProfile({ 
                  goldenStart: Math.max(profile.workStart, start),
                  goldenEnd: Math.min(profile.workEnd, end),
                })
              }
            }}
            min={profile.workStart}
            max={profile.workEnd}
            step={1}
            disabled={disabled}
            className="py-4"
          />
        </div>
      </div>

      {/* Visual Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Your Day Preview</CardTitle>
          <CardDescription>How ClockAlign sees your typical day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-0.5">
            {hours.map((hour) => {
              const isWork = hour >= profile.workStart && hour < profile.workEnd
              const isGolden = hour >= profile.goldenStart && hour < profile.goldenEnd
              
              return (
                <div
                  key={hour}
                  className={cn(
                    'flex-1 h-8 rounded-sm transition-colors flex items-center justify-center',
                    isGolden
                      ? 'bg-amber-400 dark:bg-amber-500'
                      : isWork
                        ? 'bg-green-300 dark:bg-green-600'
                        : 'bg-slate-200 dark:bg-slate-700'
                  )}
                  title={`${formatHour(hour)}${isGolden ? ' - Golden Hour' : isWork ? ' - Work Hour' : ' - Off'}`}
                >
                  {hour % 6 === 0 && (
                    <span className="text-[10px] font-medium text-foreground/60">
                      {hour === 0 ? '12a' : hour === 6 ? '6a' : hour === 12 ? '12p' : '6p'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-amber-400" />
              <span className="text-muted-foreground">Golden (Peak Focus)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-600" />
              <span className="text-muted-foreground">Work Hours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700" />
              <span className="text-muted-foreground">Off Hours</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Compact inline preview of energy profile
export function EnergyProfileBadge({ profile }: { profile?: EnergyProfile }) {
  if (!profile) {
    return (
      <Badge variant="outline" className="gap-1">
        <Battery className="h-3 w-3" />
        Not set
      </Badge>
    )
  }

  const { energyType, goldenStart, goldenEnd } = profile

  return (
    <Badge variant="secondary" className="gap-1">
      {energyType === 'early_bird' ? (
        <Sunrise className="h-3 w-3" />
      ) : energyType === 'night_owl' ? (
        <Moon className="h-3 w-3" />
      ) : (
        <Sun className="h-3 w-3" />
      )}
      Golden: {formatHour(goldenStart)}-{formatHour(goldenEnd)}
    </Badge>
  )
}
