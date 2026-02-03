'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Sun, Moon, Cloud, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface WelcomeHeaderProps {
  firstName: string;
  timezone?: string;
}

export function WelcomeHeader({ firstName, timezone }: WelcomeHeaderProps) {
  const now = new Date();
  const hour = now.getHours();
  
  // Determine time of day and appropriate icon
  let greeting = 'Good evening';
  let Icon = Moon;

  if (hour >= 5 && hour < 12) {
    greeting = 'Good morning';
    Icon = Sun;
  } else if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
    Icon = Cloud;
  } else if (hour >= 17 && hour < 21) {
    greeting = 'Good evening';
    Icon = Cloud;
  }

  const timeString = format(now, 'EEEE, MMMM d');

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm"
    >
      {/* Decorative gradient orb */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-muted opacity-50 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-muted opacity-50 blur-2xl" />
      
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6">
        <div className="flex items-start gap-4">
          {/* Animated icon container */}
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="p-3 rounded-2xl bg-muted"
          >
            <Icon className="w-6 h-6 text-muted-foreground" />
          </motion.div>
          
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
            >
              {greeting}, {firstName}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-sm text-muted-foreground mt-1 flex items-center gap-2"
            >
              <span>{timeString}</span>
              {timezone && (
                <>
                  <span className="text-border">•</span>
                  <span className="text-[hsl(var(--brand))]">{timezone.replace(/_/g, ' ')}</span>
                </>
              )}
            </motion.p>
          </div>
        </div>

        {/* Timezone button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Button
            variant="outline"
            size="sm"
            asChild
            className="bg-card/80 backdrop-blur-sm border-border hover:border-[hsl(var(--brand))]/40 hover:text-[hsl(var(--brand))] transition-all"
          >
            <Link href="/settings">
              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
              {timezone ? 'Change timezone' : 'Set timezone'}
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[hsl(var(--brand))] opacity-30" />
    </motion.div>
  );
}
