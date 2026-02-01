'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  Search,
  Calendar,
  Users,
  Settings,
  BarChart3,
  Clock,
  LogOut,
  Plus,
  Moon,
  Sun,
  HelpCircle,
  Keyboard,
  Zap,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CommandItem {
  id: string;
  title: string;
  shortcut?: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  category: 'navigation' | 'actions' | 'preferences' | 'help';
  keywords?: string[];
}

const COMMANDS: CommandItem[] = [
  // Navigation
  { id: 'dashboard', title: 'Go to Dashboard', shortcut: 'G D', icon: Sparkles, href: '/dashboard', category: 'navigation', keywords: ['home', 'main'] },
  { id: 'meetings', title: 'Go to Meetings', shortcut: 'G M', icon: Calendar, href: '/meetings', category: 'navigation' },
  { id: 'teams', title: 'Go to Teams', shortcut: 'G T', icon: Users, href: '/teams', category: 'navigation' },
  { id: 'fairness', title: 'Go to Fairness Dashboard', shortcut: 'G F', icon: BarChart3, href: '/fairness', category: 'navigation', keywords: ['leaderboard', 'sacrifice'] },
  { id: 'settings', title: 'Go to Settings', shortcut: 'G S', icon: Settings, href: '/settings', category: 'navigation' },
  
  // Actions
  { id: 'new-meeting', title: 'Create New Meeting', shortcut: 'C M', icon: Plus, href: '/meetings/new', category: 'actions', keywords: ['schedule', 'create'] },
  { id: 'new-team', title: 'Create New Team', shortcut: 'C T', icon: Users, href: '/teams/new', category: 'actions' },
  { id: 'golden-windows', title: 'Find Golden Windows', shortcut: 'C G', icon: Zap, href: '/meetings/new', category: 'actions', keywords: ['optimal', 'best time'] },
  
  // Preferences
  { id: 'toggle-theme', title: 'Toggle Dark Mode', shortcut: '⌘ J', icon: Moon, category: 'preferences', action: () => {
    document.documentElement.classList.toggle('dark');
  }, keywords: ['theme', 'light', 'dark'] },
  { id: 'timezone', title: 'Change Timezone', shortcut: 'C Z', icon: Clock, href: '/settings', category: 'preferences' },
  
  // Help
  { id: 'help', title: 'Help & Documentation', shortcut: '?', icon: HelpCircle, href: '/docs', category: 'help', keywords: ['docs', 'guide'] },
  { id: 'shortcuts', title: 'Keyboard Shortcuts', shortcut: '⌘ K', icon: Keyboard, category: 'help' },
];

const CATEGORY_LABELS: Record<string, string> = {
  navigation: 'Navigation',
  actions: 'Actions',
  preferences: 'Preferences',
  help: 'Help',
};

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return COMMANDS;
    
    const query = searchQuery.toLowerCase();
    return COMMANDS.filter((cmd) => {
      const matchesTitle = cmd.title.toLowerCase().includes(query);
      const matchesKeywords = cmd.keywords?.some((k) => k.toLowerCase().includes(query));
      return matchesTitle || matchesKeywords;
    });
  }, [searchQuery]);

  // Group by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          onClose(); // Actually opens via parent
        }
      }

      // Close on escape
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }

      // Navigation
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const selected = filteredCommands[selectedIndex];
          if (selected) {
            executeCommand(selected);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filteredCommands, selectedIndex]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const executeCommand = (command: CommandItem) => {
    if (command.action) {
      command.action();
    }
    onClose();
    setSearchQuery('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] p-4 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search header */}
          <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commands..."
              className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none text-lg"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 font-medium">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  No commands found for "{searchQuery}"
                </p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category} className="mb-4">
                  <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {CATEGORY_LABELS[category]}
                  </h3>
                  <div className="space-y-1">
                    {commands.map((command, index) => {
                      const Icon = command.icon;
                      const isSelected = filteredCommands[selectedIndex]?.id === command.id;

                      const content = (
                        <motion.div
                          layoutId={command.id}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                            isSelected
                              ? 'bg-teal-500 text-white'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          )}
                          onClick={() => executeCommand(command)}
                          onMouseEnter={() => {
                            const flatIndex = filteredCommands.findIndex((c) => c.id === command.id);
                            setSelectedIndex(flatIndex);
                          }}
                        >
                          <Icon className={cn('w-5 h-5', isSelected ? 'text-white' : 'text-slate-400')} />
                          <span className="flex-1 font-medium">{command.title}</span>
                          {command.shortcut && (
                            <kbd
                              className={cn(
                                'px-2 py-0.5 rounded text-xs font-medium',
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              )}
                            >
                              {command.shortcut}
                            </kbd>
                          )}
                          <ChevronRight className={cn('w-4 h-4 opacity-0', isSelected && 'opacity-100')} />
                        </motion.div>
                      );

                      return command.href ? (
                        <Link key={command.id} href={command.href} onClick={onClose}>
                          {content}
                        </Link>
                      ) : (
                        <div key={command.id}>{content}</div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                  ↑
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                  ↓
                </kbd>
                <span className="ml-1">to navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                  ↵
                </kbd>
                <span className="ml-1">to select</span>
              </span>
            </div>
            <span>ClockAlign Command Palette</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to manage command palette visibility
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Listen for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return { isOpen, open, close, toggle };
}


