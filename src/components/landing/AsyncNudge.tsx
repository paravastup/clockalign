'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Video, FileText, MessageCircle, Zap, Clock, Users, Globe, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface AsyncAlternative {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  bestFor: string[];
  timeSaved: string;
  color: string;
}

const asyncAlternatives: AsyncAlternative[] = [
  {
    id: 'loom',
    icon: <Video className="w-5 h-5" />,
    name: 'Loom Video',
    description: 'Record your screen and voice for async updates',
    bestFor: ['Demos', 'Walkthroughs', 'Status updates', 'Feedback'],
    timeSaved: '30-60 min',
    color: 'purple',
  },
  {
    id: 'notion',
    icon: <FileText className="w-5 h-5" />,
    name: 'Notion Doc',
    description: 'Write a detailed document with context and decisions',
    bestFor: ['Specs', 'Decisions', 'Research', 'Planning'],
    timeSaved: '45-90 min',
    color: 'blue',
  },
  {
    id: 'slack',
    icon: <MessageCircle className="w-5 h-5" />,
    name: 'Slack Thread',
    description: 'Async discussion in a dedicated channel thread',
    bestFor: ['Quick questions', 'Brainstorming', 'Feedback', 'Updates'],
    timeSaved: '15-30 min',
    color: 'green',
  },
];

interface Scenario {
  id: string;
  title: string;
  timezoneSpread: number;
  urgency: 'low' | 'medium' | 'high';
  participants: number;
  recommendation: 'async' | 'sync';
  confidence: number;
  reason: string;
}

const scenarios: Scenario[] = [
  {
    id: '1',
    title: 'Weekly Standup',
    timezoneSpread: 12,
    urgency: 'low',
    participants: 8,
    recommendation: 'async',
    confidence: 92,
    reason: '12-hour spread + low urgency = perfect for async',
  },
  {
    id: '2',
    title: 'Product Launch Review',
    timezoneSpread: 6,
    urgency: 'high',
    participants: 5,
    recommendation: 'sync',
    confidence: 85,
    reason: 'High urgency requires real-time collaboration',
  },
  {
    id: '3',
    title: 'Design Feedback',
    timezoneSpread: 9,
    urgency: 'medium',
    participants: 4,
    recommendation: 'async',
    confidence: 78,
    reason: 'Loom video allows thoughtful, detailed feedback',
  },
];

export function AsyncNudge() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(scenarios[0]);
  const [selectedAlternative, setSelectedAlternative] = useState<AsyncAlternative | null>(null);

  return (
    <section id="async" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-200 mb-6">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-purple-700">Smart Detection</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-foreground">
            Async <span className="text-gradient">Nudge</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Smart detection when meetings should be async. Save time, respect timezones, 
            and let people engage on their own schedule.
          </p>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid md:grid-cols-4 gap-4 mb-12"
        >
          <StepCard
            number={1}
            icon={<Globe className="w-4 h-4" />}
            title="Analyze Timezones"
            description="Detects 8+ hour spreads automatically"
          />
          <StepCard
            number={2}
            icon={<Zap className="w-4 h-4" />}
            title="Check Urgency"
            description="Evaluates if sync is truly needed"
          />
          <StepCard
            number={3}
            icon={<MessageSquare className="w-4 h-4" />}
            title="Suggest Async"
            description="Recommends the best async format"
          />
          <StepCard
            number={4}
            icon={<Clock className="w-4 h-4" />}
            title="Save Time"
            description="Reclaim hours for deep work"
          />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Scenarios */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="p-5 border-border shadow-card h-full">
              <h3 className="text-lg font-semibold mb-5 flex items-center gap-2 text-foreground">
                <AlertTriangle className="w-5 h-5 text-purple-600" />
                Detection Scenarios
              </h3>

              <div className="space-y-3">
                {scenarios.map((scenario) => (
                  <motion.div
                    key={scenario.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedScenario?.id === scenario.id
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-border hover:border-purple-200 hover:bg-secondary/50'
                    }`}
                    onClick={() => setSelectedScenario(scenario)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{scenario.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {scenario.timezoneSpread}h spread
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {scenario.participants} people
                          </span>
                        </div>
                      </div>
                      <Badge 
                        className={scenario.recommendation === 'async' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-emerald-500 text-white'
                        }
                      >
                        {scenario.recommendation === 'async' ? 'Async' : 'Sync'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Confidence</span>
                          <span className="text-foreground">{scenario.confidence}%</span>
                        </div>
                        <Progress value={scenario.confidence} className="h-1.5" />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mt-3">
                      &ldquo;{scenario.reason}&rdquo;
                    </p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Async Alternatives */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="p-5 border-border shadow-card h-full">
              <h3 className="text-lg font-semibold mb-5 flex items-center gap-2 text-foreground">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                Async Alternatives
              </h3>

              <div className="space-y-3">
                {asyncAlternatives.map((alt) => (
                  <motion.div
                    key={alt.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedAlternative?.id === alt.id
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-border hover:border-purple-200 hover:bg-secondary/50'
                    }`}
                    onClick={() => setSelectedAlternative(alt)}
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}
                        style={{ 
                          background: alt.id === 'loom' 
                            ? 'hsl(260 80% 95%)'
                            : alt.id === 'notion'
                              ? 'hsl(220 90% 95%)'
                              : 'hsl(150 70% 95%)',
                          color: alt.id === 'loom'
                            ? 'hsl(260 80% 55%)'
                            : alt.id === 'notion'
                              ? 'hsl(220 90% 56%)'
                              : 'hsl(150 70% 45%)'
                        }}
                      >
                        {alt.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-foreground">{alt.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            Save {alt.timeSaved}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alt.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {alt.bestFor.map((use) => (
                            <span 
                              key={use}
                              className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                            >
                              {use}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-sm font-medium mb-3 text-foreground">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="text-xs h-8">
                    <Video className="w-3 h-3 mr-1" />
                    Record Loom
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-8">
                    <FileText className="w-3 h-3 mr-1" />
                    Create Doc
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-8">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Start Thread
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid sm:grid-cols-4 gap-4 mt-8"
        >
          <StatCard number="40%" label="Meetings that could be async" />
          <StatCard number="5.5h" label="Avg. time saved per week" />
          <StatCard number="87%" label="Team satisfaction with async" />
          <StatCard number="3.2x" label="More thoughtful feedback" />
        </motion.div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10"
        >
          <Card className="p-8 border-border shadow-card text-center">
            <div className="max-w-2xl mx-auto">
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-lg text-muted-foreground mb-5 leading-relaxed">
                &ldquo;Async Nudge has completely transformed how our global team operates. 
                We went from 15 hours of meetings per week to just 5, and our productivity 
                has never been higher.&rdquo;
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--purple))] flex items-center justify-center text-white font-medium">
                  JD
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Jamie Davidson</p>
                  <p className="text-sm text-muted-foreground">Engineering Lead at RemoteCo</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

function StepCard({ 
  number, 
  icon, 
  title, 
  description 
}: { 
  number: number; 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <Card className="p-4 border-border shadow-soft text-center">
      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-semibold mx-auto mb-3">
        {number}
      </div>
      <div className="text-purple-600 mb-2 flex justify-center">{icon}</div>
      <h4 className="font-medium text-sm mb-1 text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Card>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <Card className="p-4 border-border shadow-soft text-center">
      <p className="text-2xl font-semibold text-purple-600 mb-1">{number}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}
