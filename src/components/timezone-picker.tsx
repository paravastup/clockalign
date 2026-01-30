'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Globe, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { DateTime } from 'luxon'

// Common timezones grouped by region
const TIMEZONE_GROUPS = {
  'Common': [
    'America/Los_Angeles',
    'America/Denver', 
    'America/Chicago',
    'America/New_York',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Dubai',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Pacific/Auckland',
  ],
  'Americas': [
    'America/Anchorage',
    'America/Vancouver',
    'America/Phoenix',
    'America/Mexico_City',
    'America/Bogota',
    'America/Lima',
    'America/Santiago',
    'America/Sao_Paulo',
    'America/Buenos_Aires',
    'America/Toronto',
  ],
  'Europe': [
    'Europe/Dublin',
    'Europe/Amsterdam',
    'Europe/Brussels',
    'Europe/Madrid',
    'Europe/Rome',
    'Europe/Vienna',
    'Europe/Warsaw',
    'Europe/Stockholm',
    'Europe/Helsinki',
    'Europe/Athens',
    'Europe/Moscow',
  ],
  'Asia': [
    'Asia/Jerusalem',
    'Asia/Istanbul',
    'Asia/Riyadh',
    'Asia/Tehran',
    'Asia/Karachi',
    'Asia/Dhaka',
    'Asia/Bangkok',
    'Asia/Jakarta',
    'Asia/Manila',
    'Asia/Hong_Kong',
    'Asia/Seoul',
  ],
  'Pacific': [
    'Pacific/Honolulu',
    'Pacific/Fiji',
    'Pacific/Guam',
    'Australia/Perth',
    'Australia/Brisbane',
    'Australia/Melbourne',
  ],
  'Africa': [
    'Africa/Cairo',
    'Africa/Lagos',
    'Africa/Johannesburg',
    'Africa/Nairobi',
  ],
}

function getTimezoneLabel(tz: string): string {
  // Get city name from timezone
  const city = tz.split('/').pop()?.replace(/_/g, ' ') || tz
  
  // Get current time and offset
  const now = DateTime.now().setZone(tz)
  const offset = now.toFormat('ZZ')
  
  return `${city} (UTC${offset})`
}

function getCurrentTime(tz: string): string {
  return DateTime.now().setZone(tz).toFormat('h:mm a')
}

interface TimezonePickerProps {
  value?: string
  onChange?: (timezone: string) => void
  placeholder?: string
  disabled?: boolean
}

export function TimezonePicker({ 
  value, 
  onChange, 
  placeholder = 'Select timezone...',
  disabled = false
}: TimezonePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  // Filter timezones based on search
  const filteredGroups = React.useMemo(() => {
    if (!search) return TIMEZONE_GROUPS
    
    const lowerSearch = search.toLowerCase()
    const result: Record<string, string[]> = {}
    
    for (const [group, timezones] of Object.entries(TIMEZONE_GROUPS)) {
      const filtered = timezones.filter(tz => {
        const city = tz.split('/').pop()?.replace(/_/g, ' ').toLowerCase() || ''
        const region = tz.split('/')[0].toLowerCase()
        return city.includes(lowerSearch) || region.includes(lowerSearch) || tz.toLowerCase().includes(lowerSearch)
      })
      if (filtered.length > 0) {
        result[group] = filtered
      }
    }
    
    return result
  }, [search])

  const hasResults = Object.values(filteredGroups).some(tzs => tzs.length > 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <div className="flex items-center gap-2 truncate">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            {value ? (
              <span className="truncate">{getTimezoneLabel(value)}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search timezone..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {!hasResults && (
              <CommandEmpty>No timezone found.</CommandEmpty>
            )}
            {Object.entries(filteredGroups).map(([group, timezones]) => (
              <CommandGroup key={group} heading={group}>
                {timezones.map((tz) => (
                  <CommandItem
                    key={tz}
                    value={tz}
                    onSelect={() => {
                      onChange?.(tz)
                      setOpen(false)
                      setSearch('')
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Check
                        className={cn(
                          'h-4 w-4',
                          value === tz ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span>{getTimezoneLabel(tz)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getCurrentTime(tz)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Compact version for inline use
export function TimezoneDisplay({ timezone }: { timezone: string }) {
  const now = DateTime.now().setZone(timezone)
  const city = timezone.split('/').pop()?.replace(/_/g, ' ') || timezone
  const time = now.toFormat('h:mm a')
  const offset = now.toFormat('ZZ')

  return (
    <div className="flex items-center gap-2 text-sm">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium">{city}</span>
      <span className="text-muted-foreground">
        {time} (UTC{offset})
      </span>
    </div>
  )
}
