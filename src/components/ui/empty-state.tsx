'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Button } from './button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: 'calendar' | 'team' | 'chart' | 'clock' | 'search' | 'custom';
  customIllustration?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const illustrations: Record<string, React.FC<{ className?: string }>> = {
  calendar: CalendarIllustration,
  team: TeamIllustration,
  chart: ChartIllustration,
  clock: ClockIllustration,
  search: SearchIllustration,
};

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  secondaryAction,
  illustration = 'calendar',
  customIllustration,
  className,
  size = 'md',
}: EmptyStateProps) {
  const Illustration = illustrations[illustration];
  const sizeClasses = {
    sm: 'max-w-sm py-8',
    md: 'max-w-md py-12',
    lg: 'max-w-lg py-16',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'flex flex-col items-center justify-center text-center px-4',
        sizeClasses[size],
        className
      )}
    >
      {/* Illustration Container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative mb-8"
      >
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-100/50 via-emerald-100/30 to-amber-100/50 blur-3xl rounded-full scale-150" />
        
        {/* Illustration */}
        <div className="relative">
          {customIllustration ? (
            customIllustration
          ) : (
            <Illustration className="w-32 h-32" />
          )}
        </div>

        {/* Floating decorative elements */}
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 to-amber-400 shadow-lg"
        />
        <motion.div
          animate={{ y: [0, 6, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute -bottom-1 -left-3 w-4 h-4 rounded-full bg-gradient-to-br from-teal-300 to-teal-400 shadow-lg"
        />
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="space-y-3"
      >
        <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </motion.div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-3 mt-6"
        >
          {action && (
            <Button
              onClick={action.onClick}
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg shadow-teal-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5"
            >
              {action.icon && <action.icon className="w-4 h-4 mr-2" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Calendar Illustration
function CalendarIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Calendar base */}
      <motion.rect
        x="15"
        y="25"
        width="90"
        height="80"
        rx="12"
        fill="url(#calendarGradient)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      {/* Calendar header */}
      <rect x="15" y="25" width="90" height="28" rx="12" fill="url(#headerGradient)" />
      <rect x="15" y="41" width="90" height="12" fill="url(#headerGradient)" />
      {/* Hangers */}
      <motion.path
        d="M35 15 V25 M85 15 V25"
        stroke="#14b8a6"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      <circle cx="35" cy="12" r="5" fill="#0d9488" />
      <circle cx="85" cy="12" r="5" fill="#0d9488" />
      {/* Calendar grid */}
      <g fill="#f1f5f9">
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <motion.rect
              key={`${row}-${col}`}
              x={25 + col * 20}
              y={60 + row * 15}
              width="14"
              height="10"
              rx="2"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + (row * 4 + col) * 0.05 }}
            />
          ))
        )}
      </g>
      {/* Highlighted day */}
      <motion.rect
        x="45"
        y="60"
        width="14"
        height="10"
        rx="2"
        fill="url(#highlightGradient)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 300 }}
      />
      {/* Checkmark */}
      <motion.path
        d="M48 64 L51 67 L56 62"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 1.3, duration: 0.3 }}
      />
      <defs>
        <linearGradient id="calendarGradient" x1="15" y1="25" x2="105" y2="105" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f8fafc" />
          <stop offset="1" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="headerGradient" x1="15" y1="25" x2="105" y2="53" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id="highlightGradient" x1="45" y1="60" x2="59" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Team Illustration
function TeamIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Connection lines */}
      <motion.path
        d="M40 50 Q60 35 80 50"
        stroke="#cbd5e1"
        strokeWidth="2"
        strokeDasharray="4 2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />
      <motion.path
        d="M40 70 Q60 85 80 70"
        stroke="#cbd5e1"
        strokeWidth="2"
        strokeDasharray="4 2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      
      {/* Left person */}
      <motion.g
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
      >
        <circle cx="35" cy="60" r="20" fill="url(#person1Gradient)" />
        <circle cx="35" cy="55" r="8" fill="#fcd34d" />
        <path d="M25 65 Q35 72 45 65" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" fill="none" />
      </motion.g>

      {/* Center person (main) */}
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
      >
        <circle cx="60" cy="50" r="25" fill="url(#person2Gradient)" />
        <circle cx="60" cy="44" r="10" fill="#fde68a" />
        <path d="M47 58 Q60 68 73 58" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Crown/star for main person */}
        <motion.path
          d="M55 25 L57 30 L62 30 L58 33 L60 38 L55 35 L50 38 L52 33 L48 30 L53 30 Z"
          fill="#fbbf24"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.8, type: 'spring' }}
        />
      </motion.g>

      {/* Right person */}
      <motion.g
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring' }}
      >
        <circle cx="85" cy="60" r="20" fill="url(#person3Gradient)" />
        <circle cx="85" cy="55" r="8" fill="#fde68a" />
        <path d="M75 65 Q85 72 95 65" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" fill="none" />
      </motion.g>

      {/* Floating hearts/reactions */}
      <motion.g
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle cx="25" cy="35" r="4" fill="#f43f5e" opacity="0.8" />
      </motion.g>
      <motion.g
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <circle cx="95" cy="35" r="4" fill="#10b981" opacity="0.8" />
      </motion.g>

      <defs>
        <linearGradient id="person1Gradient" x1="15" y1="40" x2="55" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5eead4" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
        <linearGradient id="person2Gradient" x1="35" y1="25" x2="85" y2="75" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id="person3Gradient" x1="65" y1="40" x2="105" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5eead4" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Chart Illustration
function ChartIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Chart background */}
      <rect x="15" y="20" width="90" height="80" rx="12" fill="url(#chartBg)" />
      
      {/* Grid lines */}
      {[0, 1, 2, 3].map((i) => (
        <motion.line
          key={i}
          x1="25"
          y1={35 + i * 18}
          x2="95"
          y2={35 + i * 18}
          stroke="#e2e8f0"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: i * 0.1 }}
        />
      ))}

      {/* Bar chart */}
      {[0, 1, 2, 3].map((i) => {
        const heights = [35, 55, 45, 60];
        const colors = ['#14b8a6', '#f59e0b', '#10b981', '#f43f5e'];
        return (
          <motion.rect
            key={i}
            x={30 + i * 18}
            y={90 - heights[i]}
            width="12"
            height={heights[i]}
            rx="3"
            fill={colors[i]}
            initial={{ height: 0, y: 90 }}
            animate={{ height: heights[i], y: 90 - heights[i] }}
            transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 200 }}
          />
        );
      })}

      {/* Trend line */}
      <motion.path
        d="M36 75 L54 50 L72 60 L90 35"
        stroke="#0d9488"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      />

      {/* Data points on trend line */}
      {[
        { cx: 36, cy: 75 },
        { cx: 54, cy: 50 },
        { cx: 72, cy: 60 },
        { cx: 90, cy: 35 },
      ].map((point, i) => (
        <motion.circle
          key={i}
          cx={point.cx}
          cy={point.cy}
          r="4"
          fill="white"
          stroke="#0d9488"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1 + i * 0.1, type: 'spring' }}
        />
      ))}

      <defs>
        <linearGradient id="chartBg" x1="15" y1="20" x2="105" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f8fafc" />
          <stop offset="1" stopColor="#f1f5f9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Clock Illustration
function ClockIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring */}
      <motion.circle
        cx="60"
        cy="60"
        r="45"
        stroke="url(#clockRing)"
        strokeWidth="8"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Inner face */}
      <circle cx="60" cy="60" r="38" fill="url(#clockFace)" />

      {/* Hour markers */}
      {[0, 3, 6, 9].map((hour, i) => {
        const angle = (hour * 30 - 90) * (Math.PI / 180);
        const x1 = 60 + 30 * Math.cos(angle);
        const y1 = 60 + 30 * Math.sin(angle);
        const x2 = 60 + 34 * Math.cos(angle);
        const y2 = 60 + 34 * Math.sin(angle);
        return (
          <motion.line
            key={hour}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#64748b"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          />
        );
      })}

      {/* Hour hand */}
      <motion.line
        x1="60"
        y1="60"
        x2="60"
        y2="38"
        stroke="#0f172a"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        style={{ transformOrigin: '60px 60px' }}
      />

      {/* Minute hand */}
      <motion.line
        x1="60"
        y1="60"
        x2="78"
        y2="60"
        stroke="#0f172a"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        style={{ transformOrigin: '60px 60px' }}
      />

      {/* Center dot */}
      <motion.circle
        cx="60"
        cy="60"
        r="5"
        fill="#14b8a6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.2, type: 'spring' }}
      />

      {/* Time zone indicators */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '60px 60px' }}
      >
        <circle cx="60" cy="10" r="3" fill="#f59e0b" opacity="0.6" />
      </motion.g>
      <motion.g
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '60px 60px' }}
      >
        <circle cx="100" cy="60" r="3" fill="#10b981" opacity="0.6" />
      </motion.g>

      <defs>
        <linearGradient id="clockRing" x1="15" y1="15" x2="105" y2="105" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" />
          <stop offset="0.5" stopColor="#0d9488" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
        <radialGradient id="clockFace" cx="60" cy="60" r="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#f1f5f9" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// Search Illustration
function SearchIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Search field background */}
      <motion.rect
        x="15"
        y="45"
        width="90"
        height="30"
        rx="15"
        fill="url(#searchBg)"
        stroke="#e2e8f0"
        strokeWidth="2"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5 }}
        style={{ transformOrigin: 'center' }}
      />

      {/* Search icon */}
      <motion.g
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <circle cx="32" cy="60" r="6" stroke="#94a3b8" strokeWidth="2" fill="none" />
        <line x1="36.5" y1="64.5" x2="40" y2="68" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      </motion.g>

      {/* Typing dots animation */}
      <g transform="translate(55, 60)">
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx={i * 12}
            cy="0"
            r="3"
            fill="#cbd5e1"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </g>

      {/* Magnifying glass overlay */}
      <motion.g
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
      >
        <circle
          cx="85"
          cy="35"
          r="20"
          fill="url(#magnifierGradient)"
          stroke="#14b8a6"
          strokeWidth="3"
        />
        <line x1="100" y1="50" x2="110" y2="60" stroke="#0d9488" strokeWidth="4" strokeLinecap="round" />
        {/* Glass reflection */}
        <ellipse cx="80" cy="30" rx="8" ry="5" fill="white" opacity="0.4" transform="rotate(-45 80 30)" />
      </motion.g>

      {/* Floating elements */}
      <motion.g
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="20" y="85" width="25" height="8" rx="4" fill="#fbbf24" opacity="0.6" />
      </motion.g>
      <motion.g
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <rect x="55" y="90" width="30" height="8" rx="4" fill="#14b8a6" opacity="0.6" />
      </motion.g>
      <motion.g
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <rect x="90" y="85" width="15" height="8" rx="4" fill="#f43f5e" opacity="0.6" />
      </motion.g>

      <defs>
        <linearGradient id="searchBg" x1="15" y1="45" x2="105" y2="75" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#f8fafc" />
        </linearGradient>
        <radialGradient id="magnifierGradient" cx="85" cy="35" r="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f0fdfa" />
          <stop offset="1" stopColor="#ccfbf1" />
        </radialGradient>
      </defs>
    </svg>
  );
}
