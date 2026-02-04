# ClockAlign — Product Requirements Document
**Version:** 1.0  
**Last Updated:** 2025-07-14  
**Author:** Lead Architect (Claude Opus)  
**Status:** Ready for Development

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [User Personas](#2-user-personas)
3. [Core Features](#3-core-features)
4. [User Flows](#4-user-flows)
5. [Data Model](#5-data-model)
6. [API Endpoints](#6-api-endpoints)
7. [MVP Scope](#7-mvp-scope)
8. [Success Metrics](#8-success-metrics)
9. [6-Day Sprint Plan](#9-6-day-sprint-plan)
10. [Technical Architecture](#10-technical-architecture)
11. [Open Questions & Risks](#11-open-questions--risks)

---

## 1. Executive Summary

### 1.1 Problem Statement
Distributed teams waste **4.2 hours per week** on timezone coordination. Existing tools (WorldTimeBuddy, timeanddate.com, Zonewise) answer "when can we meet?" but ignore:
- **Fairness** — The same people always take the 6 AM or 11 PM calls
- **Cognitive performance** — Finding overlap ≠ finding productive overlap
- **Meeting necessity** — Many cross-timezone syncs should be async

### 1.2 Solution
ClockAlign is a timezone-aware meeting scheduler that optimizes for **fairness**, **cognitive sharpness**, and **meeting necessity**—not just availability.

### 1.3 Core Value Propositions
| Feature | Pain Point | ClockAlign Solution |
|---------|------------|---------------------|
| Sacrifice Score™ | "I always take the bad slot" | Quantified fairness + auto-rotation |
| Golden Windows | "We're all zombies on this call" | Energy-optimized scheduling |
| Async Nudge | "This meeting could've been an email" | Smart async suggestions + templates |

### 1.4 Target Launch
**MVP in 6 days** — Core scheduling with Sacrifice Score visible. Golden Windows basic. Async Nudge trigger only (no Loom integration).

### 1.5 Success Vision (6 months)
- 10,000 MAU
- 50,000 meetings scheduled
- "Hours Reclaimed" metric goes viral on Twitter/LinkedIn

---

## 2. User Personas

### 2.1 Primary: "Distributed Dev Lead Dana" 👩‍💻
**Demographics:** 32, Engineering Manager at a startup, SF-based  
**Team:** 8 engineers across SF, London, Bangalore, Sydney  
**Pain Points:**
- Spends 3+ hours/week coordinating standups and 1:1s
- Feels guilty asking Bangalore team to join 7 AM calls repeatedly
- Half her meetings could be Loom videos

**Goals:**
- Reduce coordination overhead
- Be fair to remote teammates
- Prove to leadership that some syncs aren't needed

**Quote:** *"I just want to schedule a meeting without a 15-message Slack thread about timezones"*

---

### 2.2 Secondary: "Global Sales Sam" 🌍
**Demographics:** 28, Account Executive, NYC-based  
**Clients:** Enterprise accounts in EMEA and APAC  
**Pain Points:**
- Constantly calculating timezone offsets manually
- Books calls at bad times for clients, hurts relationships
- No visibility into when clients are actually sharp vs. just available

**Goals:**
- Book meetings when clients are energized
- Never accidentally schedule a 5 AM call again
- Track which accounts he's asked for "sacrifice" slots

**Quote:** *"I lost a deal because I kept scheduling demos at their lunch hour"*

---

### 2.3 Tertiary: "Remote Worker Riley" 🏠
**Demographics:** 26, Product Designer, Lisbon (works with NYC company)  
**Pain Points:**
- Always the one taking evening calls
- Feels like an outsider because of timezone
- Wants proof when asking for fairer scheduling

**Goals:**
- Have data to advocate for rotating meeting times
- Feel included despite timezone
- Take fewer "career damage" meeting slots

**Quote:** *"Show me the receipts—I've taken 80% of the bad slots this quarter"*

---

## 3. Core Features

### 3.1 Sacrifice Score™ 📊

#### 3.1.1 Concept
A quantified "pain index" that tracks the timezone burden each participant bears for meetings. Displayed as a leaderboard to create visibility and accountability around fairness.

#### 3.1.2 Pain Point Calculation
| Local Time | Pain Points | Category | Rationale |
|------------|-------------|----------|-----------|
| 9 AM - 6 PM | 0 | Core hours | Normal workday |
| 8 AM - 9 AM | 1 | Early start | Mild inconvenience |
| 6 PM - 8 PM | 2 | Evening encroachment | Personal time |
| 6 AM - 8 AM | 3 | Early morning | Sleep disruption likely |
| 8 PM - 10 PM | 4 | Late evening | Significant personal sacrifice |
| 10 PM - 12 AM | 6 | Night | Severe family/health impact |
| 12 AM - 6 AM | 10 | Graveyard | "Career damage" territory |

**Multipliers:**
- Meeting duration: `pain × (duration_minutes / 30)`
- Recurring meetings: `pain × 1.5` (compounding effect)
- Meeting organizer: `pain × 0.8` (they chose to organize)

#### 3.1.3 Leaderboard Display
```
📊 Team Sacrifice Scores (Last 30 Days)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🥇 Priya (Bangalore)      142 pts  ████████████████░░░░
🥈 Tom (London)            89 pts  ██████████░░░░░░░░░░
🥉 Dana (SF)               34 pts  ████░░░░░░░░░░░░░░░░
   Jake (Sydney)           28 pts  ███░░░░░░░░░░░░░░░░░

⚠️ Priya has 4x the sacrifice of the team average
   → Suggest: Rotate next 3 recurring meetings
```

#### 3.1.4 Auto-Rotation Logic (V1.5)
For recurring meetings where one timezone consistently suffers:
1. Detect imbalance: One participant has 3x+ average pain score
2. Propose rotation schedule: "Alternate between 8 AM PT and 4 PM PT"
3. Show projected fairness: "This balances scores within 20% over 8 weeks"

#### 3.1.5 Karma Reports (V2)
Monthly email digest:
- Your sacrifice score vs. team average
- "You saved 4.2 hours by going async"
- Recognition: "🏆 Most Fair Organizer: Dana scheduled 0 graveyard slots"

---

### 3.2 Golden Windows ✨

#### 3.2.1 Concept
Find meeting times when participants are **cognitively sharp**, not just awake. Uses energy curves + availability to find optimal overlap.

#### 3.2.2 Cognitive Sharpness Model
Default energy curve (customizable per user):

| Time Block | Sharpness Score | Notes |
|------------|-----------------|-------|
| 6-8 AM | 60% | Waking up, variable |
| 8-10 AM | 90% | Morning peak |
| 10 AM-12 PM | 95% | Maximum focus |
| 12-2 PM | 65% | Post-lunch dip |
| 2-4 PM | 80% | Afternoon recovery |
| 4-6 PM | 85% | Secondary peak |
| 6-8 PM | 70% | Winding down |
| 8 PM+ | 50% | Evening fatigue |

**Overlap Calculation:**
```
golden_score = (participant_1_sharpness + participant_2_sharpness + ...) / n
```

For a 3-person meeting (SF 10 AM = 95%, London 6 PM = 85%, Bangalore 10:30 PM = 50%):
```
golden_score = (95 + 85 + 50) / 3 = 76.7%
```

#### 3.2.3 Heat Map Visualization
24-hour grid showing:
- Green zones: 80%+ collective sharpness
- Yellow zones: 60-80% collective sharpness  
- Red zones: <60% or outside availability
- Gray zones: Someone sleeping/unavailable

```
       SF        London    Bangalore    Collective
       (UTC-7)   (UTC+1)   (UTC+5:30)   Sharpness
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6 AM   [60%]     [  💤  ]   [  💤  ]      ░░░░░
8 AM   [90%]     [70%]      [  💤  ]      ░░░░░
10 AM  [95%]     [85%]      [50%]         ██░░░  76%
12 PM  [65%]     [70%]      [65%]         ██░░░  67%
2 PM   [80%]     [50%]      [80%]         ██░░░  70%
4 PM   [85%]     [  💤  ]   [90%]         ░░░░░
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                            ✨ Best: 10 AM SF (76%)
```

#### 3.2.4 Customization Options
Users can set:
- Personal energy curve (morning person vs. night owl)
- Focus hours (no meetings 9-11 AM)
- Hard boundaries (never before 8 AM, never after 7 PM)

---

### 3.3 Async Nudge 🔔

#### 3.3.1 Trigger Conditions
Async Nudge appears when:
- **Timezone spread ≥ 5 hours** between any two participants
- **Any participant would score 4+ pain points**
- **Meeting type** is flagged as async-friendly (status updates, reviews, announcements)

#### 3.3.2 Nudge UI
```
┌────────────────────────────────────────────────┐
│  🤔 This meeting could be async               │
│                                                │
│  With a 9-hour timezone spread, someone       │
│  will always sacrifice. Consider:             │
│                                                │
│  📹 Record a Loom instead (est. 8 min)        │
│  📄 Create a shared doc for async comments    │
│  📊 Use a poll for quick decisions            │
│                                                │
│  [Schedule Anyway]  [Go Async →]              │
│                                                │
│  💡 Teams using async save 4.2 hrs/week       │
└────────────────────────────────────────────────┘
```

#### 3.3.3 "Go Async" Flow (V1 - Basic)
1. User clicks "Go Async"
2. Modal: "What's the purpose of this meeting?"
   - Status update
   - Decision needed
   - Brainstorm
   - Other: ___
3. Generate template based on purpose
4. Copy to clipboard or create Notion/Google Doc

#### 3.3.4 "Go Async" Flow (V2 - Integrated)
1. One-click Loom recording prompt
2. Auto-generate doc template with:
   - Context section (pre-filled from meeting title/description)
   - Questions section (for async responses)
   - Deadline for async responses
3. Distribute to invitees with personalized timezones
4. Track "Hours Reclaimed" metric

#### 3.3.5 Hours Reclaimed Tracking
```
📈 Your Async Impact
━━━━━━━━━━━━━━━━━━━━
This month: 12 meetings → async
Hours reclaimed: 18.5 hrs
Sacrifice points avoided: 89

🌍 Team total: 142 hours reclaimed
```

---

## 4. User Flows

### 4.1 New User Onboarding

```
┌─────────────────────────────────────────────────────────────┐
│                         START                                │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Landing Page                                             │
│     - Value prop: "Schedule fair meetings across timezones" │
│     - CTA: "Get Started Free"                                │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Sign Up                                                  │
│     - Google OAuth (primary)                                 │
│     - Magic Link (secondary)                                 │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Timezone Detection                                       │
│     - Auto-detect from browser                              │
│     - Confirm: "You're in San Francisco (UTC-7)?"           │
│     - Option to override                                     │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Calendar Connection (Optional but encouraged)            │
│     - "Connect Google Calendar to see your availability"    │
│     - Permissions: Read-only for MVP                         │
│     - Skip option available                                  │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Energy Profile (Optional - 30 sec)                       │
│     - "Are you a morning person or night owl?"              │
│     - Quick slider: Early bird ←→ Night owl                 │
│     - "When are your focus hours?" (multi-select blocks)    │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Dashboard                                                │
│     - Empty state: "Schedule your first meeting"            │
│     - Quick action cards                                     │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.2 Schedule a Meeting Flow

```
User Action                          System Response
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Click "New Meeting"               → Open meeting composer
   
2. Enter meeting details:            
   - Title: "Weekly Sync"
   - Duration: 30 min
   - Type: Recurring / One-time
   
3. Add participants:                 → For each participant:
   - dana@company.com                  - Lookup timezone from profile
   - priya@company.com                 - Or prompt: "What's Priya's timezone?"
   - tom@company.com                   - Show: "3 people, 3 timezones"

4. Click "Find Times"                → System calculates:
                                       - All possible 30-min slots
                                       - Sacrifice Score per slot
                                       - Golden Window score per slot
                                       - Filters by availability (if connected)

5. View Results:                     → Heat map + ranked list:
   ┌────────────────────────────────────────────────────┐
   │ 🏆 Recommended: Tuesday 9 AM PT                    │
   │    Golden Score: 82% | Total Sacrifice: 4 pts     │
   │    ├─ Dana (SF): 9 AM ☀️ [0 pts]                  │
   │    ├─ Tom (London): 5 PM 🌆 [2 pts]               │
   │    └─ Priya (Bangalore): 9:30 PM 🌙 [2 pts]       │
   ├────────────────────────────────────────────────────┤
   │ ⚠️ Alternative: Tuesday 6 AM PT                    │
   │    Golden Score: 71% | Total Sacrifice: 5 pts     │
   │    ├─ Dana (SF): 6 AM 😴 [3 pts]                  │
   │    ├─ Tom (London): 2 PM ☀️ [0 pts]               │
   │    └─ Priya (Bangalore): 6:30 PM 🌆 [2 pts]       │
   └────────────────────────────────────────────────────┘

   [IF timezone spread ≥ 5 hours]
   ┌────────────────────────────────────────────────────┐
   │ 💡 Async Nudge: This could be a Loom + Doc        │
   │    [Learn More] [Go Async]                         │
   └────────────────────────────────────────────────────┘

6. Select a time slot               → Confirm screen:
                                      - Summary of time in each TZ
                                      - Sacrifice distribution
                                      - "Priya: This is your 4th late
                                         meeting this month. Rotate next?"

7. Confirm & Send                   → Actions:
                                      - Create calendar event (if connected)
                                      - Send email invites
                                      - Update Sacrifice Scores
                                      - Log for analytics
```

---

### 4.3 View Sacrifice Leaderboard Flow

```
User Action                          System Response
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Navigate to "Team Fairness"       → Load leaderboard
   (from sidebar or dashboard)

2. View Leaderboard:                 
   ┌─────────────────────────────────────────────────────────┐
   │ 📊 Sacrifice Scores — Engineering Team                  │
   │    Period: Last 30 days  [▼ Change]                    │
   ├─────────────────────────────────────────────────────────┤
   │                                                         │
   │ 🥇 Priya (Bangalore)    142 pts  ████████████████░░░░  │
   │    └─ 8 late nights, 3 early mornings                  │
   │                                                         │
   │ 🥈 Tom (London)          89 pts  ██████████░░░░░░░░░░  │
   │    └─ 12 evening calls                                 │
   │                                                         │
   │ 🥉 Dana (SF)             34 pts  ████░░░░░░░░░░░░░░░░  │
   │    └─ 2 early mornings                                 │
   │                                                         │
   │    Jake (Sydney)         28 pts  ███░░░░░░░░░░░░░░░░░  │
   │    └─ 4 late evenings                                  │
   │                                                         │
   ├─────────────────────────────────────────────────────────┤
   │ ⚠️ FAIRNESS ALERT                                       │
   │ Priya has 4.2x the team average sacrifice.             │
   │                                                         │
   │ [Suggest Rotation] [See Breakdown]                      │
   └─────────────────────────────────────────────────────────┘

3. Click "See Breakdown"             → Drill-down view:
   
   ┌─────────────────────────────────────────────────────────┐
   │ Priya's Sacrifice Breakdown                             │
   ├─────────────────────────────────────────────────────────┤
   │ By Meeting:                                             │
   │ • Weekly Standup (Mon)     — 48 pts (10:30 PM local)   │
   │ • Sprint Planning (Tue)   — 36 pts (9:00 PM local)    │
   │ • 1:1 with Dana (Wed)      — 24 pts (11:00 PM local)   │
   │ • Team Retro (Fri)         — 34 pts (10:00 PM local)   │
   │                                                         │
   │ By Time Category:                                       │
   │ • Late evening (8-10 PM)  — 42%                        │
   │ • Night (10 PM-12 AM)     — 58%                        │
   │                                                         │
   │ Trend: ↗️ +23% vs last month                            │
   └─────────────────────────────────────────────────────────┘

4. Click "Suggest Rotation"          → Rotation wizard:
   
   ┌─────────────────────────────────────────────────────────┐
   │ 🔄 Rotation Suggestion for Weekly Standup              │
   ├─────────────────────────────────────────────────────────┤
   │ Current: Every Monday 9 AM PT                          │
   │          Priya: 10:30 PM (6 pts/week)                  │
   │                                                         │
   │ Proposed Rotation:                                      │
   │ • Week 1: 9 AM PT (Priya late, others good)           │
   │ • Week 2: 5 PM PT (Dana early, Priya good)            │
   │ • Week 3: 9 AM PT                                      │
   │ • Week 4: 5 PM PT                                      │
   │                                                         │
   │ Projected Impact:                                       │
   │ • Priya: 142 → 71 pts (-50%)                          │
   │ • Dana: 34 → 52 pts (+53%)                            │
   │ • More balanced distribution ✓                         │
   │                                                         │
   │ [Apply Rotation] [Customize] [Cancel]                  │
   └─────────────────────────────────────────────────────────┘
```

---

## 5. Data Model

### 5.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │     teams       │       │  team_members   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │───┐   │ id (PK)         │───┐   │ id (PK)         │
│ email           │   │   │ name            │   │   │ team_id (FK)    │──→ teams
│ name            │   │   │ created_by (FK) │──→│   │ user_id (FK)    │──→ users
│ timezone        │   │   │ created_at      │   │   │ role            │
│ energy_profile  │   │   └─────────────────┘   │   │ joined_at       │
│ avatar_url      │   │                         │   └─────────────────┘
│ google_id       │   │                         │
│ created_at      │   │                         │
└─────────────────┘   │                         │
        │             │                         │
        │             │                         │
        ▼             │                         │
┌─────────────────┐   │   ┌─────────────────┐   │
│ energy_curves   │   │   │    meetings     │   │
├─────────────────┤   │   ├─────────────────┤   │
│ id (PK)         │   │   │ id (PK)         │   │
│ user_id (FK)    │───┘   │ title           │   │
│ hour (0-23)     │       │ description     │   │
│ sharpness (0-1) │       │ duration_min    │   │
│ is_available    │       │ meeting_type    │   │
└─────────────────┘       │ organizer_id(FK)│───┘
                          │ team_id (FK)    │──→ teams
                          │ is_recurring    │
                          │ recurrence_rule │
                          │ created_at      │
                          └─────────────────┘
                                  │
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ meeting_slots   │       │  participants   │       │sacrifice_scores │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ meeting_id (FK) │       │ meeting_id (FK) │       │ participant_id  │
│ start_time (UTC)│       │ user_id (FK)    │       │ meeting_slot_id │
│ end_time (UTC)  │       │ email           │       │ points          │
│ status          │       │ timezone        │       │ local_time      │
│ golden_score    │       │ status          │       │ category        │
│ total_sacrifice │       │ responded_at    │       │ calculated_at   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                            │
                                                            │
                                                            ▼
                                                    ┌─────────────────┐
                                                    │ async_decisions │
                                                    ├─────────────────┤
                                                    │ id (PK)         │
                                                    │ meeting_id (FK) │
                                                    │ decision        │
                                                    │ hours_saved     │
                                                    │ created_at      │
                                                    └─────────────────┘
```

### 5.2 Table Definitions

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  timezone VARCHAR(50) NOT NULL, -- e.g., 'America/Los_Angeles'
  energy_profile JSONB DEFAULT '{"type": "default"}',
  avatar_url TEXT,
  google_id VARCHAR(255) UNIQUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### teams
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### team_members
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'owner', 'admin', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);
```

#### meetings
```sql
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  meeting_type VARCHAR(50), -- 'standup', 'planning', '1on1', 'review', 'other'
  organizer_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule JSONB, -- iCal RRULE format
  external_calendar_id VARCHAR(255), -- Google Calendar event ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### meeting_slots
```sql
CREATE TABLE meeting_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'proposed', -- 'proposed', 'confirmed', 'cancelled'
  golden_score DECIMAL(5,2), -- 0.00 to 100.00
  total_sacrifice_points INTEGER DEFAULT 0,
  google_event_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### participants
```sql
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id), -- NULL if external
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  timezone VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'tentative'
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### sacrifice_scores
```sql
CREATE TABLE sacrifice_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  meeting_slot_id UUID REFERENCES meeting_slots(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  local_start_time TIME NOT NULL,
  category VARCHAR(20) NOT NULL, -- 'core', 'early', 'evening', 'night', 'graveyard'
  multiplier DECIMAL(3,2) DEFAULT 1.0,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### async_decisions
```sql
CREATE TABLE async_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  decision VARCHAR(20) NOT NULL, -- 'went_async', 'scheduled_anyway'
  original_sacrifice_points INTEGER,
  hours_saved DECIMAL(4,2),
  async_type VARCHAR(50), -- 'loom', 'doc', 'poll'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### energy_curves (for custom energy profiles)
```sql
CREATE TABLE energy_curves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  sharpness DECIMAL(3,2) NOT NULL CHECK (sharpness >= 0 AND sharpness <= 1),
  is_available BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, hour)
);
```

### 5.3 Indexes
```sql
-- Performance indexes
CREATE INDEX idx_participants_meeting ON participants(meeting_id);
CREATE INDEX idx_participants_user ON participants(user_id);
CREATE INDEX idx_meeting_slots_meeting ON meeting_slots(meeting_id);
CREATE INDEX idx_meeting_slots_time ON meeting_slots(start_time);
CREATE INDEX idx_sacrifice_scores_participant ON sacrifice_scores(participant_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- Full-text search on meetings
CREATE INDEX idx_meetings_title_search ON meetings USING gin(to_tsvector('english', title));
```

---

## 6. API Endpoints

### 6.1 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| POST | `/api/auth/magic-link` | Send magic link email |
| GET | `/api/auth/verify` | Verify magic link token |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |

### 6.2 Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PATCH | `/api/users/me` | Update profile (timezone, name, etc.) |
| GET | `/api/users/me/energy-curve` | Get energy curve settings |
| PUT | `/api/users/me/energy-curve` | Update energy curve |
| GET | `/api/users/me/sacrifice-score` | Get user's sacrifice score |
| GET | `/api/users/search?email=` | Search users by email |

### 6.3 Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/teams` | Create a team |
| GET | `/api/teams` | List user's teams |
| GET | `/api/teams/:id` | Get team details |
| PATCH | `/api/teams/:id` | Update team settings |
| DELETE | `/api/teams/:id` | Delete team |
| POST | `/api/teams/:id/invite` | Invite member by email |
| DELETE | `/api/teams/:id/members/:userId` | Remove member |
| GET | `/api/teams/:id/sacrifice-leaderboard` | Get team sacrifice scores |

### 6.4 Meetings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/meetings` | Create a meeting |
| GET | `/api/meetings` | List user's meetings |
| GET | `/api/meetings/:id` | Get meeting details |
| PATCH | `/api/meetings/:id` | Update meeting |
| DELETE | `/api/meetings/:id` | Delete meeting |
| POST | `/api/meetings/:id/find-times` | Find optimal meeting times |
| POST | `/api/meetings/:id/confirm-slot` | Confirm a time slot |
| POST | `/api/meetings/:id/go-async` | Convert to async |

#### Request/Response Examples

**POST `/api/meetings`**
```json
// Request
{
  "title": "Weekly Standup",
  "description": "Team sync",
  "duration_minutes": 30,
  "meeting_type": "standup",
  "is_recurring": true,
  "recurrence_rule": {
    "frequency": "weekly",
    "day_of_week": "monday"
  },
  "participants": [
    { "email": "dana@company.com" },
    { "email": "priya@company.com", "timezone": "Asia/Kolkata" },
    { "email": "tom@company.com", "timezone": "Europe/London" }
  ],
  "team_id": "uuid-optional"
}

// Response
{
  "id": "meeting-uuid",
  "title": "Weekly Standup",
  "participants": [
    { "id": "p1", "email": "dana@company.com", "timezone": "America/Los_Angeles", "status": "pending" },
    { "id": "p2", "email": "priya@company.com", "timezone": "Asia/Kolkata", "status": "pending" },
    { "id": "p3", "email": "tom@company.com", "timezone": "Europe/London", "status": "pending" }
  ],
  "timezone_spread_hours": 12.5,
  "async_nudge_triggered": true,
  "created_at": "2024-01-15T10:00:00Z"
}
```

**POST `/api/meetings/:id/find-times`**
```json
// Request
{
  "date_range": {
    "start": "2024-01-15",
    "end": "2024-01-19"
  },
  "preferences": {
    "prefer_golden_window": true,
    "avoid_lunch": true,
    "working_hours_only": true
  }
}

// Response
{
  "meeting_id": "meeting-uuid",
  "suggestions": [
    {
      "start_time": "2024-01-16T17:00:00Z",
      "end_time": "2024-01-16T17:30:00Z",
      "golden_score": 82.5,
      "total_sacrifice_points": 4,
      "participants": [
        {
          "email": "dana@company.com",
          "local_time": "9:00 AM",
          "timezone": "America/Los_Angeles",
          "sharpness": 95,
          "sacrifice_points": 0,
          "sacrifice_category": "core"
        },
        {
          "email": "priya@company.com",
          "local_time": "10:30 PM",
          "timezone": "Asia/Kolkata",
          "sharpness": 50,
          "sacrifice_points": 4,
          "sacrifice_category": "late_evening"
        },
        {
          "email": "tom@company.com",
          "local_time": "5:00 PM",
          "timezone": "Europe/London",
          "sharpness": 85,
          "sacrifice_points": 0,
          "sacrifice_category": "core"
        }
      ],
      "rank": 1,
      "recommended": true
    },
    // ... more suggestions
  ],
  "async_nudge": {
    "triggered": true,
    "reason": "timezone_spread",
    "spread_hours": 12.5,
    "max_sacrifice": 4,
    "suggestion": "Consider a Loom video for this status update"
  }
}
```

### 6.5 Calendar Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/connect` | Initiate Google Calendar OAuth |
| GET | `/api/calendar/callback` | OAuth callback |
| GET | `/api/calendar/availability` | Get user's busy times |
| POST | `/api/calendar/events` | Create calendar event |
| DELETE | `/api/calendar/disconnect` | Disconnect calendar |

### 6.6 Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/sacrifice-score` | User's sacrifice trends |
| GET | `/api/analytics/async-impact` | Hours reclaimed by going async |
| GET | `/api/analytics/team-fairness` | Team fairness metrics |

---

## 7. MVP Scope

### 7.1 V1 (MVP) — 6 Days

#### ✅ In Scope
| Feature | Details | Priority |
|---------|---------|----------|
| **Auth** | Google OAuth + Magic Link | P0 |
| **User Profile** | Timezone detection, manual override | P0 |
| **Meeting Creation** | Title, duration, add participants by email | P0 |
| **Timezone Lookup** | Detect participant timezone or manual entry | P0 |
| **Find Times** | List possible slots with local times shown | P0 |
| **Sacrifice Score (Display)** | Calculate and show points per slot | P0 |
| **Golden Window (Basic)** | Default energy curve, show score per slot | P1 |
| **Async Nudge (Trigger)** | Show nudge when spread ≥ 5 hours | P1 |
| **Leaderboard (Basic)** | Show team sacrifice scores, no rotation | P1 |
| **Email Invites** | Send meeting invites via email | P1 |
| **Mobile Responsive** | Works on mobile browsers | P2 |

#### ❌ Out of Scope for V1
| Feature | Reason | Target Version |
|---------|--------|----------------|
| Auto-rotation for recurring meetings | Complex logic | V1.5 |
| Custom energy curves | Nice-to-have | V1.5 |
| Loom integration | External dependency | V2 |
| Google Calendar write (create events) | OAuth scope complexity | V1.5 |
| Slack integration | Distraction | V2 |
| Karma Reports (email digest) | Not essential for launch | V1.5 |
| Polling/voting on times | Complexity | V2 |
| Mobile app | Web-first | V3 |

### 7.2 Feature Flags
```typescript
const FEATURE_FLAGS = {
  // V1 - Launch
  SACRIFICE_SCORE: true,
  GOLDEN_WINDOWS_BASIC: true,
  ASYNC_NUDGE_TRIGGER: true,
  
  // V1.5 - Post-launch
  AUTO_ROTATION: false,
  CUSTOM_ENERGY_CURVES: false,
  CALENDAR_WRITE: false,
  KARMA_REPORTS: false,
  
  // V2
  LOOM_INTEGRATION: false,
  HOURS_RECLAIMED_TRACKING: false,
  SLACK_INTEGRATION: false,
};
```

### 7.3 Technical Constraints for MVP
- **Database:** Supabase (Postgres + Auth + Edge Functions)
- **Frontend:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Email:** Resend (simple, good DX)
- **Hosting:** Vercel
- **No background jobs** in V1 (all sync)

---

## 8. Success Metrics

### 8.1 North Star Metric
**"Hours of Meeting Hell Avoided"**
```
= (meetings_converted_to_async × avg_meeting_duration) 
  + (high_sacrifice_slots_avoided × time_value_per_slot)
```

### 8.2 Primary Metrics (V1)

| Metric | Target (30 days post-launch) | Measurement |
|--------|------------------------------|-------------|
| **Signups** | 500 users | Supabase auth count |
| **Meetings Scheduled** | 200 meetings | Database count |
| **Async Nudge Acceptance** | 15% click "Go Async" | Event tracking |
| **Retention (D7)** | 25% | Return users day 7 |
| **Leaderboard Views** | 100 unique viewers | Page view tracking |

### 8.3 Secondary Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| Time to first meeting | < 3 minutes | Onboarding friction |
| Participants per meeting | 3+ average | Multi-timezone validation |
| Calendar connection rate | 40% | Google Calendar OAuth |
| Team creation rate | 20% of users | Team feature adoption |
| Organic shares | 10+ tweets/posts | Virality of Sacrifice Score |

### 8.4 Tracking Implementation
```typescript
// Key events to track (Mixpanel/PostHog)
const EVENTS = {
  // Funnel
  'signup_started': {},
  'signup_completed': { method: 'google' | 'magic_link' },
  'onboarding_completed': { timezone: string, calendar_connected: boolean },
  
  // Core actions
  'meeting_created': { participant_count: number, is_recurring: boolean },
  'find_times_clicked': { meeting_id: string },
  'slot_confirmed': { golden_score: number, total_sacrifice: number },
  
  // Async nudge
  'async_nudge_shown': { timezone_spread: number },
  'async_nudge_accepted': { meeting_id: string },
  'async_nudge_dismissed': { meeting_id: string },
  
  // Leaderboard
  'leaderboard_viewed': { team_id: string },
  'rotation_suggested': { meeting_id: string },
  
  // Engagement
  'weekly_email_opened': {},
  'invite_sent': { recipient_is_new_user: boolean },
};
```

### 8.5 Success Definition

**MVP Success (Day 30):**
- ✅ 500 signups
- ✅ 200 meetings created
- ✅ 1 organic viral moment (tweet/post about Sacrifice Score)
- ✅ Positive feedback from 5 power users

**V1.5 Success (Day 90):**
- ✅ 2,000 MAU
- ✅ 15% async conversion rate
- ✅ 10 teams actively using leaderboard
- ✅ Feature request pipeline > 50 items

---

## 9. 6-Day Sprint Plan

### Day 0 (Today): Architecture & Setup
**Goal:** All infrastructure ready, team aligned

| Task | Owner | Time | Output |
|------|-------|------|--------|
| PRD finalization | Architect | 2h | This document ✅ |
| Supabase project setup | Backend | 1h | Project URL, keys |
| Next.js boilerplate | Frontend | 1h | Repo with Tailwind + shadcn |
| Database schema creation | Backend | 2h | All tables created |
| Auth flow (Google + Magic Link) | Backend | 3h | Working auth |
| Vercel deployment pipeline | DevOps | 1h | Auto-deploy on push |
| Design system decisions | Frontend | 1h | Color palette, components |

**End of Day 0:** Can sign up, see empty dashboard, CI/CD working.

---

### Day 1: Core Meeting Flow (Part 1)
**Goal:** Can create a meeting and add participants

| Task | Owner | Time | Output |
|------|-------|------|--------|
| User profile page | Frontend | 2h | Edit name, timezone |
| Timezone auto-detection | Frontend | 1h | Browser API integration |
| Meeting creation API | Backend | 3h | POST /api/meetings |
| Meeting creation form UI | Frontend | 3h | Multi-step form |
| Participant addition (email input) | Frontend | 2h | Email autocomplete |
| Timezone lookup for participants | Backend | 2h | Manual entry fallback |

**End of Day 1:** Can create meeting with 3 participants, see their timezones.

---

### Day 2: Core Meeting Flow (Part 2)
**Goal:** Can find times and see Sacrifice Scores

| Task | Owner | Time | Output |
|------|-------|------|--------|
| Find Times algorithm | Backend | 4h | Returns possible slots |
| Sacrifice Score calculation | Backend | 3h | Points per participant |
| Golden Window calculation (basic) | Backend | 2h | Default energy curve |
| Find Times results UI | Frontend | 4h | Ranked list with scores |
| Slot selection + confirmation | Frontend | 2h | Confirm button |

**End of Day 2:** Full meeting scheduling flow works. Can see Sacrifice Score.

---

### Day 3: Async Nudge + Email
**Goal:** Async nudge triggers, email invites work

| Task | Owner | Time | Output |
|------|-------|------|--------|
| Async Nudge trigger logic | Backend | 2h | When to show nudge |
| Async Nudge UI component | Frontend | 3h | Modal with options |
| "Go Async" flow (basic template) | Frontend | 2h | Copy template to clipboard |
| Email service setup (Resend) | Backend | 2h | API integration |
| Meeting invite email template | Backend | 3h | HTML email with times |
| Send invite on confirmation | Backend | 2h | Email flow works |

**End of Day 3:** Async nudge appears. Email invites sent.

---

### Day 4: Team & Leaderboard
**Goal:** Can create team and see Sacrifice leaderboard

| Task | Owner | Time | Output |
|------|-------|------|--------|
| Team creation flow | Full stack | 3h | Create team, invite members |
| Team member list | Frontend | 2h | View/manage members |
| Sacrifice leaderboard API | Backend | 3h | Aggregated scores |
| Leaderboard UI | Frontend | 4h | Visual ranking display |
| Sacrifice breakdown drill-down | Frontend | 2h | Click to see details |

**End of Day 4:** Teams work. Leaderboard shows sacrifice scores.

---

### Day 5: Polish & Edge Cases
**Goal:** Handle edge cases, improve UX

| Task | Owner | Time | Output |
|------|-------|------|--------|
| Mobile responsive fixes | Frontend | 3h | Works on phones |
| Loading states + error handling | Frontend | 2h | Skeleton loaders, toasts |
| Empty states | Frontend | 2h | Helpful empty states |
| Edge case: participant without account | Backend | 2h | External participant flow |
| Edge case: single timezone meeting | Backend | 1h | No sacrifice calc needed |
| Performance audit | Full stack | 2h | Optimize slow queries |
| Bug bash (internal testing) | All | 3h | Fix found bugs |

**End of Day 5:** App is polished, handles edge cases gracefully.

---

### Day 6: Launch Prep
**Goal:** Ready for public launch

| Task | Owner | Time | Output |
|------|-------|------|--------|
| Landing page | Frontend | 4h | Marketing page with value prop |
| Analytics integration | Frontend | 2h | Mixpanel/PostHog setup |
| SEO basics | Frontend | 1h | Meta tags, OG images |
| Final testing (staging) | All | 2h | Full flow test |
| Production deployment | DevOps | 1h | Go live |
| Launch tweet/post draft | Marketing | 1h | Ready to post |
| Documentation | All | 2h | README, API docs |

**End of Day 6:** 🚀 LAUNCH

---

### Sprint Board View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLOCKALIGN 6-DAY SPRINT                           │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│     TO DO       │   IN PROGRESS   │   IN REVIEW     │        DONE           │
├─────────────────┼─────────────────┼─────────────────┼───────────────────────┤
│                 │                 │                 │ ✅ PRD Complete       │
│ Day 1 Tasks     │                 │                 │                       │
│ ├─ Profile page │                 │                 │                       │
│ ├─ TZ detection │                 │                 │                       │
│ ├─ Meeting API  │                 │                 │                       │
│ └─ Meeting form │                 │                 │                       │
│                 │                 │                 │                       │
│ Day 2 Tasks     │                 │                 │                       │
│ ├─ Find Times   │                 │                 │                       │
│ ├─ Sacrifice    │                 │                 │                       │
│ └─ Golden Win   │                 │                 │                       │
│                 │                 │                 │                       │
│ ... Day 3-6     │                 │                 │                       │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────┘
```

---

## 10. Technical Architecture

### 10.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  USERS                                       │
│                          (Browser / Mobile Web)                              │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL EDGE                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Next.js 14 App                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │    Pages     │  │  API Routes  │  │  Components  │               │   │
│  │  │  (App Router)│  │ (/api/*)     │  │  (React)     │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  │                           │                                          │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Server Actions                             │   │   │
│  │  │   (Direct Supabase calls for simple mutations)               │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────────┐
│           SUPABASE              │   │         EXTERNAL SERVICES           │
│  ┌───────────────────────────┐  │   │                                     │
│  │     PostgreSQL            │  │   │  ┌─────────────────────────────┐   │
│  │     (Database)            │  │   │  │    Google OAuth             │   │
│  └───────────────────────────┘  │   │  │    (Authentication)         │   │
│  ┌───────────────────────────┐  │   │  └─────────────────────────────┘   │
│  │     Supabase Auth         │  │   │  ┌─────────────────────────────┐   │
│  │     (Sessions/JWT)        │  │   │  │    Google Calendar API      │   │
│  └───────────────────────────┘  │   │  │    (Availability - V1.5)    │   │
│  ┌───────────────────────────┐  │   │  └─────────────────────────────┘   │
│  │     Row Level Security    │  │   │  ┌─────────────────────────────┐   │
│  │     (Authorization)       │  │   │  │    Resend                   │   │
│  └───────────────────────────┘  │   │  │    (Email Delivery)         │   │
│  ┌───────────────────────────┐  │   │  └─────────────────────────────┘   │
│  │     Edge Functions        │  │   │  ┌─────────────────────────────┐   │
│  │     (Complex logic - V2)  │  │   │  │    Mixpanel/PostHog         │   │
│  └───────────────────────────┘  │   │  │    (Analytics)              │   │
└─────────────────────────────────┘   │  └─────────────────────────────┘   │
                                      └─────────────────────────────────────┘
```

### 10.2 Tech Stack Summary

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14 (App Router) | Best DX, Vercel native |
| Styling | Tailwind CSS + shadcn/ui | Fast iteration, accessible |
| Database | Supabase (PostgreSQL) | Real-time, Auth, RLS built-in |
| Auth | Supabase Auth + Google OAuth | Simple, secure |
| Email | Resend | Modern API, great templates |
| Hosting | Vercel | Zero-config deploys |
| Analytics | Mixpanel or PostHog | Funnel tracking |
| Error Tracking | Sentry | Crash reporting |

### 10.3 Key Libraries

```json
{
  "dependencies": {
    "next": "14.x",
    "@supabase/supabase-js": "^2.x",
    "@supabase/auth-helpers-nextjs": "^0.8.x",
    "tailwindcss": "^3.x",
    "@radix-ui/react-*": "latest",
    "date-fns": "^3.x",
    "date-fns-tz": "^2.x",
    "zod": "^3.x",
    "resend": "^2.x",
    "@tanstack/react-query": "^5.x",
    "lucide-react": "latest"
  }
}
```

### 10.4 Project Structure

```
clockalign/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Dashboard home
│   │   ├── meetings/
│   │   │   ├── page.tsx                # List meetings
│   │   │   ├── new/page.tsx            # Create meeting
│   │   │   └── [id]/page.tsx           # Meeting details
│   │   ├── team/
│   │   │   ├── page.tsx                # Team settings
│   │   │   └── leaderboard/page.tsx    # Sacrifice leaderboard
│   │   └── settings/page.tsx           # User settings
│   ├── api/
│   │   ├── auth/[...supabase]/route.ts
│   │   ├── meetings/route.ts
│   │   ├── meetings/[id]/route.ts
│   │   ├── meetings/[id]/find-times/route.ts
│   │   ├── teams/route.ts
│   │   └── analytics/route.ts
│   ├── layout.tsx
│   └── page.tsx                        # Landing page
├── components/
│   ├── ui/                             # shadcn components
│   ├── meetings/
│   │   ├── meeting-form.tsx
│   │   ├── time-slot-card.tsx
│   │   └── async-nudge-modal.tsx
│   ├── leaderboard/
│   │   ├── sacrifice-leaderboard.tsx
│   │   └── sacrifice-breakdown.tsx
│   └── common/
│       ├── timezone-picker.tsx
│       └── energy-heatmap.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── algorithms/
│   │   ├── sacrifice-score.ts
│   │   ├── golden-window.ts
│   │   └── find-times.ts
│   ├── email/
│   │   └── templates/
│   └── utils/
│       ├── timezone.ts
│       └── date.ts
├── types/
│   └── index.ts
└── supabase/
    ├── migrations/
    └── seed.sql
```

---

## 11. Open Questions & Risks

### 11.1 Open Questions

| Question | Options | Decision Needed By |
|----------|---------|-------------------|
| Do we need real-time updates for leaderboard? | WebSocket vs polling vs manual refresh | Day 3 |
| How do we handle participants without accounts? | Magic link invite vs view-only access | Day 2 |
| Should we store meeting history forever? | Yes (analytics) vs retention policy | Day 4 |
| Default energy curve values — need user research? | Use assumptions vs quick survey | Day 0 |
| Team billing model? | Per-seat vs flat vs freemium | Post-launch |

### 11.2 Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Google OAuth approval delays | Can't launch with Google | Medium | Magic Link as backup primary |
| Calendar API rate limits | Degraded experience | Low | Cache aggressively, batch requests |
| Timezone edge cases (DST, etc.) | Wrong calculations | Medium | Use robust library (date-fns-tz) |
| Scope creep | Miss deadline | High | PRD is locked. No new features. |
| Email deliverability | Invites go to spam | Medium | Warm up domain, use Resend |
| Low adoption | Fail to hit metrics | Medium | Strong launch marketing, viral hooks |

### 11.3 Assumptions

- Users have Gmail/Google accounts (for OAuth)
- Users work in teams with distributed timezones (product-market fit)
- "Sacrifice Score" name will resonate (not offensive)
- Default energy curves are close enough to reality
- 30-day data is sufficient for meaningful leaderboard

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Sacrifice Score** | Quantified pain points accumulated from meetings at inconvenient times |
| **Golden Window** | Time slot where all participants have high cognitive sharpness |
| **Async Nudge** | Prompt suggesting a meeting could be async instead |
| **Pain Points** | Numeric value assigned to meeting times based on inconvenience |
| **Energy Curve** | User's cognitive sharpness profile throughout the day |
| **Hours Reclaimed** | Time saved by converting sync meetings to async |
| **Karma Report** | Monthly summary of a user's meeting fairness metrics |

---

## Appendix B: Competitive Analysis

| Feature | ClockAlign | WorldTimeBuddy | Calendly | When2meet |
|---------|------------|----------------|----------|-----------|
| Timezone visualization | ✅ Heat map | ✅ Basic | ❌ | ❌ |
| Fairness tracking | ✅ Sacrifice Score | ❌ | ❌ | ❌ |
| Energy-based scheduling | ✅ Golden Windows | ❌ | ❌ | ❌ |
| Async suggestions | ✅ Async Nudge | ❌ | ❌ | ❌ |
| Calendar integration | ✅ Google | ❌ | ✅ | ❌ |
| Team leaderboards | ✅ | ❌ | ❌ | ❌ |
| Free tier | ✅ | ✅ | ⚠️ Limited | ✅ |

**Key differentiator:** ClockAlign is the only tool that optimizes for **fairness** and **cognitive performance**, not just availability.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-07-14 | Lead Architect | Initial PRD |

---

**🚀 Ready to build. Let's ship ClockAlign in 6 days.**

---

## 12. Documentation Requirements (MANDATORY)

### User Documentation (Support Page)
Every feature must have corresponding user-facing documentation:
- **Getting Started Guide** — Onboarding walkthrough with screenshots
- **Feature Guides** — How to use Sacrifice Score, Golden Windows, Async Nudge
- **FAQ** — Common questions and troubleshooting
- **Video Tutorials** — Short Loom-style walkthroughs (V1.5)

Location: `/docs` route in the app (public, SEO-friendly)

### Developer Documentation
For maintainability and future contributors:
- **Architecture Overview** — System design, data flow, key decisions
- **API Reference** — Auto-generated from OpenAPI spec
- **Database Schema** — ERD + migration guide
- **Local Development Setup** — One-command dev environment
- **Deployment Guide** — How to deploy, environment variables, secrets
- **Contributing Guide** — Code style, PR process, testing requirements

Location: `README.md` + `/docs` folder in repo

### DevOps Requirements
- **CI/CD Pipeline** — GitHub Actions for lint, test, build, deploy
- **Preview Deployments** — Every PR gets a preview URL (Vercel)
- **Monitoring** — Error tracking (Sentry), uptime monitoring
- **Logging** — Structured logs for debugging
- **Database Backups** — Automated Supabase backups

---

*Documentation is not optional. Apps without docs die.*
