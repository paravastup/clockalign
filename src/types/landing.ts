export interface TeamMember {
  id: string;
  name: string;
  email: string;
  timezone: string;
  timezoneOffset: number;
  avatar?: string;
  sacrificeScore: number;
  preferredHours: { start: number; end: number };
}

export interface MeetingSlot {
  startTime: Date;
  endTime: Date;
  utcTime: string;
  localTimes: {
    memberId: string;
    time: string;
    hour: number;
    isPreferred: boolean;
    isNight: boolean;
    isEarly: boolean;
  }[];
  fairnessScore: number;
  averageSacrifice: number;
  goldenWindow: boolean;
}

export interface SacrificeEntry {
  memberId: string;
  memberName: string;
  score: number;
  lastMeeting: Date;
  streak: number;
}

export interface AsyncSuggestion {
  reason: string;
  confidence: number;
  alternative: string;
}

export type TimeZone = {
  name: string;
  label: string;
  offset: number;
};

export const COMMON_TIMEZONES: TimeZone[] = [
  { name: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)', offset: -8 },
  { name: 'America/Denver', label: 'Denver (MST/MDT)', offset: -7 },
  { name: 'America/Chicago', label: 'Chicago (CST/CDT)', offset: -6 },
  { name: 'America/New_York', label: 'New York (EST/EDT)', offset: -5 },
  { name: 'America/Sao_Paulo', label: 'São Paulo (BRT)', offset: -3 },
  { name: 'Europe/London', label: 'London (GMT/BST)', offset: 0 },
  { name: 'Europe/Paris', label: 'Paris (CET/CEST)', offset: 1 },
  { name: 'Europe/Berlin', label: 'Berlin (CET/CEST)', offset: 1 },
  { name: 'Europe/Moscow', label: 'Moscow (MSK)', offset: 3 },
  { name: 'Asia/Dubai', label: 'Dubai (GST)', offset: 4 },
  { name: 'Asia/Kolkata', label: 'Mumbai (IST)', offset: 5.5 },
  { name: 'Asia/Bangkok', label: 'Bangkok (ICT)', offset: 7 },
  { name: 'Asia/Singapore', label: 'Singapore (SGT)', offset: 8 },
  { name: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: 8 },
  { name: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 9 },
  { name: 'Asia/Seoul', label: 'Seoul (KST)', offset: 9 },
  { name: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', offset: 10 },
  { name: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)', offset: 12 },
];
