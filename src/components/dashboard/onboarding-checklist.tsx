'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronRight, Globe, Users, Calendar, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

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

// Task metadata with icons and duration estimates
const taskMeta: Record<string, { icon: typeof Globe; duration: string }> = {
  timezone: { icon: Globe, duration: '~2 min' },
  team: { icon: Users, duration: '~5 min' },
  meeting: { icon: Calendar, duration: '~3 min' },
};

export function OnboardingChecklist({
  tasks,
  completedCount,
  totalCount,
}: OnboardingChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const progress = (completedCount / totalCount) * 100;
  const allComplete = completedCount === totalCount;

  // Find the first incomplete task index
  const activeStepIndex = tasks.findIndex(task => !task.completed);

  if (isDismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 border border-teal-200 dark:border-teal-800/50 shadow-sm"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-200/20 to-emerald-200/20 dark:from-teal-500/10 dark:to-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    task.completed
                      ? 'bg-emerald-500'
                      : i === activeStepIndex
                        ? 'bg-teal-500 animate-pulse'
                        : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              ))}
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              {Math.round(progress)}% complete
            </motion.span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 -mr-2 -mt-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress bar with gradient and shimmer */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6 relative"
        >
          <div className="h-2 w-full rounded-full bg-teal-100 dark:bg-teal-900/30 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 relative"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </motion.div>
          </div>
        </motion.div>

        {/* Tasks */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {tasks.map((task, index) => {
              const meta = taskMeta[task.id] || { icon: Globe, duration: '' };
              const Icon = meta.icon;
              const isActive = index === activeStepIndex;
              const stepNumber = index + 1;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: 0.1 * index }}
                  layout
                >
                  {task.completed ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-emerald-200/50 dark:border-emerald-700/30">
                      {/* Animated checkmark */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="relative flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm"
                      >
                        <motion.div
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                        >
                          <Check className="w-4 h-4" strokeWidth={3} />
                        </motion.div>
                        {/* Subtle glow */}
                        <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-sm -z-10" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 line-through">
                          {task.label}
                        </span>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {meta.duration} · Completed
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Link href={task.href}>
                      <motion.div
                        whileHover={{ scale: 1.01, x: 4 }}
                        whileTap={{ scale: 0.99 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${
                          isActive
                            ? 'bg-white dark:bg-slate-800 border-teal-300 dark:border-teal-600 shadow-md shadow-teal-100/50 dark:shadow-teal-900/30 ring-2 ring-teal-200/50 dark:ring-teal-700/30'
                            : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50'
                        }`}
                      >
                        {/* Step number with icon */}
                        <div className={`relative flex items-center justify-center w-7 h-7 rounded-full border-2 transition-colors ${
                          isActive
                            ? 'border-teal-400 dark:border-teal-500 bg-teal-50 dark:bg-teal-900/30'
                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
                        }`}>
                          <span className={`text-xs font-bold ${
                            isActive
                              ? 'text-teal-600 dark:text-teal-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            {stepNumber}
                          </span>
                          {/* Pulse ring for active step */}
                          {isActive && (
                            <motion.div
                              initial={{ scale: 1, opacity: 0.5 }}
                              animate={{ scale: 1.5, opacity: 0 }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="absolute inset-0 rounded-full border-2 border-teal-400"
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-3.5 h-3.5 ${
                              isActive
                                ? 'text-teal-500'
                                : 'text-slate-400 dark:text-slate-500'
                            }`} />
                            <span className={`text-sm font-medium ${
                              isActive
                                ? 'text-slate-900 dark:text-slate-100'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}>
                              {task.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {meta.duration}
                          </p>
                        </div>

                        {/* Action button for active step */}
                        {isActive ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 rounded-full group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition-colors">
                            Start
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </motion.div>
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Completion celebration */}
        {allComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="mt-5 p-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 text-white relative overflow-hidden"
          >
            {/* Animated particles/sparkles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: Math.random() * 100 + '%',
                    y: '100%',
                    opacity: 0,
                    scale: 0
                  }}
                  animate={{
                    y: '-20%',
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.5],
                    rotate: [0, 180]
                  }}
                  transition={{
                    duration: 2 + Math.random(),
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: 'easeOut'
                  }}
                  className="absolute"
                >
                  <Sparkles className="w-4 h-4 text-white/60" />
                </motion.div>
              ))}
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm"
              >
                <Check className="w-5 h-5" strokeWidth={3} />
              </motion.div>
              <div>
                <p className="font-semibold text-base">You&apos;re all set!</p>
                <p className="text-sm opacity-90 mt-0.5">
                  Ready to find fair meeting times for everyone
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
