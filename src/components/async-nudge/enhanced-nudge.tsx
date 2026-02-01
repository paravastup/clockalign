'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { 
  Lightbulb, 
  Video, 
  FileText, 
  BarChart3, 
  Clock, 
  Globe, 
  X, 
  Check,
  ArrowRight,
  Sparkles,
  Zap,
  Users,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AsyncAlternative {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  timeEstimate: string;
  benefits: string[];
  template?: string;
}

interface EnhancedNudgeProps {
  timezoneSpread: number;
  participants: {
    name: string;
    timezone: string;
    localTime: string;
    sacrificeScore: number;
  }[];
  meetingTitle?: string;
  onGoAsync?: (alternativeId: string) => void;
  onDismiss?: () => void;
  onScheduleAnyway?: () => void;
  className?: string;
}

const ASYNC_ALTERNATIVES: AsyncAlternative[] = [
  {
    id: 'loom',
    icon: Video,
    title: 'Record a Loom',
    description: 'Share updates via video - more personal than text, async-friendly',
    timeEstimate: '5-10 min',
    benefits: ['Preserves tone & context', 'Viewers can pause & rewind', 'No scheduling needed'],
    template: `Hi team,

I've recorded a quick Loom to share the updates we'd normally discuss in this meeting:

[LOOM_LINK]

Key points covered:
- 
- 
- 

Please watch by [DATE] and leave any questions/comments directly on the video.

Thanks!`,
  },
  {
    id: 'doc',
    icon: FileText,
    title: 'Async Document',
    description: 'Create a shared doc for collaborative input and decisions',
    timeEstimate: '15-20 min',
    benefits: ['Written record for reference', 'Time to think before responding', 'Includes everyone equally'],
    template: `## Meeting Purpose: [TITLE]

### Context
[Background information]

### Key Questions
1. 
2. 
3. 

### Proposed Solutions
- Option A: [description]
- Option B: [description]

### Action Items
- [ ] @person - [task]

### Feedback Needed By
[DATE]`,
  },
  {
    id: 'poll',
    icon: BarChart3,
    title: 'Quick Poll',
    description: 'For simple decisions - get votes without a meeting',
    timeEstimate: '2-3 min',
    benefits: ['Instant results', 'Anonymous if needed', 'Clear majority'],
    template: `Quick decision needed:

[QUESTION]

Options:
○ Option A
○ Option B  
○ Option C

Vote by [DATE]`,
  },
];

