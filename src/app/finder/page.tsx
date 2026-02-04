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
  Calendar,
  Sun,
  Moon,
  Globe,
  AlertTriangle,
  Info,
  Sparkles,
  Copy,
  Lock,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import {
  searchCities,
  worldCityToCity,
  countryToFlag,
  type WorldCity,
} from '@/lib/cities-database';
import {
  calculateScoreForTimezone,
  calculateMeetingTotalSacrifice,
  type SacrificeScoreResult,
  type SacrificeCategory,
} from '@/lib/sacrifice-score';

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

interface SplitCallLocalTime {
  city: City;
  localHour: number;
  displayTime: string;
}

interface SplitCall {
  participants: City[];
  utcHour: number;
  localTimes: SplitCallLocalTime[];
}

interface SplitRecommendation {
  calls: SplitCall[];
  totalCalls: number;
}

// ============================================
// ENERGY LEVEL MAPPING (matching old design colors)
// ============================================

type EnergyLevel = 'peak' | 'ok' | 'earlyLate' | 'night' | 'sleep';

function getEnergyLevel(hour: number): EnergyLevel {
  if (hour >= 10 && hour < 16) return 'peak';
  if ((hour >= 8 && hour < 10) || (hour >= 16 && hour < 18)) return 'ok';
  if ((hour >= 6 && hour < 8) || (hour >= 18 && hour < 21)) return 'earlyLate';
  if ((hour >= 21 && hour < 23) || (hour >= 5 && hour < 6)) return 'night';
  return 'sleep';
}

// Colors matching old design (using -300 shades for light mode, -600/-700 for dark mode)
const ENERGY_COLORS: Record<EnergyLevel, string> = {
  peak: 'bg-emerald-300 dark:bg-emerald-700',
  ok: 'bg-yellow-300 dark:bg-yellow-600',
  earlyLate: 'bg-orange-300 dark:bg-orange-600',
  night: 'bg-violet-300 dark:bg-violet-700',
  sleep: 'bg-slate-200 dark:bg-slate-700',
};

