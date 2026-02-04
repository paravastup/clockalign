'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Globe, Clock, Users, ArrowRight, Sparkles, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics/posthog';

export function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left - rect.width / 2) / 60,
          y: (e.clientY - rect.top - rect.height / 2) / 60,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handlePrimaryCTA = () => {
    trackEvent(ANALYTICS_EVENTS.LANDING_CTA_CLICKED, {
      cta_type: 'hero_primary',
      cta_text: 'Try Fair Time Finder',
    });
  };

  const handleSecondaryCTA = () => {
    trackEvent(ANALYTICS_EVENTS.LANDING_CTA_CLICKED, {
      cta_type: 'hero_secondary',
      cta_text: 'See How It Works',
    });
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero"
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0">
        {/* Soft gradient orbs */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(172 60% 92% / 0.6) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          animate={{
            x: mousePosition.x * -15,
            y: mousePosition.y * -15,
          }}
          transition={{ type: 'spring', damping: 50 }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(260 80% 92% / 0.5) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            x: mousePosition.x * 12,
            y: mousePosition.y * 12,
          }}
          transition={{ type: 'spring', damping: 50 }}
        />

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `radial-gradient(hsl(172 20% 70%) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-card border border-border shadow-soft mb-8"
        >
          <Sparkles className="w-4 h-4 text-[hsl(var(--brand))]" />
          <span className="text-sm text-muted-foreground">Fair meetings for global teams</span>
        </motion.div>

        {/* Killer One-Liner */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-lg md:text-xl font-medium text-primary mb-4"
        >
          Calendly schedules a meeting. <span className="text-foreground">ClockAlign schedules a team.</span>
        </motion.p>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 text-foreground"
        >
          Stop making Tokyo take
          <br />
          <span className="text-gradient">the midnight calls</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          ClockAlign tracks who&apos;s sacrificing for meetings, optimizes for
          <span className="text-foreground font-medium"> cognitive energy</span>, and tells you when
          <span className="text-foreground font-medium"> async is better</span>—not just when calendars overlap.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-6"
        >
          <Link href="/finder" onClick={handlePrimaryCTA}>
            <Button
              size="lg"
              className="bg-[hsl(var(--brand))] hover:bg-[hsl(173_58%_35%)] text-white font-medium px-6 h-12"
            >
              Try Fair Time Finder
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/calculator" onClick={() => trackEvent(ANALYTICS_EVENTS.LANDING_CTA_CLICKED, { cta_type: 'hero_calculator' })}>
            <Button
              size="lg"
              variant="outline"
              className="border-border hover:bg-secondary font-medium px-6 h-12 gap-2"
            >
              <Calendar className="w-4 h-4" />
              Calculate Sacrifice Score
            </Button>
          </Link>
        </motion.div>

        {/* Secondary CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <button
            onClick={handleSecondaryCTA}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            See how it works ↓
          </button>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-2 mt-12"
        >
          <FeaturePill icon={<Clock className="w-4 h-4" />} text="Sacrifice Score™" highlight />
          <FeaturePill icon={<Globe className="w-4 h-4" />} text="Golden Windows" />
          <FeaturePill icon={<Users className="w-4 h-4" />} text="Async Nudge" />
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

function FeaturePill({
  icon,
  text,
  highlight = false,
}: {
  icon: React.ReactNode;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-soft text-sm ${
        highlight
          ? 'bg-primary/10 border-primary/30 dark:bg-primary/20'
          : 'bg-white dark:bg-card border-border'
      }`}
    >
      <span className="text-[hsl(var(--brand))]">{icon}</span>
      <span className={highlight ? 'text-foreground font-medium' : 'text-muted-foreground'}>
        {text}
      </span>
    </div>
  );
}
