'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DateTime } from 'luxon';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sun,
  Moon,
  Clock,
  Share2,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  Zap,
  Users,
  Home,
  Twitter,
  Linkedin,
} from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

import {
  getPainWeight,
  SacrificeCategory,
  calculateSacrificeScore,
} from '@/lib/sacrifice-score';
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

interface Selection {
  startIndex: number;
  endIndex: number;
}

// ============================================
// COLOR MAPPING
// ============================================

const CATEGORY_COLORS: Record<SacrificeCategory, { bg: string; text: string; darkBg: string; darkText: string }> = {
  golden: { bg: 'bg-emerald-100', text: 'text-emerald-800', darkBg: 'dark:bg-emerald-900/50', darkText: 'dark:text-emerald-300' },
  good: { bg: 'bg-green-100', text: 'text-green-700', darkBg: 'dark:bg-green-900/50', darkText: 'dark:text-green-300' },
  acceptable: { bg: 'bg-amber-100', text: 'text-amber-700', darkBg: 'dark:bg-amber-900/50', darkText: 'dark:text-amber-300' },
  early_morning: { bg: 'bg-orange-100', text: 'text-orange-700', darkBg: 'dark:bg-orange-900/50', darkText: 'dark:text-orange-300' },
  evening: { bg: 'bg-orange-100', text: 'text-orange-700', darkBg: 'dark:bg-orange-900/50', darkText: 'dark:text-orange-300' },
  late_evening: { bg: 'bg-purple-100', text: 'text-purple-700', darkBg: 'dark:bg-purple-900/50', darkText: 'dark:text-purple-300' },
  night: { bg: 'bg-indigo-100', text: 'text-indigo-700', darkBg: 'dark:bg-indigo-900/50', darkText: 'dark:text-indigo-300' },
  late_night: { bg: 'bg-slate-200', text: 'text-slate-700', darkBg: 'dark:bg-slate-800', darkText: 'dark:text-slate-300' },
  graveyard: { bg: 'bg-slate-300', text: 'text-slate-600', darkBg: 'dark:bg-slate-900', darkText: 'dark:text-slate-400' },
};

function getCategoryStyles(category: SacrificeCategory): string {
  const colors = CATEGORY_COLORS[category];
  return cn(colors.bg, colors.text, colors.darkBg, colors.darkText);
}

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

function formatLocalTime(utcDateTime: DateTime, timezone: string): string {
  const local = utcDateTime.setZone(timezone);
  return local.toFormat('h:mm a');
}

function formatLocalHour(utcDateTime: DateTime, timezone: string): number {
  return utcDateTime.setZone(timezone).hour;
}

function getSlotCategory(utcDateTime: DateTime, timezone: string): SacrificeCategory {
  const localHour = formatLocalHour(utcDateTime, timezone);
  return getPainWeight(localHour).category;
}

function calculateTotalSacrifice(utcDateTime: DateTime, cities: City[]): number {
  return cities.reduce((total, city) => {
    const localHour = formatLocalHour(utcDateTime, city.timezone);
    const score = calculateSacrificeScore({ localHour });
    return total + score.points;
  }, 0);
}

function isGoldenHourForAll(utcDateTime: DateTime, cities: City[]): boolean {
  return cities.every((city) => {
    const category = getSlotCategory(utcDateTime, city.timezone);
    return category === 'golden' || category === 'good';
  });
}

// ============================================
// BEST SLOT FINDER
// ============================================

function findBestMeetingSlot(slots: TimeSlot[], cities: City[]): TimeSlot | null {
  if (cities.length === 0 || slots.length === 0) return null;

  let bestSlot: TimeSlot | null = null;
  let lowestSacrifice = Infinity;

  for (const slot of slots) {
    const totalSacrifice = calculateTotalSacrifice(slot.utcDateTime, cities);
    if (totalSacrifice < lowestSacrifice) {
      lowestSacrifice = totalSacrifice;
      bestSlot = slot;
    }
  }

  return bestSlot;
}

function findGoldenWindows(slots: TimeSlot[], cities: City[]): TimeSlot[] {
  return slots.filter((slot) => isGoldenHourForAll(slot.utcDateTime, cities));
}

