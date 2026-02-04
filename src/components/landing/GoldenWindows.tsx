'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Brain, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TimeSlot {
  hour: number;
  label: string;
  sharpness: 'peak' | 'good' | 'fair' | 'low';
  score: number;
  description: string;
}

const cognitiveData: TimeSlot[] = [
  { hour: 6, label: '6 AM', sharpness: 'low', score: 35, description: 'Sleep inertia - brain booting up' },
  { hour: 7, label: '7 AM', sharpness: 'fair', score: 55, description: 'Morning grogginess fading' },
  { hour: 8, label: '8 AM', sharpness: 'fair', score: 65, description: 'Getting into gear' },
  { hour: 9, label: '9 AM', sharpness: 'good', score: 80, description: 'Morning momentum building' },
  { hour: 10, label: '10 AM', sharpness: 'peak', score: 95, description: 'Peak cognitive performance' },
  { hour: 11, label: '11 AM', sharpness: 'peak', score: 98, description: 'Optimal focus & creativity' },
  { hour: 12, label: '12 PM', sharpness: 'peak', score: 92, description: 'Still sharp before lunch' },
  { hour: 13, label: '1 PM', sharpness: 'fair', score: 60, description: 'Post-lunch dip - avoid heavy topics' },
  { hour: 14, label: '2 PM', sharpness: 'good', score: 78, description: 'Afternoon recovery begins' },
  { hour: 15, label: '3 PM', sharpness: 'peak', score: 88, description: 'Second wind - great for decisions' },
  { hour: 16, label: '4 PM', sharpness: 'peak', score: 85, description: 'Solid afternoon performance' },
  { hour: 17, label: '5 PM', sharpness: 'good', score: 75, description: 'Winding down but capable' },
  { hour: 18, label: '6 PM', sharpness: 'fair', score: 55, description: 'Mental fatigue setting in' },
  { hour: 19, label: '7 PM', sharpness: 'fair', score: 50, description: 'Personal time priority' },
  { hour: 20, label: '8 PM', sharpness: 'low', score: 35, description: 'Evening relaxation mode' },
  { hour: 21, label: '9 PM', sharpness: 'low', score: 25, description: 'Cognitive reserves depleted' },
  { hour: 22, label: '10 PM', sharpness: 'low', score: 15, description: 'Preparing for sleep' },
  { hour: 23, label: '11 PM', sharpness: 'low', score: 10, description: 'Sleep zone - avoid at all costs' },
  { hour: 0, label: '12 AM', sharpness: 'low', score: 5, description: 'Deep sleep hours' },
  { hour: 1, label: '1 AM', sharpness: 'low', score: 5, description: 'Deep sleep hours' },
  { hour: 2, label: '2 AM', sharpness: 'low', score: 5, description: 'Deep sleep hours' },
  { hour: 3, label: '3 AM', sharpness: 'low', score: 5, description: 'Deep sleep hours' },
  { hour: 4, label: '4 AM', sharpness: 'low', score: 10, description: 'Pre-dawn grogginess' },
  { hour: 5, label: '5 AM', sharpness: 'low', score: 20, description: 'Early riser territory' },
];

