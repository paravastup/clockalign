'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

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

export function OnboardingChecklist({
  tasks,
  completedCount,
  totalCount,
}: OnboardingChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const progress = (completedCount / totalCount) * 100;

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
          <div>
            <motion.h3
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-500 text-white text-xs">
                {completedCount}
              </span>
              <span>of {totalCount} steps completed</span>
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-slate-600 dark:text-slate-400 mt-1"
            >
              Complete these steps to get the most out of ClockAlign
            </motion.p>
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

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6"
        >
          <Progress 
            value={progress} 
            className="h-2 bg-teal-100 dark:bg-teal-900/30"
          />
        </motion.div>

        {/* Tasks */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: 0.1 * index }}
                layout
              >
                {task.completed ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-teal-100 dark:border-teal-800/30">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </motion.div>
                    <span className="flex-1 text-sm font-medium text-slate-600 dark:text-slate-400 line-through">
                      {task.label}
                    </span>
                  </div>
                ) : (
                  <Link href={task.href}>
                    <motion.div
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700/50 shadow-sm hover:shadow-md hover:border-teal-300 dark:hover:border-teal-600 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-teal-300 dark:border-teal-600 group-hover:border-teal-500 dark:group-hover:border-teal-400 transition-colors">
                        <span className="w-2 h-2 rounded-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {task.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  </Link>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Completion message */}
        {completedCount === totalCount && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-center"
          >
            <p className="font-semibold">🎉 You're all set!</p>
            <p className="text-sm opacity-90 mt-1">
              You've completed all the onboarding steps. Start scheduling fair meetings!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
