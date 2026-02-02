'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Globe, Clock, Users, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

  const scrollToScheduler = () => {
    document.getElementById('scheduler')?.scrollIntoView({ behavior: 'smooth' });
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border shadow-soft mb-8"
        >
          <Sparkles className="w-4 h-4 text-[hsl(var(--brand))]" />
          <span className="text-sm text-muted-foreground">Fair meetings for global teams</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-6 text-foreground"
        >
          Schedule meetings that are
          <br />
          <span className="text-gradient">fair for everyone</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          ClockAlign is a timezone-aware meeting scheduler that optimizes for 
          <span className="text-foreground font-medium"> fairness</span>, 
          <span className="text-foreground font-medium"> cognitive sharpness</span>, and 
          <span className="text-foreground font-medium"> meeting necessity</span>—not just availability.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-16"
        >
          <Link href="/finder">
            <Button
              size="lg"
              className="bg-[hsl(var(--brand))] hover:bg-[hsl(173_58%_35%)] text-white font-medium px-6 h-12"
            >
              Try Fair Time Finder
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="border-border hover:bg-secondary font-medium px-6 h-12"
          >
            See How It Works
          </Button>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-2"
        >
          <FeaturePill icon={<Clock className="w-4 h-4" />} text="Sacrifice Score" />
          <FeaturePill icon={<Globe className="w-4 h-4" />} text="Golden Windows" />
          <FeaturePill icon={<Users className="w-4 h-4" />} text="Async Nudge" />
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

function FeaturePill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border shadow-soft text-sm">
      <span className="text-[hsl(var(--brand))]">{icon}</span>
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}
