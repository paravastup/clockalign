'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DateTime } from 'luxon';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
  Clock,
  Zap,
  Users,
  MessageSquare,
  BarChart3,
  Lock,
  Sun,
  Moon,
  Info,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  searchCities,
  worldCityToCity,
  countryToFlag,
  type WorldCity,
} from '@/lib/cities-database';

// ============================================
// TYPES
// ============================================

interface City {
  id: string;
  name: string;
  country: string;
  timezone: string;
  flag: string;
}

interface TimeSlot {
  index: number;
  hour: number;
  minute: number;
  utcDateTime: DateTime;
}

// ============================================
// ENERGY LEVEL MAPPING
// ============================================

type EnergyLevel = 'peak' | 'ok' | 'earlyLate' | 'night' | 'sleep';

function getEnergyLevel(hour: number): EnergyLevel {
  // Peak: 10-16 (10am-4pm)
  if (hour >= 10 && hour < 16) return 'peak';
  // OK: 8-10, 16-18 (8am-10am, 4pm-6pm)
  if ((hour >= 8 && hour < 10) || (hour >= 16 && hour < 18)) return 'ok';
  // Early/Late: 6-8, 18-21 (6am-8am, 6pm-9pm)
  if ((hour >= 6 && hour < 8) || (hour >= 18 && hour < 21)) return 'earlyLate';
  // Night: 21-23, 5-6 (9pm-11pm, 5am-6am)
  if ((hour >= 21 && hour < 23) || (hour >= 5 && hour < 6)) return 'night';
  // Sleep: 23-5 (11pm-5am)
  return 'sleep';
}

const ENERGY_COLORS: Record<EnergyLevel, string> = {
  peak: 'bg-emerald-500',
  ok: 'bg-lime-500',
  earlyLate: 'bg-amber-500',
  night: 'bg-indigo-500',
  sleep: 'bg-slate-700 dark:bg-slate-700',
};

const ENERGY_TEXT_COLORS: Record<EnergyLevel, string> = {
  peak: 'text-white',
  ok: 'text-slate-900',
  earlyLate: 'text-slate-900',
  night: 'text-white',
  sleep: 'text-slate-400',
};

// Light mode overrides for sleep color
const ENERGY_COLORS_LIGHT: Record<EnergyLevel, string> = {
  peak: 'bg-emerald-500',
  ok: 'bg-lime-500',
  earlyLate: 'bg-amber-500',
  night: 'bg-indigo-500',
  sleep: 'bg-slate-300',
};

const ENERGY_TEXT_COLORS_LIGHT: Record<EnergyLevel, string> = {
  peak: 'text-white',
  ok: 'text-slate-900',
  earlyLate: 'text-slate-900',
  night: 'text-white',
  sleep: 'text-slate-600',
};

// ============================================
// DEFAULT CITIES
// ============================================

const DEFAULT_CITIES: City[] = [
  {
    id: 'mumbai-india',
    name: 'Mumbai',
    country: 'India',
    timezone: 'Asia/Kolkata',
    flag: '🇮🇳',
  },
  {
    id: 'philadelphia-usa',
    name: 'Philadelphia',
    country: 'United States',
    timezone: 'America/New_York',
    flag: '🇺🇸',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateTimeSlots(date: DateTime): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const baseDate = date.startOf('day').toUTC();

  for (let i = 0; i < 48; i++) {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    slots.push({
      index: i,
      hour,
      minute,
      utcDateTime: baseDate.set({ hour, minute }),
    });
  }
  return slots;
}

function formatLocalHour(utcDateTime: DateTime, timezone: string): number {
  return utcDateTime.setZone(timezone).hour;
}

function getSlotEnergyLevel(utcDateTime: DateTime, timezone: string): EnergyLevel {
  const localHour = formatLocalHour(utcDateTime, timezone);
  return getEnergyLevel(localHour);
}

function calculateRelativeOffset(timezone: string, referenceTimezone: string = 'UTC'): number {
  const now = DateTime.now();
  const targetOffset = now.setZone(timezone).offset;
  const referenceOffset = now.setZone(referenceTimezone).offset;
  return (targetOffset - referenceOffset) / 60;
}

function formatRelativeOffset(offset: number): string {
  const sign = offset >= 0 ? '+' : '';
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset);
  const minutes = (absOffset - hours) * 60;
  if (minutes === 0) {
    return `${sign}${offset}h`;
  }
  return `${sign}${Math.floor(offset)}.5h`;
}

