'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, Clock, Globe, Calendar, Search, 
  Sparkles, AlertCircle, CheckCircle2, Users 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTimezone } from '@/hooks/useTimezone';
import type { MeetingSlot } from '@/types/landing';
import { format } from 'date-fns';

export function Scheduler() {
  const { 
    members, 
    addMember, 
    removeMember, 
    findOptimalSlots, 
    checkAsyncSuggestion,
    getCognitiveSharpness,
    COMMON_TIMEZONES: timezones 
  } = useTimezone();
  
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [meetingDuration, setMeetingDuration] = useState(60);
  const [optimalSlots, setOptimalSlots] = useState<MeetingSlot[]>([]);
  const [showAsyncSuggestion, setShowAsyncSuggestion] = useState(false);
  const [asyncSuggestion, setAsyncSuggestion] = useState<{ suggestAsync: boolean; reason: string; confidence: number } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<MeetingSlot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (members.length >= 2) {
      const slots = findOptimalSlots(meetingDuration);
      setOptimalSlots(slots.slice(0, 6));
      
      const suggestion = checkAsyncSuggestion(members, 'medium');
      setAsyncSuggestion(suggestion);
      setShowAsyncSuggestion(suggestion.suggestAsync);
    } else {
      setOptimalSlots([]);
      setShowAsyncSuggestion(false);
    }
  }, [members, meetingDuration, findOptimalSlots, checkAsyncSuggestion]);

  const handleAddMember = () => {
    if (newMemberName && newMemberEmail) {
      const tz = timezones.find((t: { name: string; offset: number }) => t.name === selectedTimezone);
      addMember({
        name: newMemberName,
        email: newMemberEmail,
        timezone: selectedTimezone,
        timezoneOffset: tz?.offset || 0,
        preferredHours: { start: 9, end: 17 },
      });
      setNewMemberName('');
      setNewMemberEmail('');
      setIsDialogOpen(false);
    }
  };

  const getSharpnessColor = (level: string) => {
    switch (level) {
      case 'peak': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';
      case 'good': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'fair': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700';
      case 'low': return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <section id="scheduler" className="py-24 px-6 bg-gradient-subtle">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-foreground">
            Find your <span className="text-gradient">Golden Window</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Add your team members and discover the fairest meeting times
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Team Members */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-1"
          >
            <Card className="p-5 border-border shadow-card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                  <Users className="w-5 h-5 text-[hsl(var(--brand))]" />
                  Team ({members.length})
                </h3>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1 h-8">
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Add Team Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">Name</label>
                        <Input
                          placeholder="e.g. Sarah Chen"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">Email</label>
                        <Input
                          placeholder="sarah@company.com"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">Timezone</label>
                        <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-80">
                            {timezones.map((tz: { name: string; label: string }) => (
                              <SelectItem key={tz.name} value={tz.name}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={handleAddMember} 
                        className="w-full bg-[hsl(var(--brand))] hover:bg-[hsl(220_90%_50%)] text-white"
                        disabled={!newMemberName || !newMemberEmail}
                      >
                        Add Member
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Member List */}
              <div className="space-y-2 mb-5">
                <AnimatePresence>
                  {members.map((member) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--purple))] flex items-center justify-center text-white font-medium text-sm">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{member.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {member.timezone.split('/')[1]?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeMember(member.id)}
                        className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {members.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No team members yet</p>
                    <p className="text-xs">Add members to find optimal times</p>
                  </div>
                )}
              </div>

              {/* Duration Selector */}
              {members.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block text-foreground">Meeting Duration</label>
                  <Select 
                    value={meetingDuration.toString()} 
                    onValueChange={(v) => setMeetingDuration(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Right Panel - Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-2"
          >
            {/* Async Suggestion Alert */}
            <AnimatePresence>
              {showAsyncSuggestion && asyncSuggestion && (
                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="mb-4"
                >
                  <Card className="p-4 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">Async Nudge</h4>
                          <Badge variant="outline" className="text-xs border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300">
                            {asyncSuggestion.confidence}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {asyncSuggestion.reason}
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-xs h-8 border-amber-300 dark:border-amber-600">
                            Create Loom Instead
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-xs h-8"
                            onClick={() => setShowAsyncSuggestion(false)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Optimal Slots */}
            {members.length >= 2 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <Sparkles className="w-5 h-5 text-[hsl(var(--brand))]" />
                    Optimal Time Slots
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {optimalSlots.length} found
                  </Badge>
                </div>

                <div className="grid gap-3">
                  <AnimatePresence>
                    {optimalSlots.map((slot, index) => (
                      <motion.div
                        key={slot.startTime.toISOString()}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        <Card
                          className={`p-4 cursor-pointer transition-all border hover:shadow-card ${
                            selectedSlot?.startTime === slot.startTime
                              ? 'border-[hsl(var(--brand))] shadow-card bg-[hsl(var(--brand-light))] dark:bg-teal-900/30'
                              : 'border-border'
                          }`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium text-foreground">
                                  {format(slot.startTime, 'EEEE, MMM d')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">
                                  {format(slot.startTime, 'h:mm a')} - {format(slot.endTime, 'h:mm a')} UTC
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {slot.goldenWindow && (
                                <Badge className="bg-amber-500 text-white text-xs">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Golden
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  slot.fairnessScore >= 80
                                    ? 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30'
                                    : slot.fairnessScore >= 60
                                      ? 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30'
                                      : 'border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30'
                                }`}
                              >
                                Fairness: {slot.fairnessScore}%
                              </Badge>
                            </div>
                          </div>

                          {/* Local Times */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {slot.localTimes.map((lt) => {
                              const member = members.find(m => m.id === lt.memberId);
                              const sharpness = getCognitiveSharpness(lt.hour);
                              return (
                                <div 
                                  key={lt.memberId}
                                  className="flex items-center justify-between p-2 rounded-md bg-secondary/50 text-sm"
                                >
                                  <span className="truncate mr-2 text-foreground">{member?.name.split(' ')[0]}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getSharpnessColor(sharpness.level)}`}>
                                    {lt.time}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {selectedSlot && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-3"
                  >
                    <Button 
                      className="w-full bg-[hsl(var(--brand))] hover:bg-[hsl(220_90%_50%)] text-white"
                      size="lg"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Schedule This Meeting
                    </Button>
                  </motion.div>
                )}
              </div>
            ) : (
              <Card className="h-full min-h-[400px] flex items-center justify-center border-border border-dashed bg-secondary/30">
                <div className="text-center p-8">
                  <Search className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-40" />
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Ready to find optimal times</h3>
                  <p className="text-muted-foreground max-w-md text-sm">
                    Add at least 2 team members to see AI-powered meeting time suggestions 
                    with fairness scores and cognitive sharpness analysis.
                  </p>
                </div>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
