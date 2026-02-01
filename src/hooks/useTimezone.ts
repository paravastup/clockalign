'use client';

import { useState, useCallback } from 'react';
import { format, addHours, startOfDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import type { TeamMember, MeetingSlot } from '@/types/landing';
import { COMMON_TIMEZONES } from '@/types/landing';

export function useTimezone() {
  const [members, setMembers] = useState<TeamMember[]>([]);

  const addMember = useCallback((member: Omit<TeamMember, 'id' | 'sacrificeScore'>) => {
    const newMember: TeamMember = {
      ...member,
      id: crypto.randomUUID(),
      sacrificeScore: 0,
    };
    setMembers(prev => [...prev, newMember]);
    return newMember.id;
  }, []);

  const removeMember = useCallback((id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateSacrificeScore = useCallback((memberId: string, delta: number) => {
    setMembers(prev => prev.map(m => 
      m.id === memberId 
        ? { ...m, sacrificeScore: Math.max(0, m.sacrificeScore + delta) }
        : m
    ));
  }, []);

  const getLocalTime = useCallback((utcDate: Date, timezone: string): { time: string; hour: number } => {
    const time = formatInTimeZone(utcDate, timezone, 'h:mm a');
    const hour = parseInt(formatInTimeZone(utcDate, timezone, 'H'));
    return { time, hour };
  }, []);

  const calculateFairnessScore = useCallback((localHours: number[]): number => {
    let totalScore = 0;
    
    for (const hour of localHours) {
      if (hour >= 9 && hour <= 17) {
        // Peak hours: 10-16
        if (hour >= 10 && hour <= 16) {
          totalScore += 100;
        } else {
          totalScore += 80;
        }
      } else if (hour >= 7 && hour < 9) {
        totalScore += 50; // Early morning
      } else if (hour > 17 && hour <= 19) {
        totalScore += 60; // Evening
      } else if (hour >= 20 || hour < 7) {
        totalScore += 10; // Night hours - heavy penalty
      }
    }
    
    return Math.round(totalScore / localHours.length);
  }, []);

  const findOptimalSlots = useCallback((duration: number = 60, daysAhead: number = 7): MeetingSlot[] => {
    if (members.length < 2) return [];
    
    const slots: MeetingSlot[] = [];
    const now = new Date();
    const startDate = startOfDay(now);
    
    // Check every hour for the next 7 days
    for (let day = 0; day < daysAhead; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const slotStart = addHours(startDate, day * 24 + hour);
        const slotEnd = addHours(slotStart, duration / 60);
        
        const localTimes = members.map(member => {
          const { time, hour: localHour } = getLocalTime(slotStart, member.timezone);
          const isPreferred = localHour >= member.preferredHours.start && 
                             localHour < member.preferredHours.end;
          const isNight = localHour >= 22 || localHour < 6;
          const isEarly = localHour >= 6 && localHour < 9;
          
          return {
            memberId: member.id,
            time,
            hour: localHour,
            isPreferred,
            isNight,
            isEarly,
          };
        });
        
        const localHours = localTimes.map(lt => lt.hour);
        const fairnessScore = calculateFairnessScore(localHours);
        
        // Calculate average sacrifice based on how far from preferred hours
        let totalSacrifice = 0;
        localTimes.forEach((lt, idx) => {
          const member = members[idx];
          if (!lt.isPreferred) {
            const preferredMid = (member.preferredHours.start + member.preferredHours.end) / 2;
            const distance = Math.abs(lt.hour - preferredMid);
            totalSacrifice += Math.min(distance * 5, 50);
          }
        });
        
        // Golden window: everyone in preferred hours
        const goldenWindow = localTimes.every(lt => lt.isPreferred);
        
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          utcTime: format(slotStart, 'MMM d, h:mm a'),
          localTimes,
          fairnessScore,
          averageSacrifice: Math.round(totalSacrifice / members.length),
          goldenWindow,
        });
      }
    }
    
    // Sort by fairness score descending, then by golden window
    return slots.sort((a, b) => {
      if (b.goldenWindow !== a.goldenWindow) {
        return b.goldenWindow ? 1 : -1;
      }
      return b.fairnessScore - a.fairnessScore;
    });
  }, [members, getLocalTime, calculateFairnessScore]);

  const getSacrificeLeaderboard = useCallback((): { member: TeamMember; rank: number }[] => {
    const sorted = [...members].sort((a, b) => b.sacrificeScore - a.sacrificeScore);
    return sorted.map((member, idx) => ({ member, rank: idx + 1 }));
  }, [members]);

  const checkAsyncSuggestion = useCallback((participants: TeamMember[], urgency: 'low' | 'medium' | 'high'): {
    suggestAsync: boolean;
    reason: string;
    confidence: number;
  } => {
    const timezones = participants.map(p => p.timezoneOffset);
    const minOffset = Math.min(...timezones);
    const maxOffset = Math.max(...timezones);
    const spread = maxOffset - minOffset;
    
    // If spread is > 8 hours, suggest async
    if (spread > 10) {
      return {
        suggestAsync: true,
        reason: `Team spans ${spread} hours - no overlap in working hours`,
        confidence: 95,
      };
    }
    
    if (spread > 8) {
      return {
        suggestAsync: true,
        reason: `Large timezone spread (${spread}h) makes synchronous meetings difficult`,
        confidence: 80,
      };
    }
    
    if (spread > 6 && urgency === 'low') {
      return {
        suggestAsync: true,
        reason: 'Low urgency + 6+ hour spread = perfect for async',
        confidence: 75,
      };
    }
    
    return {
      suggestAsync: false,
      reason: 'Synchronous meeting is feasible',
      confidence: 90,
    };
  }, []);

  const getCognitiveSharpness = useCallback((hour: number): { level: 'peak' | 'good' | 'fair' | 'low'; score: number } => {
    // Based on circadian rhythms and cognitive performance research
    if (hour >= 10 && hour <= 12) {
      return { level: 'peak', score: 95 };
    } else if (hour >= 14 && hour <= 16) {
      return { level: 'peak', score: 90 };
    } else if (hour >= 9 && hour < 10) {
      return { level: 'good', score: 85 };
    } else if (hour >= 13 && hour < 14) {
      return { level: 'fair', score: 70 }; // Post-lunch dip
    } else if (hour >= 16 && hour <= 18) {
      return { level: 'good', score: 80 };
    } else if (hour >= 7 && hour < 9) {
      return { level: 'fair', score: 65 };
    } else if (hour >= 19 && hour <= 21) {
      return { level: 'fair', score: 60 };
    } else {
      return { level: 'low', score: 30 };
    }
  }, []);

  return {
    members,
    addMember,
    removeMember,
    updateSacrificeScore,
    findOptimalSlots,
    getSacrificeLeaderboard,
    checkAsyncSuggestion,
    getCognitiveSharpness,
    getLocalTime,
    COMMON_TIMEZONES,
  };
}
