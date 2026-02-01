# ClockAlign Database Schema

## Overview

ClockAlign uses Supabase (PostgreSQL) for data storage. All tables have Row Level Security (RLS) enabled.

## Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│    users     │────<│  team_members    │>────│    teams     │
└──────────────┘     └──────────────────┘     └──────────────┘
       │                                              │
       │                                              │
       ▼                                              ▼
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   meetings   │────<│meeting_participants│    │ team_invites │
└──────────────┘     └──────────────────┘     └──────────────┘
       │
       ├─────────────────────┐
       ▼                     ▼
┌──────────────────┐  ┌──────────────┐
│  meeting_slots   │  │ async_nudges │
└──────────────────┘  └──────────────┘
       │
       ▼
┌──────────────────┐
│ sacrifice_scores │
└──────────────────┘

┌──────────────────┐
│  golden_windows  │
└──────────────────┘
```

---

## Tables

### users

Primary user accounts, linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (matches Supabase Auth ID) |
| `email` | VARCHAR(255) | Unique email address |
| `name` | VARCHAR(255) | Display name (nullable) |
| `timezone` | VARCHAR(50) | IANA timezone (default: 'UTC') |
| `energy_profile` | JSONB | Custom energy curve settings |
| `avatar_url` | TEXT | Profile picture URL |
| `google_id` | VARCHAR(255) | Google OAuth ID (unique) |
| `preferences` | JSONB | User preferences |
| `created_at` | TIMESTAMPTZ | Account creation time |
| `updated_at` | TIMESTAMPTZ | Last update time (auto-updated) |

**Indexes:**
- `idx_users_email` - Email lookups
- `idx_users_google_id` - OAuth lookups

**Energy Profile Schema:**
```json
{
  "type": "default" | "early_bird" | "night_owl" | "custom",
  "chronotype": "early_bird" | "normal" | "night_owl",
  "workStartHour": 8,
  "workEndHour": 18,
  "customEnergyCurve": { "0": 0.2, "1": 0.15, ... },
  "customUnavailableHours": [0, 1, 2, 3, 4, 5]
}
```

---

### teams

Team/organization containers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(255) | Team name |
| `slug` | VARCHAR(100) | Unique URL slug |
| `created_by` | UUID | Creator user ID (FK → users) |
| `settings` | JSONB | Team settings |
| `created_at` | TIMESTAMPTZ | Creation time |

**Indexes:**
- `idx_teams_slug` - Slug lookups
- `idx_teams_created_by` - Creator queries

---

### team_members

Many-to-many: users ↔ teams.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `team_id` | UUID | FK → teams |
| `user_id` | UUID | FK → users |
| `role` | VARCHAR(20) | 'owner', 'admin', or 'member' |
| `joined_at` | TIMESTAMPTZ | Join time |

**Constraints:**
- UNIQUE(team_id, user_id)

**Indexes:**
- `idx_team_members_team` - Team member lists
- `idx_team_members_user` - User's teams

---

### team_invites

Pending team invitations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `team_id` | UUID | FK → teams |
| `email` | VARCHAR(255) | Invitee email |
| `code` | VARCHAR(20) | Unique invite code |
| `invited_by` | UUID | FK → users |
| `expires_at` | TIMESTAMPTZ | Expiration time |
| `accepted_at` | TIMESTAMPTZ | When accepted (nullable) |
| `created_at` | TIMESTAMPTZ | Creation time |

**Constraints:**
- UNIQUE(team_id, email) - One invite per email per team
- UNIQUE(code) - Unique invite codes

---

### meetings

Scheduled meetings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | VARCHAR(255) | Meeting title |
| `description` | TEXT | Description (nullable) |
| `duration_minutes` | INTEGER | Duration in minutes (>0) |
| `meeting_type` | VARCHAR(50) | Type: standup, planning, 1on1, review, brainstorm, other |
| `organizer_id` | UUID | FK → users |
| `team_id` | UUID | FK → teams (nullable) |
| `is_recurring` | BOOLEAN | Is recurring meeting |
| `recurrence_rule` | JSONB | iCal RRULE format |
| `external_calendar_id` | VARCHAR(255) | Google Calendar event ID |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update (auto-updated) |

**Indexes:**
- `idx_meetings_organizer` - Organizer's meetings
- `idx_meetings_team` - Team's meetings
- `idx_meetings_created_at` - Chronological ordering
- `idx_meetings_title_search` - Full-text search (GIN)

---

### meeting_participants

Meeting attendees.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `meeting_id` | UUID | FK → meetings |
| `user_id` | UUID | FK → users (nullable for external) |
| `email` | VARCHAR(255) | Participant email |
| `name` | VARCHAR(255) | Display name |
| `timezone` | VARCHAR(50) | Participant timezone |
| `status` | VARCHAR(20) | pending, accepted, declined, tentative |
| `responded_at` | TIMESTAMPTZ | Response time |
| `created_at` | TIMESTAMPTZ | Added time |

**Indexes:**
- `idx_meeting_participants_meeting` - Meeting's participants
- `idx_meeting_participants_user` - User's meetings
- `idx_meeting_participants_email` - Email lookups

---

### meeting_slots

Proposed or confirmed meeting times.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `meeting_id` | UUID | FK → meetings |
| `start_time` | TIMESTAMPTZ | Start time (UTC) |
| `end_time` | TIMESTAMPTZ | End time (UTC) |
| `status` | VARCHAR(20) | proposed, confirmed, cancelled |
| `golden_score` | DECIMAL(5,2) | Energy alignment score (0-100) |
| `total_sacrifice_points` | INTEGER | Combined sacrifice score |
| `google_event_id` | VARCHAR(255) | Google Calendar event ID |
| `created_at` | TIMESTAMPTZ | Creation time |

**Constraints:**
- CHECK(end_time > start_time)
- CHECK(golden_score >= 0 AND golden_score <= 100)

**Indexes:**
- `idx_meeting_slots_meeting` - Meeting's time options
- `idx_meeting_slots_start_time` - Time-based queries
- `idx_meeting_slots_status` - Status filtering

---

### sacrifice_scores

Individual pain scores per participant per slot.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `participant_id` | UUID | FK → meeting_participants |
| `meeting_slot_id` | UUID | FK → meeting_slots |
| `points` | INTEGER | Pain points (>=0) |
| `local_start_time` | TIME | Local time for participant |
| `category` | VARCHAR(20) | Time category (see below) |
| `multiplier` | DECIMAL(3,2) | Score multiplier (>0) |
| `calculated_at` | TIMESTAMPTZ | Calculation time |

**Categories:** core, early_start, evening, early_morning, late_evening, night, graveyard

**Constraints:**
- UNIQUE(participant_id, meeting_slot_id)
- CHECK(points >= 0)
- CHECK(multiplier > 0)

**Indexes:**
- `idx_sacrifice_scores_participant` - User's scores
- `idx_sacrifice_scores_slot` - Slot's scores
- `idx_sacrifice_scores_calculated_at` - Time-based queries

---

### golden_windows

Custom energy curve per user per hour.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users |
| `hour` | INTEGER | Hour of day (0-23) |
| `sharpness` | DECIMAL(3,2) | Cognitive sharpness (0.00-1.00) |
| `is_available` | BOOLEAN | Is user available at this hour |

**Constraints:**
- UNIQUE(user_id, hour)
- CHECK(hour >= 0 AND hour <= 23)
- CHECK(sharpness >= 0 AND sharpness <= 1)

**Indexes:**
- `idx_golden_windows_user` - User's energy curve

**Default Sharpness by Hour:**
```
0-5:   0.30 (sleeping)
6-7:   0.60 (waking up)
8-9:   0.90 (morning peak)
10-11: 0.95 (maximum focus)
12-13: 0.65 (post-lunch dip)
14-15: 0.80 (afternoon recovery)
16-17: 0.85 (secondary peak)
18-19: 0.70 (winding down)
20-23: 0.50 (evening fatigue)
```

---

### async_nudges

Tracks meeting-to-async conversions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `meeting_id` | UUID | FK → meetings |
| `decision` | VARCHAR(20) | went_async or scheduled_anyway |
| `original_sacrifice_points` | INTEGER | Score before conversion |
| `hours_saved` | DECIMAL(4,2) | Estimated hours saved |
| `async_type` | VARCHAR(50) | loom, doc, poll, email, other |
| `created_at` | TIMESTAMPTZ | Decision time |

**Indexes:**
- `idx_async_nudges_meeting` - Meeting's nudge history
- `idx_async_nudges_decision` - Decision analytics
- `idx_async_nudges_created_at` - Time-based queries

---

## Row Level Security (RLS)

All tables have RLS enabled. Key policies:

### users
- Read own profile only
- Update own profile only

### teams
- Read teams where user is a member

### team_members
- Read members of teams user belongs to

### meetings
- Read meetings user organizes or participates in

### meeting_participants
- Read participants of meetings user is in

### meeting_slots
- Read slots for meetings user is in

### sacrifice_scores
- Read own scores or scores for meetings user organizes

### golden_windows
- Full access to own energy curve

### async_nudges
- Read nudges for meetings user is in

---

## Database Functions

### get_sacrifice_category(local_hour INTEGER)

Returns the sacrifice category for a given local hour.

```sql
SELECT get_sacrifice_category(22); -- Returns 'night'
```

### get_sacrifice_points(category VARCHAR)

Returns base sacrifice points for a category.

```sql
SELECT get_sacrifice_points('graveyard'); -- Returns 10
```

---

## Migrations

Migrations are in `supabase/migrations/`:

1. `00001_initial_schema.sql` - Core tables
2. `00002_team_invites.sql` - Team invites
3. `20250201_sacrifice_scores_triggers.sql` - Score calculation triggers

Run migrations:
```bash
npx supabase db push
```