function checkGoldenOverlap(cities: City[]): { hasOverlap: boolean; spreadHours: number } {
  if (cities.length < 2) return { hasOverlap: true, spreadHours: 0 };

  // Calculate timezone spread
  const offsets = cities.map(c => DateTime.now().setZone(c.timezone).offset / 60);
  const minOffset = Math.min(...offsets);
  const maxOffset = Math.max(...offsets);
  const spreadHours = maxOffset - minOffset;

  // Check if there's any hour where all cities have golden/good hours (10am-4pm range)
  for (let utcHour = 0; utcHour < 24; utcHour++) {
    const testDateTime = DateTime.utc().set({ hour: utcHour, minute: 0 });
    const allGolden = cities.every((city) => {
      const localHour = formatLocalHour(testDateTime, city.timezone);
      return localHour >= 10 && localHour < 16;
    });
    if (allGolden) return { hasOverlap: true, spreadHours };
  }

  return { hasOverlap: false, spreadHours };
}

function findBestOverlapSlot(slots: TimeSlot[], cities: City[]): number | null {
  if (cities.length === 0) return null;

  let bestIndex = 0;
  let bestScore = -Infinity;

  for (const slot of slots) {
    let score = 0;
    for (const city of cities) {
      const energy = getSlotEnergyLevel(slot.utcDateTime, city.timezone);
      if (energy === 'peak') score += 4;
      else if (energy === 'ok') score += 3;
      else if (energy === 'earlyLate') score += 2;
      else if (energy === 'night') score += 1;
      else score += 0;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIndex = slot.index;
    }
  }

  return bestIndex;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function FairTimeFinder() {
  // State
  const [mounted, setMounted] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WorldCity[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [use12Hour, setUse12Hour] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Theme
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Memoized values
  const dateTime = useMemo(() => DateTime.fromJSDate(selectedDate), [selectedDate]);
  const timeSlots = useMemo(() => generateTimeSlots(dateTime), [dateTime]);
  const overlapInfo = useMemo(() => checkGoldenOverlap(cities), [cities]);
  const bestSlotIndex = useMemo(() => findBestOverlapSlot(timeSlots, cities), [timeSlots, cities]);

  // Generate week days for date picker
  const weekDays = useMemo(() => {
    const days: { date: Date; dayName: string; dayNum: number; isToday: boolean; isSelected: boolean }[] = [];
    const today = new Date();
    const selected = DateTime.fromJSDate(selectedDate);

    // Start from 2 days before selected date
    for (let i = -2; i <= 4; i++) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + i);
      const dt = DateTime.fromJSDate(d);
      days.push({
        date: d,
        dayName: dt.toFormat('EEE').toUpperCase(),
        dayNum: d.getDate(),
        isToday: dt.hasSame(DateTime.fromJSDate(today), 'day'),
        isSelected: dt.hasSame(selected, 'day'),
      });
    }
    return days;
  }, [selectedDate]);

  // Current time position for yellow indicator
  const currentTimePosition = useMemo(() => {
    const now = DateTime.now();
    const isToday = DateTime.fromJSDate(selectedDate).hasSame(now, 'day');
    if (!isToday) return null;

    // Calculate position based on current hour and minute
    const totalMinutes = now.hour * 60 + now.minute;
    const slotWidth = 48; // Each 30-min slot is 48px wide
    const position = (totalMinutes / 30) * slotWidth;
    return position;
  }, [selectedDate]);

  // Effects
  useEffect(() => {
    setMounted(true);
    // Load cities from localStorage or use defaults
    const saved = localStorage.getItem('clockalign-finder-cities');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setCities(parsed);
        } else {
          setCities(DEFAULT_CITIES);
        }
      } catch {
        setCities(DEFAULT_CITIES);
      }
    } else {
      setCities(DEFAULT_CITIES);
    }
  }, []);

  useEffect(() => {
    if (mounted && cities.length > 0) {
      localStorage.setItem('clockalign-finder-cities', JSON.stringify(cities));
    }
  }, [cities, mounted]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = searchCities(searchQuery, 6);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Scroll to current time or best slot on load
  useEffect(() => {
    if (mounted && cities.length > 0 && gridRef.current) {
      const now = DateTime.now();
      const isToday = DateTime.fromJSDate(selectedDate).hasSame(now, 'day');

      if (isToday && currentTimePosition !== null) {
        const scrollPosition = currentTimePosition - gridRef.current.clientWidth / 2;
        gridRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
      } else if (bestSlotIndex !== null) {
        const slotWidth = 48;
        const scrollPosition = bestSlotIndex * slotWidth - gridRef.current.clientWidth / 2;
        gridRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, cities.length > 0]);

  // City management
  const addCity = useCallback((worldCity: WorldCity) => {
    const city = worldCityToCity(worldCity);
    if (!cities.find((c) => c.id === city.id)) {
      setCities((prev) => [...prev, city]);
    }
    setSearchQuery('');
    setSearchFocused(false);
  }, [cities]);

  const removeCity = useCallback((cityId: string) => {
    setCities((prev) => prev.filter((c) => c.id !== cityId));
  }, []);

  // Navigation
  const goToPreviousWeek = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const goToNextWeek = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    setTimeout(() => {
      if (gridRef.current && currentTimePosition !== null) {
        const scrollPosition = currentTimePosition - gridRef.current.clientWidth / 2;
        gridRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
      }
    }, 50);
  };

  const scrollToNow = () => {
    if (gridRef.current && currentTimePosition !== null) {
      const scrollPosition = currentTimePosition - gridRef.current.clientWidth / 2;
      gridRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
    }
  };

  const scrollToGolden = () => {
    if (gridRef.current && bestSlotIndex !== null) {
      const slotWidth = 48;
      const scrollPosition = bestSlotIndex * slotWidth - gridRef.current.clientWidth / 2;
      gridRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-foreground">ClockAlign</span>
              <span className="text-muted-foreground text-sm ml-2 hidden sm:inline">Fair meeting times</span>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary h-8 w-8"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToNow}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              Now
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToGolden}
              className="text-emerald-400 hover:text-emerald-300 hover:bg-secondary border border-emerald-500/50"
            >
              <Zap className="w-4 h-4 mr-1" />
              Golden
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUse12Hour(!use12Hour)}
              className={cn(
                "hover:bg-secondary",
                use12Hour ? "text-amber-400 border border-amber-500/50" : "text-muted-foreground"
              )}
            >
              12h
            </Button>

            <Link href="/login">
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                Sign up free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* City Search - Inline Input */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-card/50 rounded-lg px-3 py-2 border border-border focus-within:border-muted-foreground/50">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Add city or timezone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className="bg-transparent border-none outline-none text-foreground placeholder-muted-foreground w-64"
            />
          </div>

          {/* Search Dropdown */}
          <AnimatePresence>
            {searchFocused && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-1 w-80 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden"
              >
                {searchResults.map((city) => (
                  <button
                    key={`${city.name}-${city.country}`}
                    onClick={() => addCity(city)}
                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                  >
                    <span className="text-lg">{countryToFlag(city.countryCode)}</span>
                    <div className="flex-1">
                      <span className="text-foreground font-medium">{city.name}</span>
                      <span className="text-muted-foreground ml-2">{city.country}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {DateTime.now().setZone(city.timezone).toFormat('HH:mm')}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* City Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <AnimatePresence mode="popLayout">
            {cities.map((city, index) => {
              const offset = calculateRelativeOffset(city.timezone, cities[0]?.timezone || 'UTC');
              const displayOffset = index === 0 ? null : offset;

              return (
                <motion.div
                  key={city.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  layout
                  className="flex items-center gap-2 bg-card border border-border rounded-full pl-3 pr-1 py-1"
                >
                  <span className="text-sm">{city.flag}</span>
                  <span className="text-foreground font-medium text-sm">{city.name}</span>
                  {displayOffset !== null && displayOffset !== 0 && (
                    <span className="text-emerald-400 text-xs font-medium">
                      {formatRelativeOffset(displayOffset)}
                    </span>
                  )}
                  <button
                    onClick={() => removeCity(city.id)}
                    className="ml-1 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <button
            onClick={() => searchInputRef.current?.focus()}
            className="text-emerald-400 text-sm hover:text-emerald-300 flex items-center gap-1"
          >
            + Add city
          </button>
        </div>

        {/* Alert Banner - No Golden Overlap */}
        {cities.length >= 2 && !overlapInfo.hasOverlap && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-foreground font-medium">No golden overlap possible</p>
                <p className="text-muted-foreground text-sm">
                  {overlapInfo.spreadHours.toFixed(1)}h spread is too wide for everyone to be in peak hours
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/50"
              >
                Try async instead?
              </Button>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <p className="text-amber-400 font-medium">{overlapInfo.spreadHours.toFixed(1)}h</p>
                  <span title="Timezone spread between all cities">
                    <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">spread</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Week Date Picker */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousWeek}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1">
              {weekDays.map((day, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day.date)}
                  className={cn(
                    "flex flex-col items-center px-3 py-1 rounded-lg transition-colors min-w-[50px]",
                    day.isSelected
                      ? "bg-emerald-500 text-white"
                      : day.isToday
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <span className="text-xs font-medium">{day.dayName}</span>
                  <span className="text-sm font-bold">{day.dayNum}</span>
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextWeek}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-muted-foreground/80 hover:bg-secondary flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              Unlock Calendar
            </Button>
          </div>
        </div>

        {/* Energy Legend */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">Energy:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-muted-foreground">Peak</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-lime-500" />
            <span className="text-muted-foreground">OK</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span className="text-muted-foreground">Early/Late</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-indigo-500" />
            <span className="text-muted-foreground">Night</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={cn("w-3 h-3 rounded", isDark ? "bg-slate-700" : "bg-slate-300")} />
            <span className="text-muted-foreground">Sleep</span>
          </div>
        </div>

        {/* Best Overlap Indicator */}
        {cities.length >= 2 && bestSlotIndex !== null && (
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-emerald-400" />
              <span className="text-emerald-400 font-medium">Best overlap</span>
            </div>
          </div>
        )}

        {/* Time Grid */}
        {cities.length > 0 ? (
          <div className="border border-border rounded-lg overflow-hidden bg-card/30">
            <div
              ref={gridRef}
              className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-background"
            >
              <div className="min-w-[1200px] relative">
                {/* City Rows */}
                {cities.map((city, cityIndex) => {
                  const currentLocalTime = DateTime.now().setZone(city.timezone);

                  return (
                    <div
                      key={city.id}
                      className={cn(
                        'flex border-b border-border last:border-b-0',
                        cityIndex % 2 === 0 ? 'bg-card/20' : 'bg-card/40'
                      )}
                    >
                      {/* City Label */}
                      <div className="w-36 flex-shrink-0 px-3 py-2 border-r border-border bg-card/50">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{city.flag}</span>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground text-sm truncate">{city.name}</div>
                            <div className="font-bold text-lg text-foreground leading-tight">
                              {currentLocalTime.toFormat(use12Hour ? 'h:mm' : 'HH:mm')}
                              {use12Hour && <span className="text-sm ml-1">{currentLocalTime.toFormat('a')}</span>}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {DateTime.now().setZone(city.timezone).toFormat('ZZZZ')}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Time Slots */}
                      <div className="flex relative">
                        {timeSlots.map((slot) => {
                          const localDateTime = slot.utcDateTime.setZone(city.timezone);
                          const localHour = localDateTime.hour;
                          const energy = getSlotEnergyLevel(slot.utcDateTime, city.timezone);
                          const isBestSlot = slot.index === bestSlotIndex;
                          const isMidnight = localHour === 0 && slot.minute === 0;

                          // Use theme-appropriate colors for sleep
                          const bgColor = energy === 'sleep'
                            ? (isDark ? ENERGY_COLORS[energy] : ENERGY_COLORS_LIGHT[energy])
                            : ENERGY_COLORS[energy];
                          const textColor = energy === 'sleep'
                            ? (isDark ? ENERGY_TEXT_COLORS[energy] : ENERGY_TEXT_COLORS_LIGHT[energy])
                            : ENERGY_TEXT_COLORS[energy];

                          return (
                            <div
                              key={slot.index}
                              className={cn(
                                'w-12 flex-shrink-0 h-12 flex items-center justify-center text-xs border-r border-border/50 transition-all relative',
                                bgColor,
                                textColor,
                                isBestSlot && cityIndex === 0 && 'ring-2 ring-emerald-400 ring-inset z-10'
                              )}
                            >
                              {/* Date transition marker at midnight */}
                              {isMidnight && cityIndex === 0 && (
                                <div className="absolute -top-5 left-0 text-[10px] text-muted-foreground whitespace-nowrap font-medium">
                                  {localDateTime.toFormat('LLL d')}
                                </div>
                              )}

                              {slot.minute === 0 ? (
                                <span className="font-semibold">
                                  {use12Hour ? (
                                    <>
                                      {localHour % 12 || 12}
                                      <span className="text-[10px] opacity-70 ml-0.5">
                                        {localHour < 12 ? 'AM' : 'PM'}
                                      </span>
                                    </>
                                  ) : (
                                    `${localHour}:00`
                                  )}
                                </span>
                              ) : (
                                <span className="opacity-50">:30</span>
                              )}

                              {/* Best slot indicator on first row */}
                              {isBestSlot && cityIndex === 0 && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                                  <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-emerald-400" />
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Current Time Indicator (yellow line) */}
                        {currentTimePosition !== null && cityIndex === 0 && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-20 pointer-events-none"
                            style={{ left: `${currentTimePosition}px` }}
                          >
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-yellow-400" />
                          </div>
                        )}
                        {currentTimePosition !== null && cityIndex > 0 && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400/50 z-20 pointer-events-none"
                            style={{ left: `${currentTimePosition}px` }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-lg p-12 text-center bg-card/20">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Add cities to compare</h3>
            <p className="text-muted-foreground mb-4">
              Search and add the cities you want to find meeting times for.
            </p>
            <Button
              onClick={() => searchInputRef.current?.focus()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Search className="w-4 h-4 mr-2" />
              Add Your First City
            </Button>
          </div>
        )}

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 pt-8 border-t border-border">
          {/* Fairness Leaderboard */}
          <div className="p-6 rounded-xl bg-card/50 border border-border">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Fairness Leaderboard</h3>
            <p className="text-muted-foreground text-sm">
              Track who&apos;s sacrificing most. Rotate meeting times so it&apos;s not always the same person waking up early.
            </p>
          </div>

          {/* Async Suggestions */}
          <div className="p-6 rounded-xl bg-card/50 border border-border">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Async Suggestions</h3>
            <p className="text-muted-foreground text-sm">
              Smart nudges when a Loom or doc would work better. Track hours reclaimed by going async.
            </p>
          </div>

          {/* Energy Optimization */}
          <div className="p-6 rounded-xl bg-card/50 border border-border">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Energy Optimization</h3>
            <p className="text-muted-foreground text-sm">
              Find times when everyone is cognitively sharp, not just awake. Based on chronotype research.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Fair scheduling for your whole team
          </h2>
          <p className="text-muted-foreground mb-6">
            Join 10,000+ remote teams making timezone pain visible and rotating it fairly.
          </p>
          <Link href="/login">
            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8"
            >
              Get Started Free
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <p className="text-muted-foreground text-sm mt-3">
            Free forever for teams up to 5 • No credit card required
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>Made with ❤️ for distributed teams</span>
          <span>•</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
