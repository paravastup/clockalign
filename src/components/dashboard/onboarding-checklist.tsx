'use client';

import { Check, X, ChevronRight, Globe, Users, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface OnboardingTask {
  id: string;
  label: string;
  completed: boolean;
  href: string;
}

interface OnboardingChecklistProps {
  tasks: OnboardingTask[];
  completedCount: number;
  totalCount: number;
}

// Task metadata with icons
const taskMeta: Record<string, { icon: typeof Globe; duration: string }> = {
  timezone: { icon: Globe, duration: '2 min' },
  team: { icon: Users, duration: '5 min' },
  meeting: { icon: Calendar, duration: '3 min' },
};

export function OnboardingChecklist({
  tasks,
  completedCount,
  totalCount,
}: OnboardingChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const progress = (completedCount / totalCount) * 100;
  const allComplete = completedCount === totalCount;

  if (isDismissed) return null;

  return (
    <div className="p-5 rounded-2xl bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            Getting started
          </span>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-muted mb-5 overflow-hidden">
        <div
          className="h-full rounded-full bg-[hsl(var(--brand))] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Tasks */}
      <div className="space-y-1">
        {tasks.map((task) => {
          const meta = taskMeta[task.id] || { icon: Globe, duration: '' };
          const Icon = meta.icon;

          if (task.completed) {
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2 text-muted-foreground"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
                <span className="text-sm line-through">{task.label}</span>
              </div>
            );
          }

          return (
            <Link key={task.id} href={task.href} className="group block">
              <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 group-hover:border-[hsl(var(--brand))] transition-colors" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground group-hover:text-[hsl(var(--brand))] transition-colors">
                    {task.label}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ~{meta.duration}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Completion message */}
      {allComplete && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Check className="w-4 h-4" />
            All set! Ready to schedule fair meetings.
          </div>
        </div>
      )}
    </div>
  );
}
