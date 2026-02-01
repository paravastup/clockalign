'use client';

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, AlertTriangle, Crown, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  trend: 'up' | 'down' | 'neutral';
  trendValue: number;
  timezone: string;
  breakdown: {
    lateNights: number;
    earlyMornings: number;
    eveningCalls: number;
  };
  isCurrentUser?: boolean;
}

interface PodiumLeaderboardProps {
  entries: LeaderboardEntry[];
  averageScore: number;
  currentUserId?: string;
  className?: string;
}

const TREND_ICONS = {
  up: { icon: TrendingUp, color: 'text-emerald-500' },
  down: { icon: TrendingDown, color: 'text-rose-500' },
  neutral: { icon: Minus, color: 'text-slate-400' },
};

const PODIUM_CONFIG = [
  { rank: 1, height: 'h-40', color: 'from-amber-400 to-amber-500', label: '1st', icon: Crown },
  { rank: 2, height: 'h-32', color: 'from-slate-300 to-slate-400', label: '2nd', icon: Medal },
  { rank: 3, height: 'h-24', color: 'from-amber-600 to-amber-700', label: '3rd', icon: Award },
];

export function PodiumLeaderboard({
  entries,
  averageScore,
  currentUserId,
  className,
}: PodiumLeaderboardProps) {
  // Sort by score descending
  const sortedEntries = [...entries].sort((a, b) => b.score - a.score);
  const top3 = sortedEntries.slice(0, 3);
  const rest = sortedEntries.slice(3);
  const maxScore = Math.max(...entries.map((e) => e.score), 1);

  // Calculate fairness metrics
  const highestScore = sortedEntries[0]?.score || 0;
  const lowestScore = sortedEntries[sortedEntries.length - 1]?.score || 0;
  const fairnessRatio = highestScore > 0 ? highestScore / Math.max(lowestScore, 1) : 1;
  const isFairnessIssue = fairnessRatio > 3;

  return (
    <div className={cn('space-y-8', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800/50"
        >
          <Trophy className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Team Sacrifice Leaderboard
          </span>
        </motion.div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Lower scores are better - tracking timezone fairness
        </p>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4 h-48">
        {/* Reorder for podium: 2nd, 1st, 3rd */}
        {[1, 0, 2].map((index) => {
          const entry = top3[index];
          if (!entry) return null;
          
          const config = PODIUM_CONFIG[index === 1 ? 0 : index === 0 ? 1 : 2];
          const Icon = config.icon;
          
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, type: 'spring', stiffness: 200 }}
              className="flex flex-col items-center"
            >
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1, type: 'spring', stiffness: 300 }}
                className={cn(
                  'relative w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3',
                  'bg-gradient-to-br',
                  entry.isCurrentUser ? 'from-teal-400 to-teal-500 ring-4 ring-teal-200 dark:ring-teal-800' : 'from-slate-400 to-slate-500'
                )}
              >
                {entry.avatar ? (
                  <img src={entry.avatar} alt={entry.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  entry.name.charAt(0).toUpperCase()
                )}
                
                {/* Rank badge */}
                <div className={cn(
                  'absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  'bg-gradient-to-br',
                  config.color
                )}>
                  <Icon className="w-3 h-3 text-white" />
                </div>
                
                {/* Current user indicator */}
                {entry.isCurrentUser && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-teal-500 text-[10px] font-medium text-white">
                    You
                  </div>
                )}
              </motion.div>
              
              {/* Name */}
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1 text-center max-w-[100px] truncate">
                {entry.name}
              </p>
              
              {/* Score */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, type: 'spring' }}
                className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2"
              >
                {entry.score}
              </motion.div>
              
              {/* Podium block */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                className={cn(
                  'w-24 rounded-t-xl bg-gradient-to-t flex items-end justify-center pb-3',
                  config.color,
                  config.height
                )}
              >
                <span className="text-white font-bold text-lg">{config.label}</span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Fairness Alert */}
      {isFairnessIssue && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-amber-950/20 border border-rose-200 dark:border-rose-800/50"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h4 className="font-semibold text-rose-800 dark:text-rose-300">
                Fairness Alert
              </h4>
              <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">
                {sortedEntries[0].name} has {fairnessRatio.toFixed(1)}x the average sacrifice score. 
                Consider rotating meeting times to balance the load.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Full Leaderboard */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Full Rankings
        </h4>
        
        <div className="space-y-2">
          {sortedEntries.map((entry, index) => {
            const TrendIcon = TREND_ICONS[entry.trend].icon;
            const isTop3 = index < 3;
            
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'group flex items-center gap-4 p-4 rounded-xl transition-all duration-300',
                  'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                  entry.isCurrentUser && 'bg-teal-50/50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50',
                  !entry.isCurrentUser && 'border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                )}
              >
                {/* Rank */}
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm',
                  isTop3 
                    ? 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 text-amber-700 dark:text-amber-300'
                    : 'text-slate-400'
                )}>
                  {index + 1}
                </div>

                {/* Avatar */}
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white',
                  'bg-gradient-to-br',
                  entry.isCurrentUser ? 'from-teal-400 to-teal-500' : 'from-slate-400 to-slate-500'
                )}>
                  {entry.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {entry.name}
                    </span>
                    {entry.isCurrentUser && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{entry.timezone.split('/').pop()?.replace(/_/g, ' ')}</span>
                    {entry.breakdown.lateNights > 0 && (
                      <span className="text-rose-500">{entry.breakdown.lateNights} late nights</span>
                    )}
                    {entry.breakdown.earlyMornings > 0 && (
                      <span className="text-amber-500">{entry.breakdown.earlyMornings} early mornings</span>
                    )}
                  </div>
                </div>

                {/* Trend */}
                <div className={cn('flex items-center gap-1', TREND_ICONS[entry.trend].color)}>
                  <TrendIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">{entry.trendValue}%</span>
                </div>

                {/* Score bar */}
                <div className="w-24 sm:w-32">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {entry.score}
                    </span>
                    <span className="text-slate-400">pts</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(entry.score / maxScore) * 100}%` }}
                      transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
                      className={cn(
                        'h-full rounded-full bg-gradient-to-r',
                        entry.score > averageScore * 2 ? 'from-rose-400 to-rose-500' :
                        entry.score > averageScore ? 'from-amber-400 to-amber-500' :
                        'from-emerald-400 to-emerald-500'
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {averageScore}
          </p>
          <p className="text-xs text-slate-500">Team Average</p>
        </div>
        <div className="text-center border-x border-slate-200 dark:border-slate-700">
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {highestScore}
          </p>
          <p className="text-xs text-slate-500">Highest</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {lowestScore}
          </p>
          <p className="text-xs text-slate-500">Lowest</p>
        </div>
      </div>
    </div>
  );
}
