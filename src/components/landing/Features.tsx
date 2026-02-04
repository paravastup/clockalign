'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Sun, MessageSquare, Brain, Target, Zap, Clock, Users, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string[];
  color: string;
}

const features: Feature[] = [
  {
    id: 'sacrifice',
    icon: <Trophy className="w-6 h-6" />,
    title: 'Sacrifice Score',
    description: 'Quantified fairness tracking with visible leaderboard',
    details: [
      'Tracks who takes the hit for inconvenient meeting times',
      'Visual leaderboard shows team sacrifice distribution',
      'Algorithm rotates burden to keep things fair',
      'Integrates with Slack/Teams for transparency',
    ],
    color: 'brand',
  },
  {
    id: 'golden',
    icon: <Sun className="w-6 h-6" />,
    title: 'Golden Windows',
    description: 'Find times when everyone\'s actually sharp, not just awake',
    details: [
      'Analyzes circadian rhythms for peak cognitive performance',
      'Considers post-lunch dips and morning grogginess',
      'Finds overlap in peak productivity hours',
      'Prioritizes 10am-12pm and 2pm-4pm slots',
    ],
    color: 'warning',
  },
  {
    id: 'async',
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'Async Nudge',
    description: 'Smart detection when meetings should be async',
    details: [
      'Detects 8+ hour timezone spreads automatically',
      'Suggests async alternatives for low-urgency topics',
      'Analyzes meeting purpose vs. time cost',
      'Recommends Loom, Notion, or Slack instead',
    ],
    color: 'purple',
  },
];

const additionalFeatures = [
  {
    icon: <Brain className="w-5 h-5" />,
    title: 'Cognitive Load Aware',
    description: 'Schedules heavy discussions during peak mental hours',
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: 'Meeting Necessity Score',
    description: 'AI evaluates if a meeting is actually needed',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Instant Fairness Check',
    description: 'See fairness metrics before sending invites',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: 'Smart Duration',
    description: 'Suggests optimal meeting length based on topic',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Team Patterns',
    description: 'Learns your team\'s preferences over time',
  },
];

export function Features() {
  const [activeFeature, setActiveFeature] = useState<string>('sacrifice');

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-foreground">
            Built for <span className="text-gradient">fairness</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three powerful features that transform how global teams schedule meetings
          </p>
        </motion.div>

        {/* Main Features */}
        <div className="grid lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card
                className={`h-full p-6 cursor-pointer transition-all duration-300 border hover:shadow-elevated ${
                  activeFeature === feature.id
                    ? 'border-[hsl(var(--brand))] shadow-card'
                    : 'border-border hover:border-[hsl(var(--brand))]/40'
                }`}
                onClick={() => setActiveFeature(feature.id)}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                    feature.id === 'sacrifice'
                      ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400'
                      : feature.id === 'golden'
                        ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
                        : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                  }`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{feature.description}</p>
                
                {/* Expanded Details */}
                <motion.div
                  initial={false}
                  animate={{ 
                    height: activeFeature === feature.id ? 'auto' : 0,
                    opacity: activeFeature === feature.id ? 1 : 0
                  }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <ul className="space-y-2 pt-4 border-t border-border">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="w-4 h-4 text-[hsl(var(--brand))] flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-xl font-semibold text-center mb-8 text-foreground">And there&apos;s more...</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              >
                <Card className="p-4 h-full border-border hover:border-[hsl(var(--brand))]/30 hover:shadow-card transition-all">
                  <div className="text-[hsl(var(--brand))] mb-3">{feature.icon}</div>
                  <h4 className="font-medium text-sm mb-1 text-foreground">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
