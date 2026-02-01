'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Users,
  BarChart3,
  Settings,
  Home,
  Plus,
} from 'lucide-react';

interface MobileNavProps {
  className?: string;
}

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/meetings', icon: Calendar, label: 'Meetings' },
  { href: '/meetings/new', icon: Plus, label: 'New', isAction: true },
  { href: '/teams', icon: Users, label: 'Teams' },
  { href: '/fairness', icon: BarChart3, label: 'Fairness' },
];

export function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'lg:hidden',
        className
      )}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800" />
      
      {/* Safe area padding for iOS */}
      <div className="relative pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const isAction = item.isAction;

            if (isAction) {
              return (
                <motion.div
                  key={item.href}
                  whileTap={{ scale: 0.9 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      'relative flex items-center justify-center',
                      'w-14 h-14 -mt-6',
                      'rounded-full',
                      'bg-gradient-to-br from-teal-500 to-teal-600',
                      'shadow-lg shadow-teal-500/30',
                      'text-white',
                      'transition-all duration-300',
                      'hover:shadow-xl hover:shadow-teal-500/40 hover:scale-105'
                    )}
                  >
                    <Icon className="w-6 h-6" />
                    
                    {/* Pulse effect */}
                    <span className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-20" />
                  </Link>
                </motion.div>
              );
            }

            return (
              <Link key={item.href} href={item.href} className="relative">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors',
                    isActive
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  )}
                >
                  <div className="relative">
                    <Icon className="w-6 h-6" />
                    
                    {/* Active indicator dot */}
                    {isActive && (
                      <motion.span
                        layoutId="mobileNavIndicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-500"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </div>
                  
                  <span className="text-[10px] font-medium">
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* iOS home indicator spacer */}
      <div className="h-2 bg-white/80 dark:bg-slate-900/80" />
    </motion.nav>
  );
}

// Desktop floating action button for quick actions
export function FloatingActionButton({ className }: { className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    { icon: Calendar, label: 'New Meeting', href: '/meetings/new', color: 'from-teal-500 to-teal-600' },
    { icon: Users, label: 'New Team', href: '/teams/new', color: 'from-sky-500 to-sky-600' },
  ];

  return (
    <div className={cn('fixed bottom-6 right-6 z-50 hidden lg:flex flex-col items-end gap-3', className)}>
      {/* Expanded actions */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.href}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-sm font-medium shadow-lg">
                    {action.label}
                  </span>
                  <Link href={action.href}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg',
                        'bg-gradient-to-br',
                        action.color
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.button>
                  </Link>
                </motion.div>
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl',
          'bg-gradient-to-br from-amber-500 to-amber-600',
          'transition-all duration-300',
          isExpanded && 'rotate-45'
        )}
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