const getSharpnessColor = (sharpness: string) => {
  switch (sharpness) {
    case 'peak': return 'bg-emerald-500';
    case 'good': return 'bg-blue-500';
    case 'fair': return 'bg-amber-500';
    case 'low': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};

const getSharpnessTextColor = (sharpness: string) => {
  switch (sharpness) {
    case 'peak': return 'text-emerald-600 dark:text-emerald-400';
    case 'good': return 'text-blue-600 dark:text-blue-400';
    case 'fair': return 'text-amber-600 dark:text-amber-400';
    case 'low': return 'text-red-600 dark:text-red-400';
    default: return 'text-gray-500 dark:text-gray-400';
  }
};

const getSharpnessBgColor = (sharpness: string) => {
  switch (sharpness) {
    case 'peak': return 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800';
    case 'good': return 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800';
    case 'fair': return 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800';
    case 'low': return 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800';
    default: return 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700';
  }
};

export function GoldenWindows() {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const peakHours = cognitiveData.filter(d => d.sharpness === 'peak');
  const goodHours = cognitiveData.filter(d => d.sharpness === 'good');

  return (
    <section id="golden" className="py-24 px-6 bg-gradient-subtle">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 mb-6">
            <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm text-amber-700 dark:text-amber-300">Cognitive Science Powered</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-foreground">
            Golden <span className="text-gradient">Windows</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find times when everyone&apos;s actually sharp, not just awake. 
            Based on circadian rhythms and cognitive performance research.
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid sm:grid-cols-3 gap-4 mb-12"
        >
          <StatCard
            icon={<Brain className="w-5 h-5" />}
            label="Peak Hours"
            value="10 AM - 12 PM"
            subtext="98% cognitive performance"
            color="emerald"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Afternoon Peak"
            value="2 PM - 4 PM"
            subtext="88% cognitive performance"
            color="blue"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Avoid"
            value="1 PM - 2 PM"
            subtext="Post-lunch dip (60%)"
            color="amber"
          />
        </motion.div>

        {/* Cognitive Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6 border-border shadow-card">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <Brain className="w-5 h-5 text-[hsl(var(--purple))]" />
                Cognitive Sharpness by Hour
              </h3>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <LegendItem color="bg-emerald-500" label="Peak (90-100%)" />
                <LegendItem color="bg-blue-500" label="Good (70-89%)" />
                <LegendItem color="bg-amber-500" label="Fair (40-69%)" />
                <LegendItem color="bg-red-500" label="Low (0-39%)" />
              </div>
            </div>

            {/* Chart */}
            <div className="relative">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-muted-foreground">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              {/* Bars */}
              <div className="ml-10 flex items-end justify-between gap-1 h-56 mb-8">
                {cognitiveData.map((slot) => (
                  <motion.div
                    key={slot.hour}
                    className="flex-1 flex flex-col items-center"
                    initial={{ height: 0 }}
                    whileInView={{ height: '100%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: slot.hour * 0.015 }}
                  >
                    <div className="relative w-full h-full flex items-end">
                      <motion.div
                        className={`w-full rounded-t cursor-pointer transition-all ${getSharpnessColor(slot.sharpness)} ${
                          hoveredHour === slot.hour ? 'opacity-100' : 'opacity-85'
                        }`}
                        style={{ height: `${slot.score}%` }}
                        onMouseEnter={() => setHoveredHour(slot.hour)}
                        onMouseLeave={() => setHoveredHour(null)}
                        onClick={() => setSelectedSlot(slot)}
                        whileHover={{ scale: 1.05 }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-2 rotate-45 origin-left translate-y-2 hidden sm:block">
                      {slot.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Golden Window Highlight */}
              <div className="absolute top-0 left-[38%] w-[12%] h-full pointer-events-none hidden sm:block">
                <div className="absolute inset-0 bg-amber-100/50 dark:bg-amber-900/30 border-x-2 border-amber-300/50 dark:border-amber-600/50" />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <Badge className="bg-amber-500 text-white text-xs">
                    <Sun className="w-3 h-3 mr-1" />
                    Golden Window
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Time Categories */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid md:grid-cols-4 gap-4 mt-6"
        >
          <TimeCategoryCard
            title="Peak Performance"
            hours={peakHours}
            description="Best for: Strategic decisions, creative work, complex problem solving"
            color="emerald"
          />
          <TimeCategoryCard
            title="Good Performance"
            hours={goodHours}
            description="Best for: Regular meetings, updates, collaborative work"
            color="blue"
          />
          <TimeCategoryCard
            title="Fair Performance"
            hours={cognitiveData.filter(d => d.sharpness === 'fair')}
            description="Best for: Status updates, light discussions, email"
            color="amber"
          />
          <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <h4 className="font-semibold text-red-700 dark:text-red-300">Low Performance</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Avoid meetings during these hours
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs border-red-300 dark:border-red-700 text-red-700 dark:text-red-300">8 PM - 8 AM</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Sleep hours, evening wind-down. Schedule async instead.
            </p>
          </Card>
        </motion.div>

        {/* Selected Slot Detail */}
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className={`p-5 ${getSharpnessBgColor(selectedSlot.sharpness)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xl font-semibold mb-2 text-foreground">
                    {selectedSlot.label} — {selectedSlot.sharpness.charAt(0).toUpperCase() + selectedSlot.sharpness.slice(1)} Performance
                  </h4>
                  <p className="text-muted-foreground mb-4 text-sm">{selectedSlot.description}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-muted-foreground" />
                      <span className={`${getSharpnessTextColor(selectedSlot.sharpness)} font-medium`}>
                        {selectedSlot.score}% cognitive capacity
                      </span>
                    </div>
                    <Progress value={selectedSlot.score} className="w-32 h-2" />
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSlot(null)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 p-5 rounded-xl bg-[hsl(var(--brand-light))] dark:bg-slate-800/50 border border-[hsl(var(--brand))]/20 dark:border-slate-700"
        >
          <div className="flex items-start gap-4">
            <Info className="w-5 h-5 text-[hsl(var(--brand))] dark:text-teal-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">The Science Behind Golden Windows</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Our algorithm is based on decades of chronobiology research. Everyone has a unique
                circadian rhythm, but most people experience similar patterns of cognitive performance
                throughout the day.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs border-[hsl(var(--brand))]/30 dark:border-teal-600/50 text-[hsl(var(--brand))] dark:text-teal-400">Circadian Rhythms</Badge>
                <Badge variant="outline" className="text-xs border-[hsl(var(--brand))]/30 dark:border-teal-600/50 text-[hsl(var(--brand))] dark:text-teal-400">Ultradian Cycles</Badge>
                <Badge variant="outline" className="text-xs border-[hsl(var(--brand))]/30 dark:border-teal-600/50 text-[hsl(var(--brand))] dark:text-teal-400">Sleep Science</Badge>
                <Badge variant="outline" className="text-xs border-[hsl(var(--brand))]/30 dark:border-teal-600/50 text-[hsl(var(--brand))] dark:text-teal-400">Cognitive Psychology</Badge>
              </div>
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
  subtext,
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  subtext: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
  };

  return (
    <Card className="p-5 border-border shadow-soft">
      <div className={`flex items-center gap-3 mb-3 ${colorClasses[color]}`}>
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-semibold text-foreground mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </Card>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  );
}

function TimeCategoryCard({ 
  title, 
  hours, 
  description, 
  color 
}: { 
  title: string; 
  hours: TimeSlot[]; 
  description: string; 
  color: string;
}) {
  const bgColors: Record<string, string> = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    blue: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
    amber: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
  };

  const textColors: Record<string, string> = {
    emerald: 'text-emerald-700 dark:text-emerald-300',
    blue: 'text-blue-700 dark:text-blue-300',
    amber: 'text-amber-700 dark:text-amber-300',
  };

  const dotColors: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
  };

  return (
    <Card className={`p-4 ${bgColors[color]}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${dotColors[color]}`} />
        <h4 className={`font-semibold ${textColors[color]}`}>{title}</h4>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {hours.slice(0, 4).map((h) => (
          <Badge key={h.hour} variant="outline" className={`text-xs border-${color}-300 ${textColors[color]}`}>
            {h.label}
          </Badge>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Card>
  );
}
