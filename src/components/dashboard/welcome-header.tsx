'use client';

import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import Link from 'next/link';

interface WelcomeHeaderProps {
  firstName: string;
  timezone?: string;
}

export function WelcomeHeader({ firstName, timezone }: WelcomeHeaderProps) {
  const now = new Date();
  const hour = now.getHours();

  // Determine greeting
  let greeting = 'Good evening';
  if (hour >= 5 && hour < 12) {
    greeting = 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
  }

  const timeString = format(now, 'EEEE, MMMM d');

  return (
    <div className="space-y-1">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
        {greeting}, {firstName}
      </h1>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{timeString}</span>
        {timezone && (
          <>
            <span className="text-border">·</span>
            <Link
              href="/settings"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              {timezone.replace(/_/g, ' ')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
