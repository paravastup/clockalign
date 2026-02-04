'use client'

/**
 * Sacrifice Score Calculator - Public Lead Magnet
 * CA-GTM: Standalone tool for viral marketing
 *
 * A simple, focused tool that calculates sacrifice scores
 * and generates shareable cards to drive signups.
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { DateTime } from 'luxon'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Clock,
  Search,
  X,
  Plus,
  ChevronRight,
  Sparkles,
  Globe,
  Users,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  searchCities,
  worldCityToCity,
  countryToFlag,
  type WorldCity,
} from '@/lib/cities-database'
import {
  calculateScoreForTimezone,
  calculateMeetingTotalSacrifice,
  formatPoints,
  type SacrificeScoreResult,
  type SacrificeCategory,
} from '@/lib/sacrifice-score'
import {
  ShareableScoreCard,
  type ParticipantScore,
} from '@/components/sacrifice/shareable-score-card'
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics/posthog'

// ============================================
// TYPES
// ============================================

interface City {
  id: string
  name: string
  country: string
  timezone: string
  flag: string
}

// ============================================
// DEFAULT CITIES
// ============================================

const DEFAULT_CITIES: City[] = [
  {
    id: 'tokyo-japan',
    name: 'Tokyo',
    country: 'Japan',
    timezone: 'Asia/Tokyo',
    flag: '🇯🇵',
  },
  {
    id: 'new-york-usa',
    name: 'New York',
    country: 'United States',
    timezone: 'America/New_York',
    flag: '🇺🇸',
  },
  {
    id: 'london-uk',
    name: 'London',
    country: 'United Kingdom',
    timezone: 'Europe/London',
    flag: '🇬🇧',
  },
]

// ============================================
// MAIN COMPONENT
// ============================================

export default function SacrificeCalculator() {
  const [mounted, setMounted] = useState(false)
  const [cities, setCities] = useState<City[]>(DEFAULT_CITIES)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WorldCity[]>([])
  const [searchFocused, setSearchFocused] = useState(false)
  const [meetingHour, setMeetingHour] = useState(14) // 2 PM UTC
  const [meetingMinute, setMeetingMinute] = useState(0)
  const [duration, setDuration] = useState(60) // 60 minutes
  const [showResults, setShowResults] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    trackEvent(ANALYTICS_EVENTS.CALCULATOR_USED, {
      initial_cities: DEFAULT_CITIES.length,
    })
  }, [])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = searchCities(searchQuery, 6)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const addCity = (worldCity: WorldCity) => {
    const city: City = {
      id: `${worldCity.name.toLowerCase()}-${worldCity.countryCode.toLowerCase()}`,
      name: worldCity.name,
      country: worldCity.country,
      timezone: worldCity.timezone,
      flag: countryToFlag(worldCity.countryCode),
    }

    if (!cities.find((c) => c.id === city.id)) {
      setCities((prev) => [...prev, city])
    }
    setSearchQuery('')
    setSearchFocused(false)
  }

  const removeCity = (cityId: string) => {
    setCities((prev) => prev.filter((c) => c.id !== cityId))
  }

  // Calculate scores
  const scores = useMemo(() => {
    if (cities.length === 0) return null

    const utcTime = DateTime.utc().set({
      hour: meetingHour,
      minute: meetingMinute,
    })

    const participantScores: (SacrificeScoreResult & { city: City; localTime: string })[] =
      cities.map((city) => {
        const score = calculateScoreForTimezone(utcTime, city.timezone, {
          durationMinutes: duration,
        })
        const localTime = utcTime.setZone(city.timezone).toFormat('h:mm a')

        return {
          ...score,
          city,
          localTime,
        }
      })

    const totals = calculateMeetingTotalSacrifice(participantScores)

    return {
      participants: participantScores,
      ...totals,
    }
  }, [cities, meetingHour, meetingMinute, duration])

  // Format for shareable card
  const participantScoresForCard: ParticipantScore[] = useMemo(() => {
    if (!scores) return []

    return scores.participants.map((p) => ({
      id: p.city.id,
      name: p.city.name,
      city: p.city.name,
      flag: p.city.flag,
      timezone: p.city.timezone,
      localTime: p.localTime,
      points: p.points,
      category: p.category,
    }))
  }, [scores])

  const handleCalculate = () => {
    if (cities.length < 2) return

    setShowResults(true)
    trackEvent(ANALYTICS_EVENTS.CALCULATOR_USED, {
      city_count: cities.length,
      meeting_hour_utc: meetingHour,
      duration_minutes: duration,
      total_score: scores?.totalPoints,
    })
  }

  const handleSignupClick = () => {
    trackEvent(ANALYTICS_EVENTS.CALCULATOR_SIGNUP_CLICKED, {
      city_count: cities.length,
      total_score: scores?.totalPoints,
    })
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white text-lg">ClockAlign</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm -mt-0.5">
                Sacrifice Calculator
              </p>
            </div>
          </Link>

          <Link href="/login" onClick={handleSignupClick}>
            <Button className="gap-2">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 mb-6"
          >
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
              Free Tool
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4"
          >
            Meeting Sacrifice Score
            <br />
            <span className="text-primary">Calculator</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            Find out who&apos;s sacrificing the most for your global team meetings.
            <br />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Stop making Tokyo take the midnight calls.
            </span>
          </motion.p>
        </div>

        {/* Calculator Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 md:p-8 mb-8"
        >
          {/* Cities Section */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              <Users className="w-4 h-4 inline mr-2" />
              Participants (Add 2+ cities)
            </label>

            {/* City Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              <AnimatePresence mode="popLayout">
                {cities.map((city) => (
                  <motion.div
                    key={city.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    layout
                    className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full pl-3 pr-1.5 py-1.5"
                  >
                    <span className="text-lg">{city.flag}</span>
                    <span className="text-slate-900 dark:text-white font-medium text-sm">
                      {city.name}
                    </span>
                    <button
                      onClick={() => removeCity(city.id)}
                      className="w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Search Input */}
            <div className="relative">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 border border-transparent focus-within:border-primary focus-within:bg-white dark:focus-within:bg-slate-800 transition-all">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Add city (e.g., Berlin, Mumbai, Sydney...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  className="bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 w-full"
                />
              </div>

              <AnimatePresence>
                {searchFocused && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {searchResults.map((city) => (
                      <button
                        key={`${city.name}-${city.country}`}
                        onClick={() => addCity(city)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                      >
                        <span className="text-xl">{countryToFlag(city.countryCode)}</span>
                        <div className="flex-1">
                          <span className="text-slate-900 dark:text-white font-medium">
                            {city.name}
                          </span>
                          <span className="text-slate-500 ml-2 text-sm">{city.country}</span>
                        </div>
                        <Plus className="w-5 h-5 text-primary" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Meeting Time Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                <Clock className="w-4 h-4 inline mr-2" />
                Meeting Time (UTC)
              </label>
              <div className="flex gap-2">
                <select
                  value={meetingHour}
                  onChange={(e) => setMeetingHour(parseInt(e.target.value))}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
                <select
                  value={meetingMinute}
                  onChange={(e) => setMeetingMinute(parseInt(e.target.value))}
                  className="w-24 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                >
                  <option value={0}>:00</option>
                  <option value={30}>:30</option>
                </select>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Currently: {DateTime.utc().set({ hour: meetingHour, minute: meetingMinute }).toFormat('h:mm a')} UTC
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          {/* Calculate Button */}
          <Button
            size="lg"
            className="w-full h-14 text-lg gap-3"
            onClick={handleCalculate}
            disabled={cities.length < 2}
          >
            <Sparkles className="w-5 h-5" />
            Calculate Sacrifice Score
            <ChevronRight className="w-5 h-5" />
          </Button>

          {cities.length < 2 && (
            <p className="text-center text-sm text-slate-500 mt-3">
              Add at least 2 cities to calculate
            </p>
          )}
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {showResults && scores && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
            >
              <ShareableScoreCard
                title="Meeting Sacrifice Score"
                subtitle={`${duration} minute meeting at ${DateTime.utc().set({ hour: meetingHour, minute: meetingMinute }).toFormat('h:mm a')} UTC`}
                participants={participantScoresForCard}
                totalScore={scores.totalPoints}
                fairnessIndex={scores.fairnessIndex}
                meetingDuration={`${duration}m`}
                variant="full"
              />

              {/* Imbalance Warning */}
              {scores.imbalanceWarning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      Imbalance Detected
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {scores.imbalanceWarning}. Consider rotating meeting times to distribute
                      the sacrifice more fairly.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8 text-center"
              >
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-8 border border-primary/20">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Track fairness over time
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    ClockAlign automatically tracks who&apos;s sacrificing the most and helps you
                    rotate meeting times fairly.
                  </p>
                  <Link href="/login" onClick={handleSignupClick}>
                    <Button size="lg" className="gap-2">
                      Start Tracking for Free
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <p className="text-xs text-slate-500 mt-3">
                    Free forever for teams up to 5 • No credit card required
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
            How Sacrifice Score Works
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <span className="text-2xl">😊</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Golden Hours (1pt)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                10 AM - 4 PM local time. Peak productivity, minimal sacrifice.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                <span className="text-2xl">😐</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Edge Hours (2-4pts)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Early morning or evening. Personal time affected.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <span className="text-2xl">💀</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Graveyard (10pts)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                11 PM - 7 AM local time. Severe impact on health and life.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center border-t border-slate-200 dark:border-slate-700 pt-12"
        >
          <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Calendly schedules a meeting.
            <br />
            ClockAlign schedules a team.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Fair meetings for global teams.
          </p>
          <Link href="/login" onClick={handleSignupClick}>
            <Button size="lg" variant="outline" className="gap-2">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-center gap-2 text-sm text-slate-500">
          <span>Made with ❤️ for distributed teams</span>
          <span>•</span>
          <Link href="/" className="hover:text-slate-700 dark:hover:text-slate-300">
            clockalign.app
          </Link>
        </div>
      </footer>
    </div>
  )
}
