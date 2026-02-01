'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Info, Clock, Zap, Users } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Participant {
  id: string;
  name: string;
  timezone: string;
  avatar?: string;
  energyCurve: number[]; // 0-100 for each hour (0-23)
}

interface HeatmapCell {
  hour: number;
  participantId: string;
  energy: number;
  localHour: number;
  isAvailable: boolean;
}

interface TimeSlot {
  utcHour: number;
  averageEnergy: number;
  minEnergy: number;
  participants: {
    id: string;
    name: string;
    localHour: number;
    energy: number;
  }[];
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
}

interface EnhancedHeatmapProps {
  participants: Participant[];
  selectedDuration: number; // in minutes
  onSlotSelect?: (slot: TimeSlot) => void;
  selectedSlot?: number | null;
  className?: string;
}

const HOUR_LABELS = [
  '12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM',
  '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
  '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM',
  '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM',
];

const QUALITY_CONFIG = {
  excellent: {
    color: 'bg-emerald-500',
    gradient: 'from-emerald-400 to-emerald-600',
    glow: 'shadow-emerald-500/50',
    label: 'Excellent',
    minScore: 80,
  },
  good: {
    color: 'bg-teal-500',
    gradient: 'from-teal-400 to-teal-600',
    glow: 'shadow-teal-500/50',
    label: 'Good',
    minScore: 60,
  },
  fair: {
    color: 'bg-amber-500',
    gradient: 'from-amber-400 to-amber-600',
    glow: 'shadow-amber-500/50',
    label: 'Fair',
    minScore: 40,
  },
  poor: {
    color: 'bg-slate-400',
    gradient: 'from-slate-400 to-slate-500',
    glow: 'shadow-slate-400/50',
    label: 'Poor',
    minScore: 0,
  },
};