export function EnhancedNudge({
  timezoneSpread,
  participants,
  meetingTitle,
  onGoAsync,
  onDismiss,
  onScheduleAnyway,
  className,
}: EnhancedNudgeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const highSacrificeParticipants = participants.filter((p) => p.sacrificeScore >= 4);
  const totalSacrificePoints = participants.reduce((sum, p) => sum + p.sacrificeScore, 0);
  const estimatedHoursSaved = Math.round((participants.length * 0.5) * 10) / 10;

  const handleCopyTemplate = (alternative: AsyncAlternative) => {
    if (alternative.template) {
      navigator.clipboard.writeText(alternative.template);
      setCopiedId(alternative.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border-2',
        'bg-gradient-to-br from-amber-50/80 to-orange-50/80',
        'dark:from-amber-950/40 dark:to-orange-950/30',
        'border-amber-200 dark:border-amber-800/50',
        'shadow-lg shadow-amber-500/10',
        className
      )}
    >
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-200/20 to-orange-200/20 dark:from-amber-500/10 dark:to-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-yellow-200/20 to-amber-200/20 dark:from-yellow-500/10 dark:to-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      {/* Animated sparkles */}
      <motion.div
        animate={{ 
          rotate: [0, 15, -15, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-4 right-20 text-amber-400/30"
      >
        <Sparkles className="w-8 h-8" />
      </motion.div>

      <div className="relative z-10">
        {/* Header */}
        <div 
          className="flex items-start justify-between gap-4 p-5 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/25 shrink-0"
            >
              <Lightbulb className="w-6 h-6 text-white" />
            </motion.div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">
                  This meeting could be async
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-medium">
                  Smart Suggestion
                </span>
              </div>
              <p className="text-sm text-amber-800/70 dark:text-amber-200/70 mt-1">
                With a {timezoneSpread}-hour timezone spread, someone will always be sacrificing.
              </p>
              
              {/* Quick stats */}
              <div className="flex items-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{timezoneSpread}h spread</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{estimatedHoursSaved}h could be saved</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{totalSacrificePoints} sacrifice points</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onDismiss?.();
              }}
              className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-200/50 dark:hover:bg-amber-800/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400"
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </div>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-5">
                {/* Affected participants */}
                {highSacrificeParticipants.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-amber-200/50 dark:border-amber-800/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        High-impact participants
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {highSacrificeParticipants.map((p, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-xs"
                        >
                          <span className="font-medium text-amber-900 dark:text-amber-100">
                            {p.name}
                          </span>
                          <span className="text-amber-700 dark:text-amber-300">
                            {p.localTime}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 font-medium">
                            {p.sacrificeScore} pts
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alternative options */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Consider these alternatives
                  </h4>
                  
                  <div className="grid gap-3">
                    {ASYNC_ALTERNATIVES.map((alternative, index) => {
                      const Icon = alternative.icon;
                      const isSelected = selectedAlternative === alternative.id;
                      const isCopied = copiedId === alternative.id;

                      return (
                        <motion.div
                          key={alternative.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.1 }}
                        >
                          <Card
                            className={cn(
                              'overflow-hidden transition-all duration-300 cursor-pointer',
                              'border-amber-200/50 dark:border-amber-800/30',
                              'hover:border-amber-300 dark:hover:border-amber-700',
                              isSelected && 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/20'
                            )}
                            onClick={() => setSelectedAlternative(isSelected ? null : alternative.id)}
                          >
                            <div className="p-4">
                              <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className={cn(
                                  'p-2.5 rounded-xl shrink-0',
                                  'bg-gradient-to-br from-amber-100 to-amber-50',
                                  'dark:from-amber-900/30 dark:to-amber-800/20'
                                )}>
                                  <Icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <h5 className="font-semibold text-slate-900 dark:text-slate-100">
                                      {alternative.title}
                                    </h5>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                      {alternative.timeEstimate}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                    {alternative.description}
                                  </p>

                                  {/* Benefits */}
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {alternative.benefits.map((benefit, i) => (
                                      <span
                                        key={i}
                                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                                      >
                                        <Check className="w-3 h-3" />
                                        {benefit}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Expand indicator */}
                                <motion.div
                                  animate={{ rotate: isSelected ? 180 : 0 }}
                                  className="text-slate-400"
                                >
                                  <ChevronDown className="w-5 h-5" />
                                </motion.div>
                              </div>
                            </div>

                            {/* Expanded template */}
                            <AnimatePresence>
                              {isSelected && alternative.template && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 pt-2 border-t border-amber-200/30 dark:border-amber-800/30">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-medium text-slate-500">
                                        Template preview
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCopyTemplate(alternative);
                                        }}
                                        className="h-7 text-xs"
                                      >
                                        {isCopied ? (
                                          <>
                                            <CheckCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                                            Copied!
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3.5 h-3.5 mr-1" />
                                            Copy
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                    <pre className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                                      {alternative.template}
                                    </pre>
                                    <Button
                                      className="w-full mt-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onGoAsync?.(alternative.id);
                                      }}
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      Go Async with {alternative.title}
                                    </Button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-amber-200/50 dark:border-amber-800/30">
                  <p className="text-xs text-amber-800/60 dark:text-amber-200/60">
                    💡 Teams using async save an average of 4.2 hours/week
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onDismiss}
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    >
                      Dismiss
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onScheduleAnyway}
                      className="border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                    >
                      Schedule Anyway
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
