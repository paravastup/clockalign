'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, Award, Crown, Medal, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  meetingsThisMonth: number;
  inconvenientMeetings: number;
  lastSacrifice: string;
}

const mockData: LeaderboardEntry[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: 'SC',
    score: 245,
    trend: 'up',
    meetingsThisMonth: 18,
    inconvenientMeetings: 7,
    lastSacrifice: '2 days ago',
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    avatar: 'MJ',
    score: 198,
    trend: 'stable',
    meetingsThisMonth: 22,
    inconvenientMeetings: 5,
    lastSacrifice: '1 week ago',
  },
  {
    id: '3',
    name: 'Emma Williams',
    avatar: 'EW',
    score: 156,
    trend: 'down',
    meetingsThisMonth: 15,
    inconvenientMeetings: 3,
    lastSacrifice: '2 weeks ago',
  },
  {
    id: '4',
    name: 'David Park',
    avatar: 'DP',
    score: 134,
    trend: 'up',
    meetingsThisMonth: 20,
    inconvenientMeetings: 4,
    lastSacrifice: '3 days ago',
  },
  {
    id: '5',
    name: 'Lisa Rodriguez',
    avatar: 'LR',
    score: 89,
    trend: 'stable',
    meetingsThisMonth: 12,
    inconvenientMeetings: 2,
    lastSacrifice: '1 month ago',
  },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-amber-500" />;
    case 2:
      return <Medal className="w-4 h-4 text-slate-400" />;
    case 3:
      return <Medal className="w-4 h-4 text-amber-600" />;
    default:
      return <Star className="w-4 h-4 text-slate-300" />;
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    case 'down':
      return <TrendingDown className="w-4 h-4 text-red-500 dark:text-red-400" />;
    default:
      return <Minus className="w-4 h-4 text-slate-400 dark:text-slate-500" />;
  }
};

export function SacrificeLeaderboard() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const maxScore = Math.max(...mockData.map(d => d.score));

  return (
    <section id="leaderboard" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 mb-6">
            <Trophy className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="text-sm text-teal-700 dark:text-teal-300">Sacrifice Score Leaderboard</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-foreground">
            Fairness, <span className="text-gradient">visualized</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See who&apos;s been taking the hit for inconvenient meeting times. 
            The algorithm rotates burden to keep things fair.
          </p>
        </motion.div>

        {/* Time Range Selector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex justify-center gap-2 mb-8"
        >
          {(['week', 'month', 'quarter'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-[hsl(var(--brand))] text-white'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              This {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="overflow-hidden border-border shadow-card">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-secondary/50 text-sm font-medium text-muted-foreground border-b border-border">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">Team Member</div>
              <div className="col-span-3 text-center">Sacrifice Score</div>
              <div className="col-span-2 text-center">Meetings</div>
              <div className="col-span-2 text-center">Trend</div>
            </div>

            {/* Data Rows */}
            <div className="divide-y divide-border">
              {mockData.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-secondary/30 transition-colors ${
                    index === 0 ? 'bg-teal-50 dark:bg-teal-950/30' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex justify-center">
                    {getRankIcon(index + 1)}
                  </div>

                  {/* Name & Avatar */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${
                        index === 0 
                          ? 'bg-[hsl(var(--brand))] text-white' 
                          : 'bg-secondary text-foreground'
                      }`}
                    >
                      {entry.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Last sacrifice: {entry.lastSacrifice}
                      </p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="col-span-3">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className={`text-base font-semibold ${index === 0 ? 'text-[hsl(var(--brand))]' : 'text-foreground'}`}>
                        {entry.score}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {entry.inconvenientMeetings} inconvenient
                      </Badge>
                    </div>
                    <Progress 
                      value={(entry.score / maxScore) * 100} 
                      className="h-1.5"
                    />
                  </div>

                  {/* Meetings */}
                  <div className="col-span-2 text-center">
                    <span className="font-medium text-foreground">{entry.meetingsThisMonth}</span>
                    <span className="text-xs text-muted-foreground ml-1">total</span>
                  </div>

                  {/* Trend */}
                  <div className="col-span-2 flex justify-center">
                    {getTrendIcon(entry.trend)}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid sm:grid-cols-3 gap-4 mt-8"
        >
          <StatCard
            icon={<Award className="w-5 h-5" />}
            label="Most Fair Team"
            value="Sarah's Squad"
            subtext="245 avg sacrifice score"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Fairness Streak"
            value="12 meetings"
            subtext="Perfect rotation"
          />
          <StatCard
            icon={<Star className="w-5 h-5" />}
            label="Team Health"
            value="Excellent"
            subtext="Score variance: 15%"
          />
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 p-5 rounded-xl bg-secondary/50 border border-border"
        >
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-foreground">
            <span className="w-6 h-6 rounded-full bg-[hsl(var(--brand))] text-white flex items-center justify-center text-sm font-medium">?</span>
            How Sacrifice Score works
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-xs flex-shrink-0 text-foreground">1</span>
                <span>Points awarded for attending meetings outside preferred hours</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-xs flex-shrink-0 text-foreground">2</span>
                <span>Night/early morning meetings earn bonus points</span>
              </p>
            </div>
            <div className="space-y-2">
              <p className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-xs flex-shrink-0 text-foreground">3</span>
                <span>Algorithm prioritizes members with lower scores</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-xs flex-shrink-0 text-foreground">4</span>
                <span>Scores decay over time to ensure ongoing fairness</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  subtext 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  subtext: string;
}) {
  return (
    <Card className="p-4 border-border shadow-soft">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-[hsl(var(--brand))]">{icon}</div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </Card>
  );
}