function getQuality(score: number): keyof typeof QUALITY_CONFIG {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

function getCellColor(energy: number, isAvailable: boolean): string {
  if (!isAvailable) return 'bg-slate-200 dark:bg-slate-800';
  if (energy >= 90) return 'bg-emerald-500';
  if (energy >= 75) return 'bg-emerald-400';
  if (energy >= 60) return 'bg-teal-400';
  if (energy >= 45) return 'bg-teal-300';
  if (energy >= 30) return 'bg-amber-300';
  if (energy >= 15) return 'bg-amber-400';
  return 'bg-rose-300';
}

function getCellGradient(energy: number, isAvailable: boolean): string {
  if (!isAvailable) return 'from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700';
  if (energy >= 90) return 'from-emerald-400 to-emerald-500';
  if (energy >= 75) return 'from-emerald-300 to-emerald-400';
  if (energy >= 60) return 'from-teal-300 to-teal-400';
  if (energy >= 45) return 'from-teal-200 to-teal-300';
  if (energy >= 30) return 'from-amber-200 to-amber-300';
  if (energy >= 15) return 'from-amber-300 to-amber-400';
  return 'from-rose-200 to-rose-300';
}

export function EnhancedHeatmap({
  participants,
  selectedDuration,
  onSlotSelect,
  selectedSlot,
  className,
}: EnhancedHeatmapProps) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [showLabels, setShowLabels] = useState(true);

  // Calculate time slots
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    
    for (let utcHour = 0; utcHour < 24; utcHour++) {
      const slotParticipants = participants.map((p) => {
        // Calculate local hour for this participant at UTC hour
        const localHour = (utcHour + getTimezoneOffset(p.timezone)) % 24;
        const energy = p.energyCurve[localHour] || 50;
        return {
          id: p.id,
          name: p.name,
          localHour,
          energy,
        };
      });

      const energies = slotParticipants.map((p) => p.energy);
      const averageEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
      const minEnergy = Math.min(...energies);
      const score = Math.round(averageEnergy * 0.7 + minEnergy * 0.3);

      slots.push({
        utcHour,
        averageEnergy: Math.round(averageEnergy),
        minEnergy: Math.round(minEnergy),
        participants: slotParticipants,
        quality: getQuality(score),
        score,
      });
    }

    return slots;
  }, [participants]);

  // Find best slots
  const bestSlots = useMemo(() => {
    return timeSlots
      .filter((s) => s.quality === 'excellent' || s.quality === 'good')
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [timeSlots]);

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Golden Windows
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Find times when everyone is at their sharpest
            </p>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">Energy:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gradient-to-br from-emerald-400 to-emerald-500" />
              <span className="text-slate-600 dark:text-slate-400">High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gradient-to-br from-teal-300 to-teal-400" />
              <span className="text-slate-600 dark:text-slate-400">Good</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gradient-to-br from-amber-300 to-amber-400" />
              <span className="text-slate-600 dark:text-slate-400">Low</span>
            </div>
          </div>
        </div>

        {/* Best slots highlight */}
        {bestSlots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {bestSlots.map((slot, index) => {
              const config = QUALITY_CONFIG[slot.quality];
              const displayHour = `${slot.utcHour % 12 || 12} ${slot.utcHour >= 12 ? 'PM' : 'AM'} UTC`;
              
              return (
                <motion.button
                  key={slot.utcHour}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSlotSelect?.(slot)}
                  className={cn(
                    'relative p-4 rounded-xl text-left transition-all',
                    'bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900',
                    'border-2 hover:border-teal-300 dark:hover:border-teal-700',
                    selectedSlot === slot.utcHour 
                      ? 'border-teal-500 shadow-lg shadow-teal-500/20' 
                      : 'border-slate-200 dark:border-slate-700'
                  )}
                >
                  {/* Rank badge */}
                  <div className={cn(
                    'absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                    'bg-gradient-to-br',
                    index === 0 ? 'from-amber-400 to-amber-500' : 
                    index === 1 ? 'from-slate-300 to-slate-400' : 
                    'from-amber-600 to-amber-700'
                  )}>
                    {index + 1}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      'bg-gradient-to-br',
                      config.gradient
                    )}>
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {displayHour}
                      </p>
                      <p className="text-xs text-slate-500">
                        Score: {slot.score}%
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* Heatmap */}
        <div className="relative">
          {/* Grid container */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[600px]">
              {/* Participant headers */}
              <div className="flex mb-2">
                <div className="w-16 flex-shrink-0" /> {/* Spacer for hour labels */}
                <div className="flex-1 grid grid-cols-4 gap-2">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 px-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white text-xs font-semibold">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {p.timezone.split('/').pop()?.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap grid */}
              <div className="space-y-1">
                {timeSlots.map((slot, hourIndex) => (
                  <motion.div
                    key={slot.utcHour}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: hourIndex * 0.02 }}
                    className={cn(
                      'flex items-center group',
                      hoveredHour === slot.utcHour && 'bg-slate-50 dark:bg-slate-800/50 rounded-lg'
                    )}
                    onMouseEnter={() => setHoveredHour(slot.utcHour)}
                    onMouseLeave={() => setHoveredHour(null)}
                  >
                    {/* Hour label */}
                    <div className="w-16 flex-shrink-0 text-xs text-slate-500 dark:text-slate-400 py-1">
                      {HOUR_LABELS[slot.utcHour]}
                    </div>

                    {/* Cells for this hour */}
                    <div className="flex-1 grid grid-cols-4 gap-1">
                      {slot.participants.map((participant, pIndex) => (
                        <Tooltip key={participant.id}>
                          <TooltipTrigger asChild>
                            <motion.button
                              whileHover={{ scale: 1.1, zIndex: 10 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onSlotSelect?.(slot)}
                              className={cn(
                                'h-10 rounded-md bg-gradient-to-br transition-all duration-200',
                                getCellGradient(participant.energy, true),
                                hoveredHour === slot.utcHour && 'ring-2 ring-white dark:ring-slate-700',
                                selectedSlot === slot.utcHour && 'ring-2 ring-teal-500'
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="p-3">
                            <div className="space-y-1">
                              <p className="font-semibold">{participant.name}</p>
                              <p className="text-xs text-slate-400">
                                Local time: {HOUR_LABELS[participant.localHour]}
                              </p>
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  'w-2 h-2 rounded-full',
                                  getCellColor(participant.energy, true)
                                )} />
                                <span className="text-xs">Energy: {participant.energy}%</span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Quality indicator overlay */}
          <AnimatePresence>
            {hoveredHour !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 right-0 mb-2 p-3 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700"
              >
                {(() => {
                  const slot = timeSlots[hoveredHour];
                  const config = QUALITY_CONFIG[slot.quality];
                  return (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          'bg-gradient-to-br',
                          config.gradient
                        )}>
                          <span className="text-white font-bold">{slot.score}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {HOUR_LABELS[hoveredHour]}
                          </p>
                          <p className="text-sm text-slate-500">
                            {config.label} • Average: {slot.averageEnergy}% • Min: {slot.minEnergy}%
                          </p>
                        </div>
                      </div>
                      <div className="flex -space-x-2">
                        {slot.participants.slice(0, 3).map((p) => (
                          <div
                            key={p.id}
                            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-medium"
                          >
                            {p.name.charAt(0)}
                          </div>
                        ))}
                        {slot.participants.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs text-slate-500">
                            +{slot.participants.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info footer */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Info className="w-3.5 h-3.5" />
          <span>
            Hover over cells to see details. Click to select a time slot.
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Helper function to get timezone offset in hours
function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
  } catch {
    return 0;
  }
}
