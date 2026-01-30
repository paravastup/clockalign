/**
 * Home Page
 * Landing page with redirect to dashboard if authenticated
 * Apple-inspired modern design
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-teal-50/30 to-white dark:from-zinc-950 dark:via-teal-950/20 dark:to-zinc-950 relative overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-teal-200/40 via-transparent to-transparent dark:from-teal-900/20 blur-3xl pointer-events-none" />
      
      {/* Hero Section */}
      <div className="relative max-w-6xl mx-auto px-6 py-8 md:py-12">
        {/* Navigation - Apple-style minimal */}
        <nav className="flex items-center justify-between mb-20 md:mb-32">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-500/25">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <span className="text-xl font-semibold tracking-tight bg-gradient-to-r from-teal-800 to-teal-600 dark:from-teal-200 dark:to-teal-400 bg-clip-text text-transparent">
              ClockAlign
            </span>
          </div>
          <Link href="/login">
            <Button variant="ghost" className="rounded-full px-6 font-medium text-zinc-600 dark:text-zinc-300 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-all duration-300">
              Sign In
            </Button>
          </Link>
        </nav>

        {/* Hero Content - Clean, centered, Apple-like */}
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Minimal badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Fair scheduling for global teams
            </span>
          </div>
          
          {/* Main headline - Apple-style large typography */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05]">
            <span className="text-zinc-900 dark:text-white">Schedule meetings</span>
            <br />
            <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 dark:from-teal-400 dark:via-teal-300 dark:to-emerald-400 bg-clip-text text-transparent">
              fair for everyone
            </span>
            <span className="text-zinc-900 dark:text-white">.</span>
          </h1>
          
          {/* Subheadline - Refined */}
          <p className="text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-light">
            Stop making the same people take the 6 AM calls. 
            ClockAlign tracks fairness and finds times when everyone is sharp.
          </p>

          {/* CTA Buttons - Apple-style */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/login">
              <Button className="h-14 px-10 rounded-full text-base font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xl shadow-teal-600/25 hover:shadow-teal-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 w-full sm:w-auto">
                Get Started Free
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
            <Button variant="outline" className="h-14 px-10 rounded-full text-base font-semibold bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-zinc-300/60 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-300 w-full sm:w-auto">
              Watch Demo
              <svg className="ml-2 h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Feature Cards - Apple-inspired glassmorphism */}
        <div className="mt-32 md:mt-40 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Card 1: Sacrifice Score */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-teal-500/20 to-amber-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl rounded-3xl border border-zinc-200/60 dark:border-zinc-700/40 p-8 md:p-10 hover:border-teal-300/60 dark:hover:border-teal-700/60 transition-all duration-500 hover:shadow-2xl hover:shadow-teal-500/10">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/50 dark:to-teal-800/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-7 h-7 text-teal-600 dark:text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18"/>
                  <path d="m19 9-5 5-4-4-3 3"/>
                </svg>
              </div>
              {/* Content */}
              <h3 className="text-xl font-semibold mb-3 text-zinc-900 dark:text-white">
                Sacrifice Score™
              </h3>
              <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Quantified fairness. Track who&apos;s taking the hit with a visible leaderboard that creates accountability.
              </p>
            </div>
          </div>

          {/* Card 2: Golden Windows */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl rounded-3xl border border-zinc-200/60 dark:border-zinc-700/40 p-8 md:p-10 hover:border-amber-300/60 dark:hover:border-amber-700/60 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-7 h-7 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2"/>
                  <path d="M12 20v2"/>
                  <path d="m4.93 4.93 1.41 1.41"/>
                  <path d="m17.66 17.66 1.41 1.41"/>
                  <path d="M2 12h2"/>
                  <path d="M20 12h2"/>
                  <path d="m6.34 17.66-1.41 1.41"/>
                  <path d="m19.07 4.93-1.41 1.41"/>
                </svg>
              </div>
              {/* Content */}
              <h3 className="text-xl font-semibold mb-3 text-zinc-900 dark:text-white">
                Golden Windows
              </h3>
              <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Find overlap when people are sharp, not just awake. Energy-optimized scheduling for peak performance.
              </p>
            </div>
          </div>

          {/* Card 3: Async Nudge */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl rounded-3xl border border-zinc-200/60 dark:border-zinc-700/40 p-8 md:p-10 hover:border-emerald-300/60 dark:hover:border-emerald-700/60 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-800/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                  <path d="M4 2C2.8 3.7 2 5.7 2 8"/>
                  <path d="M22 8c0-2.3-.8-4.3-2-6"/>
                </svg>
              </div>
              {/* Content */}
              <h3 className="text-xl font-semibold mb-3 text-zinc-900 dark:text-white">
                Async Nudge
              </h3>
              <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
                &quot;This meeting could be async.&quot; Smart detection to reclaim hours and reduce meeting fatigue.
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof - Minimal Apple-style */}
        <div className="mt-32 md:mt-40 text-center">
          <div className="inline-flex flex-col items-center gap-6 px-12 py-8 rounded-3xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/40 dark:border-zinc-700/40">
            <div className="flex -space-x-3">
              {['🌍', '🌎', '🌏', '🌐', '⏰'].map((emoji, i) => (
                <div 
                  key={i} 
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 border-2 border-white dark:border-zinc-700 flex items-center justify-center text-xl shadow-lg"
                  style={{ zIndex: 5 - i }}
                >
                  {emoji}
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-semibold text-zinc-900 dark:text-white">50+ Timezones</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Trusted by distributed teams worldwide</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Clean, minimal */}
      <footer className="relative border-t border-zinc-200/60 dark:border-zinc-800/60 py-10 mt-20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="text-sm">© 2025 ClockAlign</span>
          </div>
          <div className="flex gap-8">
            <Link href="#" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-300">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-300">
              Terms
            </Link>
            <Link href="#" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-300">
              Twitter
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