function checkOverlapExists(cities: City[]): boolean {
  if (cities.length < 2) return true;

  // Check if there's any hour where all cities have acceptable times (not graveyard)
  for (let utcHour = 0; utcHour < 24; utcHour++) {
    const testDateTime = DateTime.utc().set({ hour: utcHour, minute: 0 });
    const allAcceptable = cities.every((city) => {
      const category = getSlotCategory(testDateTime, city.timezone);
      return category !== 'graveyard' && category !== 'late_night';
    });
    if (allAcceptable) return true;
  }
  return false;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function FairTimeFinder() {
  // Theme
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = resolvedTheme === 'dark';

  // Cities
  const [cities, setCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WorldCity[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  // Date & Time
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Selection
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Share
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Memoized values
  const dateTime = useMemo(() => DateTime.fromJSDate(selectedDate), [selectedDate]);
  const timeSlots = useMemo(() => generateTimeSlots(dateTime), [dateTime]);
  const bestSlot = useMemo(() => findBestMeetingSlot(timeSlots, cities), [timeSlots, cities]);
  const goldenWindows = useMemo(() => findGoldenWindows(timeSlots, cities), [timeSlots, cities]);
  const hasOverlap = useMemo(() => checkOverlapExists(cities), [cities]);

  // Effects
  useEffect(() => {
    setMounted(true);
    // Load cities from localStorage
    const saved = localStorage.getItem('clockalign-finder-cities');
    if (saved) {
      try {
        setCities(JSON.parse(saved));
      } catch {
        console.error('Failed to load saved cities');
      }
    }
  }, []);

  useEffect(() => {
    if (cities.length > 0) {
      localStorage.setItem('clockalign-finder-cities', JSON.stringify(cities));
    }
  }, [cities]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = searchCities(searchQuery, 8);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Scroll to current time on initial load
  useEffect(() => {
    if (mounted && cities.length > 0 && gridRef.current) {
      const now = DateTime.now();
      const isToday = DateTime.fromJSDate(selectedDate).hasSame(now, 'day');
      if (isToday) {
        const currentSlotIndex = now.hour * 2 + (now.minute >= 30 ? 1 : 0);
        const slotWidth = 48;
        const scrollPosition = currentSlotIndex * slotWidth - gridRef.current.clientWidth / 2 + slotWidth / 2;
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
    setSearchOpen(false);
  }, [cities]);

  const removeCity = useCallback((cityId: string) => {
    setCities((prev) => prev.filter((c) => c.id !== cityId));
  }, []);

  // Date navigation
  const goToPreviousDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const goToNextDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    // Scroll to current time after a brief delay to allow render
    setTimeout(() => {
      if (gridRef.current) {
        const now = DateTime.now();
        const currentSlotIndex = now.hour * 2 + (now.minute >= 30 ? 1 : 0);
        const slotWidth = 48; // w-12 = 3rem = 48px
        const scrollPosition = currentSlotIndex * slotWidth - gridRef.current.clientWidth / 2 + slotWidth / 2;
        gridRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
      }
    }, 50);
  };

  // Drag selection
  const handleMouseDown = (index: number) => {
    setIsDragging(true);
    setDragStart(index);
    setSelection({ startIndex: index, endIndex: index });
  };

  const handleMouseEnter = (index: number) => {
    if (isDragging && dragStart !== null) {
      setSelection({
        startIndex: Math.min(dragStart, index),
        endIndex: Math.max(dragStart, index),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragStart(null);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging]);

  // Selection helpers
  const isSlotSelected = (index: number): boolean => {
    if (!selection) return false;
    return index >= selection.startIndex && index <= selection.endIndex;
  };

  const getSelectionDuration = (): number => {
    if (!selection) return 0;
    return (selection.endIndex - selection.startIndex + 1) * 30;
  };

  const getSelectionTimes = (): { city: City; startTime: string; endTime: string }[] => {
    if (!selection || cities.length === 0) return [];
    const startSlot = timeSlots[selection.startIndex];
    const endSlot = timeSlots[selection.endIndex];
    const endTime = endSlot.utcDateTime.plus({ minutes: 30 });

    return cities.map((city) => ({
      city,
      startTime: formatLocalTime(startSlot.utcDateTime, city.timezone),
      endTime: formatLocalTime(endTime, city.timezone),
    }));
  };

  const getSelectionSacrificeScores = (): { city: City; score: number; category: SacrificeCategory }[] => {
    if (!selection || cities.length === 0) return [];
    const midIndex = Math.floor((selection.startIndex + selection.endIndex) / 2);
    const midSlot = timeSlots[midIndex];

    return cities.map((city) => {
      const localHour = formatLocalHour(midSlot.utcDateTime, city.timezone);
      const result = calculateSacrificeScore({ localHour, durationMinutes: getSelectionDuration() });
      return {
        city,
        score: result.points,
        category: result.category,
      };
    });
  };

  // Share functionality
  const getShareUrl = (): string => {
    const cityIds = cities.map((c) => c.id).join('-');
    return `${window.location.origin}/finder/${cityIds}`;
  };

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const text = `Finding fair meeting times across ${cities.length} cities with @ClockAlign`;
    const url = getShareUrl();
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareToLinkedIn = () => {
    const url = getShareUrl();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  // Jump to best slot
  const scrollToBestSlot = () => {
    if (bestSlot && gridRef.current) {
      const slotWidth = 48; // Approximate slot width
      const scrollPosition = bestSlot.index * slotWidth - gridRef.current.clientWidth / 2;
      gridRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
      setSelection({ startIndex: bestSlot.index, endIndex: bestSlot.index + 1 });
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
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--purple))] flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold hidden sm:inline">ClockAlign</span>
            </Link>

            {/* Title */}
            <h1 className="text-lg font-medium">Fair Time Finder</h1>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="text-muted-foreground hover:text-foreground"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {/* Share */}
              <Popover open={shareOpen} onOpenChange={setShareOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={cities.length === 0}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Share This Comparison</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={copyShareLink}
                      >
                        {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                        {copied ? 'Copied!' : 'Copy Link'}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={shareToTwitter}>
                        <Twitter className="w-4 h-4 mr-1" />
                        Twitter
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={shareToLinkedIn}>
                        <Linkedin className="w-4 h-4 mr-1" />
                        LinkedIn
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Home */}
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <Home className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* City Search */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* City Chips */}
              <AnimatePresence mode="popLayout">
                {cities.map((city) => (
                  <motion.div
                    key={city.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    layout
                  >
                    <Badge
                      variant="secondary"
                      className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-2 bg-card border border-border"
                    >
                      <span>{city.flag}</span>
                      <span className="font-medium">{city.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({DateTime.now().setZone(city.timezone).toFormat('ZZZZ')})
                      </span>
                      <button
                        onClick={() => removeCity(city.id)}
                        className="ml-1 p-1 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Search Input */}
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 text-muted-foreground border-dashed"
                  >
                    <Search className="w-4 h-4" />
                    Add City
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search cities..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>No cities found.</CommandEmpty>
                      <CommandGroup heading="Cities">
                        {searchResults.map((city) => (
                          <CommandItem
                            key={`${city.name}-${city.country}`}
                            onSelect={() => addCity(city)}
                            className="cursor-pointer"
                          >
                            <span className="mr-2">{countryToFlag(city.countryCode)}</span>
                            <span className="font-medium">{city.name}</span>
                            <span className="text-muted-foreground ml-1">
                              {city.country}
                            </span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {DateTime.now().setZone(city.timezone).toFormat('ZZZZ')}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousDay}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    {DateTime.fromJSDate(selectedDate).toFormat('EEE, MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" onClick={goToNextDay}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>

            {/* Quick Actions */}
            {cities.length >= 2 && (
              <div className="flex items-center gap-2">
                {bestSlot && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={scrollToBestSlot}
                    className="bg-[hsl(var(--brand))] hover:bg-[hsl(220_90%_50%)]"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Find Best Time
                  </Button>
                )}
                {goldenWindows.length > 0 && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {goldenWindows.length} Golden Windows
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* No Overlap Warning */}
          {cities.length >= 2 && !hasOverlap && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">No Good Overlap Found</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    The timezones you selected do not have a reasonable overlap during working hours.
                    Consider splitting into two meetings or using async communication.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-muted-foreground">Time quality:</span>
            {(['golden', 'good', 'acceptable', 'early_morning', 'evening', 'late_evening', 'night', 'graveyard'] as SacrificeCategory[]).map((category) => (
              <div
                key={category}
                className={cn('px-2 py-0.5 rounded', getCategoryStyles(category))}
              >
                {category.replace('_', ' ')}
              </div>
            ))}
          </div>

          {/* Time Grid */}
          {cities.length > 0 ? (
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              {/* Hour Labels */}
              <div
                ref={gridRef}
                className="overflow-x-auto scrollbar-hide"
                onMouseUp={handleMouseUp}
              >
                <div className="min-w-[1200px]">
                  {/* UTC Hour Row */}
                  <div className="flex border-b border-border bg-muted/30">
                    <div className="w-40 flex-shrink-0 px-3 py-2 font-medium text-sm border-r border-border">
                      UTC Time
                    </div>
                    <div className="flex">
                      {timeSlots.map((slot) => (
                        <div
                          key={slot.index}
                          className={cn(
                            'w-12 flex-shrink-0 text-center py-2 text-xs border-r border-border',
                            slot.minute === 0 ? 'font-medium' : 'text-muted-foreground'
                          )}
                        >
                          {slot.minute === 0 ? `${slot.hour}:00` : ':30'}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* City Rows */}
                  {cities.map((city, cityIndex) => (
                    <div
                      key={city.id}
                      className={cn(
                        'flex border-b border-border',
                        cityIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                      )}
                    >
                      {/* City Label */}
                      <div className="w-40 flex-shrink-0 px-3 py-3 border-r border-border">
                        <div className="flex items-center gap-2">
                          <span>{city.flag}</span>
                          <div>
                            <div className="font-medium text-sm">{city.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {DateTime.now().setZone(city.timezone).toFormat('ZZZZ')}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Time Slots */}
                      <div className="flex">
                        {timeSlots.map((slot) => {
                          const category = getSlotCategory(slot.utcDateTime, city.timezone);
                          const localTime = formatLocalTime(slot.utcDateTime, city.timezone);
                          const isSelected = isSlotSelected(slot.index);
                          const isGolden = isGoldenHourForAll(slot.utcDateTime, cities);

                          return (
                            <Tooltip key={slot.index}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    'w-12 flex-shrink-0 h-10 flex items-center justify-center text-xs cursor-pointer border-r border-border transition-all select-none',
                                    getCategoryStyles(category),
                                    isSelected && 'ring-2 ring-inset ring-[hsl(var(--brand))] z-10',
                                    isGolden && cityIndex === 0 && 'ring-1 ring-emerald-400'
                                  )}
                                  onMouseDown={() => handleMouseDown(slot.index)}
                                  onMouseEnter={() => handleMouseEnter(slot.index)}
                                >
                                  {slot.minute === 0 ? (
                                    <span className="font-medium">
                                      {formatLocalHour(slot.utcDateTime, city.timezone)}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] opacity-70">:30</span>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">{city.name}: {localTime}</p>
                                <p className="text-xs opacity-70">{category.replace('_', ' ')}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-lg p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Add cities to compare</h3>
              <p className="text-muted-foreground mb-4">
                Search and add the cities you want to find meeting times for.
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchOpen(true)}
                className="gap-2"
              >
                <Search className="w-4 h-4" />
                Add Your First City
              </Button>
            </div>
          )}

          {/* Selection Panel */}
          <AnimatePresence>
            {selection && cities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4"
              >
                <div className="bg-card border border-border rounded-xl shadow-elevated p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]">
                        {getSelectionDuration()} min
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {DateTime.fromJSDate(selectedDate).toFormat('EEE, MMM d')}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelection(null)}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getSelectionTimes().map(({ city, startTime, endTime }) => {
                      const scoreData = getSelectionSacrificeScores().find((s) => s.city.id === city.id);
                      return (
                        <div
                          key={city.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <span>{city.flag}</span>
                            <div>
                              <div className="font-medium text-sm">{city.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {startTime} - {endTime}
                              </div>
                            </div>
                          </div>
                          {scoreData && (
                            <Badge
                              variant="secondary"
                              className={cn('text-xs', getCategoryStyles(scoreData.category))}
                            >
                              {scoreData.score.toFixed(1)} pts
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Total sacrifice: </span>
                      <span className="font-medium">
                        {getSelectionSacrificeScores()
                          .reduce((sum, s) => sum + s.score, 0)
                          .toFixed(1)}{' '}
                        pts
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={copyShareLink}>
                        <Copy className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Best Times Summary */}
          {cities.length >= 2 && bestSlot && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Best Time Card */}
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-[hsl(var(--brand))]" />
                  <h3 className="font-medium">Best Meeting Time</h3>
                </div>
                <div className="space-y-2">
                  {cities.map((city) => {
                    const localTime = formatLocalTime(bestSlot.utcDateTime, city.timezone);
                    const category = getSlotCategory(bestSlot.utcDateTime, city.timezone);
                    return (
                      <div key={city.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{city.flag}</span>
                          <span className="text-sm">{city.name}</span>
                        </div>
                        <Badge variant="secondary" className={cn('text-xs', getCategoryStyles(category))}>
                          {localTime}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Total sacrifice: {calculateTotalSacrifice(bestSlot.utcDateTime, cities).toFixed(1)} pts
                  </div>
                </div>
              </div>

              {/* Golden Windows Card */}
              {goldenWindows.length > 0 && (
                <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-medium text-emerald-800 dark:text-emerald-200">Golden Windows</h3>
                  </div>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">
                    Times when everyone is at their sharpest:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {goldenWindows.slice(0, 6).map((slot) => (
                      <Badge
                        key={slot.index}
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200 text-xs"
                      >
                        {slot.utcDateTime.toFormat('HH:mm')} UTC
                      </Badge>
                    ))}
                    {goldenWindows.length > 6 && (
                      <Badge variant="secondary" className="text-xs">
                        +{goldenWindows.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border mt-12 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between text-sm text-muted-foreground">
            <p>ClockAlign - Fair Meeting Scheduling</p>
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