const ENERGY_TEXT_COLORS: Record<EnergyLevel, string> = {
  peak: 'text-emerald-800 dark:text-emerald-100',
  ok: 'text-yellow-800 dark:text-yellow-100',
  earlyLate: 'text-orange-800 dark:text-orange-100',
  night: 'text-violet-800 dark:text-violet-100',
  sleep: 'text-slate-500 dark:text-slate-400',
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

// Number of hours to show before and after the selected day for centering
const HOURS_BEFORE = 12;
const HOURS_AFTER = 12;
const TOTAL_SLOTS = (24 + HOURS_BEFORE + HOURS_AFTER) * 2; // 96 half-hour slots

function generateTimeSlots(date: DateTime): TimeSlot[] {
  const slots: TimeSlot[] = [];
  // Get UTC midnight of the selected date, then subtract HOURS_BEFORE
  // Using DateTime.utc() ensures we start from UTC midnight, not local midnight
  const utcMidnight = DateTime.utc(date.year, date.month, date.day);
  const baseDate = utcMidnight.minus({ hours: HOURS_BEFORE });

  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const slotDateTime = baseDate.plus({ minutes: i * 30 });
    slots.push({
      index: i,
      hour: slotDateTime.hour,
      minute: slotDateTime.minute,
      utcDateTime: slotDateTime,
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

  const offsets = cities.map(c => DateTime.now().setZone(c.timezone).offset / 60);
  const minOffset = Math.min(...offsets);
  const maxOffset = Math.max(...offsets);
  const spreadHours = maxOffset - minOffset;

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

function formatDurationString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function getCategoryColorClasses(category: SacrificeCategory): string {
  const colors: Record<SacrificeCategory, string> = {
    golden: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    good: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    acceptable: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    early_morning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    evening: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    late_evening: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    night: 'bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    late_night: 'bg-red-300 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    graveyard: 'bg-rose-200 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  };
  return colors[category] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
}

/**
 * Calculates optimal split calls when golden overlap is impossible.
 * Uses greedy set-cover: each iteration picks the 9 AM anchor that covers
 * the most uncovered cities within work-friendly hours (7am-7pm).
 */
function calculateSplitCalls(cities: City[]): SplitRecommendation | null {
  if (cities.length < 2) return null;

  const calls: SplitCall[] = [];
  const coveredCities = new Set<string>();

  // Keep creating calls until all cities are covered
  while (coveredCities.size < cities.length) {
    let bestCall: { utcHour: number; localTimes: SplitCallLocalTime[] } | null = null;
    let bestNewlyCovered = 0;

    // Try anchoring at 9 AM for each city to find the best call
    for (const anchorCity of cities) {
      const anchorNow = DateTime.now().setZone(anchorCity.timezone);
      const callUtcHour = anchorNow.set({ hour: 9, minute: 0 }).toUTC().hour;

      const localTimes: SplitCallLocalTime[] = [];
      let newlyCoveredCount = 0;

      for (const city of cities) {
        const testTime = DateTime.utc().set({ hour: callUtcHour, minute: 0 });
        const localDT = testTime.setZone(city.timezone);
        const localHour = localDT.hour;

        // Work-friendly hours: 8am-5pm (standard business hours)
        const canAttend = localHour >= 8 && localHour <= 17;

        if (canAttend) {
          localTimes.push({
            city,
            localHour,
            displayTime: localDT.toFormat('h a') + ' ' + localDT.toFormat('ZZZZ'),
          });

          if (!coveredCities.has(city.id)) {
            newlyCoveredCount++;
          }
        }
      }

      // Choose the call that covers the most NEW cities
      // Tiebreaker: prefer calls with more total attendees (for display)
      if (
        newlyCoveredCount > bestNewlyCovered ||
        (newlyCoveredCount === bestNewlyCovered && bestCall && localTimes.length > bestCall.localTimes.length)
      ) {
        bestNewlyCovered = newlyCoveredCount;
        bestCall = { utcHour: callUtcHour, localTimes };
      }
    }

    if (bestCall && bestCall.localTimes.length > 0 && bestNewlyCovered > 0) {
      const participants = bestCall.localTimes
        .filter(lt => !coveredCities.has(lt.city.id))
        .map(lt => lt.city);

      participants.forEach(p => coveredCities.add(p.id));

      calls.push({
        participants,
        utcHour: bestCall.utcHour,
        localTimes: bestCall.localTimes,
      });
    } else {
      // Safety: break if we can't make progress
      break;
    }
  }

  if (calls.length <= 1) return null;

  return { calls, totalCalls: calls.length };
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function FairTimeFinder() {
  const [mounted, setMounted] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WorldCity[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [use12Hour, setUse12Hour] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [showSelectionPanel, setShowSelectionPanel] = useState(false);
  const [showSplitCalls, setShowSplitCalls] = useState(false);
  const [selectedCallIndex, setSelectedCallIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const dateTime = useMemo(() => DateTime.fromJSDate(selectedDate), [selectedDate]);
  const timeSlots = useMemo(() => generateTimeSlots(dateTime), [dateTime]);
  const overlapInfo = useMemo(() => checkGoldenOverlap(cities), [cities]);
  const bestSlotIndex = useMemo(() => findBestOverlapSlot(timeSlots, cities), [timeSlots, cities]);

  // Split calls recommendation (when no golden overlap)
  const splitRecommendation = useMemo(() => {
    if (overlapInfo.hasOverlap || cities.length < 2) return null;
    return calculateSplitCalls(cities);
  }, [cities, overlapInfo.hasOverlap]);

  // Check if viewing today (for trial/paid gating)
  const isViewingToday = useMemo(() => {
    return DateTime.fromJSDate(selectedDate).hasSame(DateTime.now(), 'day');
  }, [selectedDate]);

  // Trial: only show split calls for today, Paid: show for all dates
  // TODO: Add user?.isPaidUser check when auth is implemented
  const canShowSplitCalls = isViewingToday;

  // Multi-select range calculation
  const selectionRange = useMemo(() => {
    if (selectionStart === null || selectionEnd === null) return null;
    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd);
    return { start, end };
  }, [selectionStart, selectionEnd]);

  // Selection details calculation for the panel
  const selectionDetails = useMemo(() => {
    if (!selectionRange || cities.length === 0 || timeSlots.length === 0) return null;

    const startSlot = timeSlots[selectionRange.start];
    const endSlot = timeSlots[selectionRange.end];
    if (!startSlot || !endSlot) return null;

    const slotCount = selectionRange.end - selectionRange.start + 1;
    const durationMinutes = slotCount * 30;

    // Calculate per-city info
    const cityDetails = cities.map(city => {
      const startLocal = startSlot.utcDateTime.setZone(city.timezone);
      const endLocal = endSlot.utcDateTime.plus({ minutes: 30 }).setZone(city.timezone);

      // Calculate sacrifice score for this selection
      const score = calculateScoreForTimezone(
        startSlot.utcDateTime,
        city.timezone,
        { durationMinutes }
      );

      return {
        city,
        startTime: startLocal.toFormat('h:mm a'),
        endTime: endLocal.toFormat('h:mm a'),
        points: score.points,
        impactLevel: score.impactLevel,
        category: score.category,
      };
    });

    // Calculate total sacrifice
    const participantScores = cityDetails.map(d => ({ points: d.points } as SacrificeScoreResult));
    const totals = calculateMeetingTotalSacrifice(participantScores);

    return {
      durationMinutes,
      durationFormatted: formatDurationString(durationMinutes),
      cityDetails,
      totalPoints: totals.totalPoints,
      fairnessIndex: totals.fairnessIndex,
      imbalanceWarning: totals.imbalanceWarning,
      shouldSuggestAsync: totals.totalPoints > 15,
    };
  }, [selectionRange, timeSlots, cities]);

  const weekDays = useMemo(() => {
    const days: { date: Date; dayName: string; dayNum: number; isToday: boolean; isSelected: boolean }[] = [];
    const today = new Date();
    const selected = DateTime.fromJSDate(selectedDate);

    for (let i = -2; i <= 4; i++) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + i);
      const dt = DateTime.fromJSDate(d);
      days.push({
        date: d,
        dayName: dt.toFormat('ccc'),
        dayNum: d.getDate(),
        isToday: dt.hasSame(DateTime.fromJSDate(today), 'day'),
        isSelected: dt.hasSame(selected, 'day'),
      });
    }
    return days;
  }, [selectedDate]);

  const currentTimePosition = useMemo(() => {
    const now = DateTime.now();
    const isToday = DateTime.fromJSDate(selectedDate).hasSame(now, 'day');
    if (!isToday) return null;

    // Use UTC time since slots are ordered by UTC
    // Add HOURS_BEFORE offset since slots start 12h before midnight
    const nowUtc = now.toUTC();
    const totalMinutes = (HOURS_BEFORE * 60) + nowUtc.hour * 60 + nowUtc.minute;
    const slotWidth = 64; // w-16 = 64px
    const position = (totalMinutes / 30) * slotWidth;
    return position;
  }, [selectedDate]);

  useEffect(() => {
    setMounted(true);
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

  useEffect(() => {
    if (mounted && cities.length > 0 && gridRef.current) {
      const now = DateTime.now();
      const isToday = DateTime.fromJSDate(selectedDate).hasSame(now, 'day');
      const stickyColumnWidth = 288; // w-72 = 288px
      const viewportWidth = gridRef.current.clientWidth;
      // Effective scrollable viewport (visual area after sticky column)
      const effectiveViewport = viewportWidth - stickyColumnWidth;

      if (isToday && currentTimePosition !== null) {
        const scrollPosition = currentTimePosition - effectiveViewport / 2;
        gridRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
      } else if (bestSlotIndex !== null) {
        const slotWidth = 64; // w-16 = 64px
        const scrollPosition = bestSlotIndex * slotWidth - effectiveViewport / 2;
        gridRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, cities.length > 0]);

  // Auto-scroll back to today after 30 seconds of inactivity
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      // Scroll back to today
      setSelectedDate(new Date());
      // Clear any split call selection
      setSelectedCallIndex(null);
      // Scroll grid to current time after state updates
      setTimeout(() => {
        if (gridRef.current) {
          // Add HOURS_BEFORE offset since slots start 12h before midnight
          const nowUtc = DateTime.utc();
          const totalMinutes = (HOURS_BEFORE * 60) + nowUtc.hour * 60 + nowUtc.minute;
          const slotWidth = 64;
          const stickyColumnWidth = 288;
          const currentPos = (totalMinutes / 30) * slotWidth;
          const viewportWidth = gridRef.current.clientWidth;
          const scrollPosition = currentPos - (viewportWidth - stickyColumnWidth) / 2;
          gridRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
        }
      }, 100);
    }, 30000); // 30 seconds
  }, []);

  // Track user interactions for inactivity timer
  useEffect(() => {
    const handleActivity = () => resetInactivityTimer();

    const grid = gridRef.current;
    if (grid) {
      grid.addEventListener('scroll', handleActivity);
      grid.addEventListener('mousedown', handleActivity);
    }
    document.addEventListener('keydown', handleActivity);

    // Start timer on mount
    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (grid) {
        grid.removeEventListener('scroll', handleActivity);
        grid.removeEventListener('mousedown', handleActivity);
      }
      document.removeEventListener('keydown', handleActivity);
    };
  }, [resetInactivityTimer]);

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

  const goToPreviousDay = () => {
    resetInactivityTimer();
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const goToNextDay = () => {
    resetInactivityTimer();
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const goToToday = () => {
    resetInactivityTimer();
    setSelectedDate(new Date());
    // Need longer timeout to allow state update and re-render
    setTimeout(() => {
      if (gridRef.current) {
        // Use UTC time since slots are ordered by UTC
        // Add HOURS_BEFORE offset since slots start 12h before midnight
        const nowUtc = DateTime.utc();
        const totalMinutes = (HOURS_BEFORE * 60) + nowUtc.hour * 60 + nowUtc.minute;
        const slotWidth = 64;
        const currentPos = (totalMinutes / 30) * slotWidth;
        const viewportWidth = gridRef.current.clientWidth;
        const stickyColumnWidth = 288; // w-72 = 288px
        const scrollPosition = currentPos - (viewportWidth - stickyColumnWidth) / 2;
        gridRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
      }
    }, 100);
  };

  const scrollToNow = () => {
    resetInactivityTimer();
    if (gridRef.current && currentTimePosition !== null) {
      const stickyColumnWidth = 288; // w-72 = 288px
      const viewportWidth = gridRef.current.clientWidth;
      // Center in the visible area after the sticky column
      const scrollPosition = currentTimePosition - (viewportWidth - stickyColumnWidth) / 2;
      gridRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
    }
  };

  const scrollToGolden = () => {
    resetInactivityTimer();
    if (gridRef.current && bestSlotIndex !== null) {
      const slotWidth = 64; // w-16 = 64px
      const stickyColumnWidth = 288; // w-72 = 288px
      const viewportWidth = gridRef.current.clientWidth;
      // Center in the visible area after the sticky column
      const scrollPosition = bestSlotIndex * slotWidth - (viewportWidth - stickyColumnWidth) / 2;
      gridRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
    }
  };

  // Multi-select handlers
  const handleSlotMouseDown = (slotIndex: number) => {
    setIsSelecting(true);
    setSelectionStart(slotIndex);
    setSelectionEnd(slotIndex);
  };

  const handleSlotMouseMove = (slotIndex: number) => {
    if (isSelecting) {
      setSelectionEnd(slotIndex);
    }
  };

  const handleSlotMouseUp = () => {
    setIsSelecting(false);
    // Show panel when selection is complete
    if (selectionStart !== null && selectionEnd !== null) {
      setShowSelectionPanel(true);
    }
  };

  const handleGridMouseLeave = () => {
    if (isSelecting) {
      setIsSelecting(false);
    }
  };

  // Global mouseup listener to ensure selection clears even if mouse up happens outside grid
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        setIsSelecting(false);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isSelecting]);

  const clearSelection = useCallback(() => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setShowSelectionPanel(false);
  }, []);

  // Generate share text for clipboard
  const generateShareText = useCallback(() => {
    if (!selectionDetails) return '';

    const lines = selectionDetails.cityDetails.map(d =>
      `${d.city.flag} ${d.city.name}: ${d.startTime} – ${d.endTime} (${d.points}pt)`
    );
    return [
      `🏆 Meeting Time (${selectionDetails.durationFormatted})`,
      '',
      ...lines,
      '',
      `📊 Total Sacrifice: ${selectionDetails.totalPoints}pts`,
      '',
      '⚡ Found with ClockAlign - Fair meetings for global teams',
      'https://clockalign.app/finder',
    ].join('\n');
  }, [selectionDetails]);

  // Generate tweet text (shorter for Twitter)
  const generateTweetText = useCallback(() => {
    if (!selectionDetails) return '';

    const topScorers = selectionDetails.cityDetails
      .sort((a, b) => b.points - a.points)
      .slice(0, 3)
      .map(d => `${d.city.flag}${d.points}pt`)
      .join(' | ');

    return [
      `🏆 Meeting sacrifice: ${topScorers}`,
      '',
      `Total: ${selectionDetails.totalPoints}pts`,
      selectionDetails.shouldSuggestAsync ? '💡 Consider async!' : '',
      '',
      'Find fair meeting times at @clockalign',
    ].filter(Boolean).join('\n');
  }, [selectionDetails]);

  const copySelectionToClipboard = useCallback(() => {
    if (!selectionDetails) return;

    const text = generateShareText();
    navigator.clipboard.writeText(text);
  }, [selectionDetails, generateShareText]);

  const shareToTwitter = useCallback(() => {
    if (!selectionDetails) return;

    const text = encodeURIComponent(generateTweetText());
    const url = encodeURIComponent('https://clockalign.app/finder');
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
      'width=550,height=420'
    );
  }, [selectionDetails, generateTweetText]);

  const shareNative = useCallback(async () => {
    if (!selectionDetails) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meeting Times from ClockAlign',
          text: generateShareText(),
          url: 'https://clockalign.app/finder',
        });
      } catch {
        // User cancelled, fallback to copy
        copySelectionToClipboard();
      }
    } else {
      copySelectionToClipboard();
    }
  }, [selectionDetails, generateShareText, copySelectionToClipboard]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white text-lg">ClockAlign</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm -mt-0.5">Fair meeting times</p>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button className="h-9 px-3 rounded-full border border-slate-200 dark:border-slate-600 flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
              <Share2 className="w-4 h-4" />
              Share
            </button>

            <button
              onClick={scrollToNow}
              className="h-9 px-3 rounded-full border border-slate-200 dark:border-slate-600 flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              Now
            </button>

            <button
              onClick={scrollToGolden}
              className="h-9 px-3 rounded-full border border-slate-200 dark:border-slate-600 flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Golden
            </button>

            <button
              onClick={() => setUse12Hour(!use12Hour)}
              className={cn(
                "h-9 px-3 rounded-full border flex items-center text-sm font-medium transition-colors",
                use12Hour
                  ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-400"
                  : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              12h
            </button>

            <Link href="/login">
              <button className="h-9 px-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow-lg shadow-primary/20 transition-colors">
                Sign up free
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 border border-transparent focus-within:border-slate-300 dark:focus-within:border-slate-600 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Add city or timezone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className="bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 w-full text-sm"
            />
          </div>

          <AnimatePresence>
            {searchFocused && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                {searchResults.map((city) => (
                  <button
                    key={`${city.name}-${city.country}`}
                    onClick={() => addCity(city)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                  >
                    <span className="text-xl">{countryToFlag(city.countryCode)}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-slate-900 dark:text-white font-medium">{city.name}</span>
                      <span className="text-slate-500 ml-2 text-sm">{city.country}</span>
                    </div>
                    <span className="text-slate-400 text-sm font-mono">
                      {DateTime.now().setZone(city.timezone).toFormat('HH:mm')}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* City Chips */}
        <div className="flex flex-wrap items-center gap-2">
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
                  className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-3 pr-1.5 py-1.5 shadow-sm"
                >
                  <span className="text-base">{city.flag}</span>
                  <span className="text-slate-900 dark:text-white font-medium text-sm">{city.name}</span>
                  {displayOffset !== null && displayOffset !== 0 && (
                    <span className="text-primary text-xs font-semibold">
                      {formatRelativeOffset(displayOffset)}
                    </span>
                  )}
                  <button
                    onClick={() => removeCity(city.id)}
                    className="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <button
            onClick={() => searchInputRef.current?.focus()}
            className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
          >
            + Add city
          </button>
        </div>

        {/* Alert Banner */}
        {cities.length >= 2 && !overlapInfo.hasOverlap && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <div className="flex items-center gap-6">
              {/* Warning Icon and Text */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-slate-900 dark:text-white font-semibold text-sm">No golden overlap possible</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    {overlapInfo.spreadHours.toFixed(1)}h spread is too wide for everyone to be in peak hours
                  </p>
                </div>
              </div>

              {/* Split Calls Toggle Button OR Expanded Box */}
              {splitRecommendation && canShowSplitCalls && !showSplitCalls && (
                <button
                  onClick={() => {
                    resetInactivityTimer();
                    setShowSplitCalls(true);
                  }}
                  className="px-4 py-2 bg-primary/10 rounded-xl border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors whitespace-nowrap"
                >
                  Split into {splitRecommendation.totalCalls} calls?
                </button>
              )}

              {/* Expanded Split Calls Box - shown after clicking button */}
              {splitRecommendation && canShowSplitCalls && showSplitCalls && (
                <div className="px-5 py-3 bg-primary/10 rounded-xl border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-primary">
                      Split into {splitRecommendation.totalCalls} calls:
                    </p>
                    <button
                      onClick={() => {
                        setShowSplitCalls(false);
                        setSelectedCallIndex(null);
                      }}
                      className="w-5 h-5 rounded-full hover:bg-primary/20 flex items-center justify-center text-primary"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {splitRecommendation.calls.map((call, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          resetInactivityTimer();
                          setSelectedCallIndex(selectedCallIndex === idx ? null : idx);
                        }}
                        className={cn(
                          "flex items-center gap-3 py-1 px-2 -mx-2 w-full text-left rounded transition-colors",
                          selectedCallIndex === idx
                            ? "bg-primary/20"
                            : "hover:bg-primary/10"
                        )}
                      >
                        <span className="text-slate-500 dark:text-slate-400 text-xs font-medium whitespace-nowrap">
                          Call {idx + 1}:
                        </span>
                        <div className="flex items-center gap-3">
                          {call.localTimes.map((lt) => (
                            <span key={lt.city.id} className="flex items-center gap-1 whitespace-nowrap">
                              <span className="text-sm">{lt.city.flag}</span>
                              <span className="text-xs text-slate-700 dark:text-slate-300">
                                {lt.displayTime}
                              </span>
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Locked Split Calls - for future dates */}
              {splitRecommendation && !canShowSplitCalls && (
                <Link href="/login" className="flex-shrink-0">
                  <div className="px-4 py-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Split calls (unlock)
                    </span>
                  </div>
                </Link>
              )}

              {/* Right side: Spread indicator only */}
              <div className="flex items-center gap-2 ml-auto">
                <Globe className="w-4 h-4 text-slate-400" />
                <span className="text-slate-900 dark:text-white font-medium text-sm whitespace-nowrap">{overlapInfo.spreadHours.toFixed(1)}h spread</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium">Wide</span>
                <button className="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400">
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Date Picker Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousDay}
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNextDay}
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {weekDays.map((day, index) => (
              <button
                key={index}
                onClick={() => {
                  resetInactivityTimer();
                  setSelectedDate(day.date);
                }}
                className={cn(
                  "flex flex-col items-center px-4 py-2 rounded-lg transition-colors min-w-[52px]",
                  day.isSelected
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : day.isToday
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                )}
              >
                <span className="text-xs font-medium">{day.dayName}</span>
                <span className="text-base font-bold">{day.dayNum}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="h-9 px-4 rounded-full border border-primary/20 bg-primary/5 text-primary font-medium text-sm flex items-center gap-2 hover:bg-primary/10 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Today
            </button>
            <button className="h-9 px-4 rounded-full border border-primary/20 bg-primary/5 text-primary font-medium text-sm flex items-center gap-2 hover:bg-primary/10 transition-colors">
              <Calendar className="w-4 h-4" />
              Unlock Calendar
            </button>
          </div>
        </div>

        {/* Energy Legend */}
        <div className="flex items-center gap-5 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Energy:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-300 dark:bg-emerald-700" />
            <span className="text-slate-600 dark:text-slate-300">Peak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-yellow-300 dark:bg-yellow-600" />
            <span className="text-slate-600 dark:text-slate-300">OK</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-orange-300 dark:bg-orange-600" />
            <span className="text-slate-600 dark:text-slate-300">Early/Late</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-violet-300 dark:bg-violet-700" />
            <span className="text-slate-600 dark:text-slate-300">Night</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700" />
            <span className="text-slate-600 dark:text-slate-300">Sleep</span>
          </div>
        </div>

        {/* Time Grid */}
        {cities.length > 0 ? (
          <div className="rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            {/* Best Overlap Header */}
            {cities.length >= 2 && (
              <div className="flex items-center gap-6 px-4 py-3 bg-gradient-to-r from-slate-50 to-emerald-50 dark:from-slate-800 dark:to-emerald-900/20 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Best overlap</span>
                </div>
                {!overlapInfo.hasOverlap && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>{overlapInfo.spreadHours.toFixed(1)}h timezone spread — no time when everyone is in golden hours</span>
                  </div>
                )}
              </div>
            )}

            <div
              ref={gridRef}
              className="overflow-x-auto scrollbar-visible"
              style={{ scrollbarWidth: 'thin' }}
            >
              <div className="min-w-[6450px] relative">
                {cities.map((city, cityIndex) => {
                  const currentLocalTime = DateTime.now().setZone(city.timezone);
                  const offset = cityIndex > 0 ? calculateRelativeOffset(city.timezone, cities[0].timezone) : null;

                  // Determine if this city row should be dimmed based on selected call
                  // Use localTimes (cities that can attend) rather than participants (cities newly assigned)
                  const isDimmed = selectedCallIndex !== null &&
                    splitRecommendation &&
                    canShowSplitCalls &&
                    !splitRecommendation.calls[selectedCallIndex]?.localTimes.some(lt => lt.city.id === city.id);

                  return (
                    <div
                      key={city.id}
                      className={cn(
                        'flex transition-opacity duration-300',
                        isDimmed && 'opacity-30'
                      )}
                    >
                      {/* City Label - sticky so it doesn't scroll with time grid */}
                      <div className="w-72 flex-shrink-0 h-16 px-5 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 sticky left-0 z-10 flex items-center">
                        <div className="flex items-center w-full">
                          <span className="text-3xl flex-shrink-0 mr-4">{city.flag}</span>
                          <div className="flex-shrink-0">
                            <div className="font-semibold text-slate-900 dark:text-white text-base">{city.name}</div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <span>{currentLocalTime.toFormat('ZZZZ')}</span>
                              {offset !== null && offset !== 0 && (
                                <span className="text-primary font-semibold">{formatRelativeOffset(offset)}</span>
                              )}
                            </div>
                          </div>
                          <div className="ml-auto pl-4">
                            <div className="text-lg font-semibold text-slate-900 dark:text-white whitespace-nowrap tabular-nums">
                              {currentLocalTime.toFormat(use12Hour ? 'h:mm' : 'HH:mm')}<span className="text-sm ml-0.5">{currentLocalTime.toFormat('a')}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Time Slots */}
                      <div className="flex relative" onMouseLeave={handleGridMouseLeave}>
                        {timeSlots.map((slot) => {
                          const localDateTime = slot.utcDateTime.setZone(city.timezone);
                          const localHour = localDateTime.hour;
                          const localMinute = localDateTime.minute;
                          const energy = getSlotEnergyLevel(slot.utcDateTime, city.timezone);
                          const isBestSlot = slot.index === bestSlotIndex;
                          const isMidnight = localHour === 0 && localMinute === 0;
                          const is6AM = localHour === 6 && localMinute === 0;
                          const isNight = energy === 'night' || energy === 'sleep';

                          // Calculate display values for the ACTUAL local time
                          const displayPeriod = localHour < 12 ? 'AM' : 'PM';
                          const displayHour12 = localHour % 12 || 12;

                          return (
                            <div
                              key={slot.index}
                              data-time-slot={slot.index}
                              onMouseDown={() => handleSlotMouseDown(slot.index)}
                              onMouseMove={() => handleSlotMouseMove(slot.index)}
                              onMouseUp={handleSlotMouseUp}
                              className={cn(
                                'w-16 flex-shrink-0 h-16 flex flex-col items-center justify-center text-xs transition-all relative cursor-pointer hover:opacity-90 select-none',
                                ENERGY_COLORS[energy],
                                ENERGY_TEXT_COLORS[energy],
                                isBestSlot && 'ring-2 ring-inset ring-emerald-500'
                              )}
                            >
                              {/* Date marker */}
                              {(isMidnight || is6AM) && (
                                <div className="absolute top-0.5 left-1 text-[9px] font-medium opacity-70">
                                  {localDateTime.toFormat('LLL d')}
                                </div>
                              )}

                              {/* Time display - Full hours bold, half hours smaller with :30 */}
                              {localMinute === 0 ? (
                                <span className="font-bold text-sm">
                                  {use12Hour ? `${displayHour12} ${displayPeriod}` : `${localHour}:00`}
                                </span>
                              ) : (
                                <span className="font-medium opacity-70 text-[11px]">
                                  {use12Hour ? `${displayHour12}:30 ${displayPeriod}` : `${localHour}:30`}
                                </span>
                              )}

                              {/* Night indicator */}
                              {isNight && (
                                <Moon className="w-3 h-3 mt-0.5 opacity-50" />
                              )}
                            </div>
                          );
                        })}

                        {/* Current Time Indicator */}
                        {currentTimePosition !== null && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 pointer-events-none"
                            style={{ left: `${currentTimePosition}px` }}
                          >
                            {cityIndex === 0 && (
                              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-400 border-2 border-white dark:border-slate-800" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Selection Overlay - spans ALL city rows */}
                {selectionRange && cities.length > 0 && (
                  <div
                    className="absolute pointer-events-none z-20"
                    style={{
                      left: `${288 + selectionRange.start * 64}px`, // 288px = w-72 sticky column, 64px = w-16 per slot
                      top: 0,
                      width: `${(selectionRange.end - selectionRange.start + 1) * 64}px`,
                      height: `${cities.length * 64}px`, // 64px (h-16) per row
                    }}
                  >
                    {/* Semi-transparent fill with border */}
                    <div className="absolute inset-0 bg-blue-500/15 border-2 border-blue-500 rounded-lg" />
                    {/* Top handle indicator showing duration */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs rounded-full font-semibold whitespace-nowrap shadow-lg">
                      {selectionDetails?.durationFormatted || `${(selectionRange.end - selectionRange.start + 1) * 30}m`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center bg-white dark:bg-slate-800">
            <Users className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Add cities to compare</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Search and add the cities you want to find meeting times for.
            </p>
            <button
              onClick={() => searchInputRef.current?.focus()}
              className="h-10 px-5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm inline-flex items-center gap-2 transition-colors"
            >
              <Search className="w-4 h-4" />
              Add Your First City
            </button>
          </div>
        )}

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Fairness Leaderboard</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Track who&apos;s sacrificing most. Rotate meeting times so it&apos;s not always the same person waking up early.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Async Suggestions</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Smart nudges when a Loom or doc would work better. Track hours reclaimed by going async.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-violet-500" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Energy Optimization</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Find times when everyone is cognitively sharp, not just awake. Based on chronotype research.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Fair scheduling for your whole team
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Join 10,000+ remote teams making timezone pain visible and rotating it fairly.
          </p>
          <Link href="/login">
            <button className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 inline-flex items-center gap-2 transition-colors">
              Get Started Free
              <ChevronRight className="w-5 h-5" />
            </button>
          </Link>
          <p className="text-slate-400 text-sm mt-4">
            Free forever for teams up to 5 • No credit card required
          </p>
        </div>
      </main>

      {/* Selection Details Panel */}
      <AnimatePresence>
        {showSelectionPanel && selectionDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20, x: 20 }}
            className="fixed bottom-6 right-6 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectionDetails.durationFormatted}
                </span>
              </div>
              <button
                onClick={clearSelection}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* City List */}
            <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
              {selectionDetails.cityDetails.map(detail => (
                <div key={detail.city.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{detail.city.flag}</span>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white text-sm">{detail.city.name}</div>
                      <div className="text-xs text-slate-500">{detail.startTime} – {detail.endTime}</div>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold",
                    getCategoryColorClasses(detail.category)
                  )}>
                    {detail.points}pt
                  </span>
                </div>
              ))}
            </div>

            {/* Sacrifice Score */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Sacrifice Score</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{selectionDetails.totalPoints} pts</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (selectionDetails.totalPoints / 30) * 100)}%` }}
                />
              </div>
            </div>

            {/* Async Suggestion */}
            {selectionDetails.shouldSuggestAsync && (
              <div className="mx-4 mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700/50">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">Consider Async?</span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                  With {selectionDetails.totalPoints}pts sacrifice, a recorded video or Loom might save everyone&apos;s energy.
                </p>
              </div>
            )}

            {/* Share Buttons */}
            <div className="px-4 pb-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Share Times</p>
              <div className="flex gap-2">
                <button
                  onClick={copySelectionToClipboard}
                  className="flex-1 h-9 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
                <button
                  onClick={shareToTwitter}
                  className="flex-1 h-9 border border-sky-200 dark:border-sky-800 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors text-sky-600 dark:text-sky-400"
                >
                  Tweet
                </button>
                <button
                  onClick={shareNative}
                  className="flex-1 h-9 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>

            {/* CTA Button */}
            <div className="p-4 pt-0">
              <Link href="/login">
                <button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors shadow-lg shadow-primary/20">
                  Schedule & Track Fairness
                </button>
              </Link>
              <p className="text-xs text-slate-400 text-center mt-2">Free forever • No credit card required</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 py-6 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>Made with ❤️ for distributed teams</span>
          <span>•</span>
          <Link href="#" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            Privacy
          </Link>
          <span>•</span>
          <Link href="#" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
