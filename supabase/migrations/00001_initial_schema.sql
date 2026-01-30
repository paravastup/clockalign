-- ClockAlign Database Schema
-- Version: 1.0
-- Created: 2025-01-30
-- Description: Initial schema with all tables for MVP

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  energy_profile JSONB DEFAULT '{"type": "default"}'::jsonb,
  avatar_url TEXT,
  google_id VARCHAR(255) UNIQUE,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups (auth)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TEAMS TABLE
-- ============================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for slug lookups
CREATE INDEX idx_teams_slug ON teams(slug);
CREATE INDEX idx_teams_created_by ON teams(created_by);

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Indexes for team member queries
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- ============================================
-- MEETINGS TABLE
-- ============================================
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  meeting_type VARCHAR(50) CHECK (meeting_type IN ('standup', 'planning', '1on1', 'review', 'brainstorm', 'other')),
  organizer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule JSONB, -- iCal RRULE format
  external_calendar_id VARCHAR(255), -- Google Calendar event ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for meeting queries
CREATE INDEX idx_meetings_organizer ON meetings(organizer_id);
CREATE INDEX idx_meetings_team ON meetings(team_id);
CREATE INDEX idx_meetings_created_at ON meetings(created_at DESC);

-- Full-text search on meeting titles
CREATE INDEX idx_meetings_title_search ON meetings USING gin(to_tsvector('english', title));

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MEETING PARTICIPANTS TABLE
-- ============================================
CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for external participants
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  timezone VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'tentative')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for participant queries
CREATE INDEX idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_user ON meeting_participants(user_id);
CREATE INDEX idx_meeting_participants_email ON meeting_participants(email);

-- ============================================
-- MEETING SLOTS TABLE
-- ============================================
CREATE TABLE meeting_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'proposed' CHECK (status IN ('proposed', 'confirmed', 'cancelled')),
  golden_score DECIMAL(5,2) CHECK (golden_score >= 0 AND golden_score <= 100),
  total_sacrifice_points INTEGER DEFAULT 0,
  google_event_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Indexes for slot queries
CREATE INDEX idx_meeting_slots_meeting ON meeting_slots(meeting_id);
CREATE INDEX idx_meeting_slots_start_time ON meeting_slots(start_time);
CREATE INDEX idx_meeting_slots_status ON meeting_slots(status);

-- ============================================
-- SACRIFICE SCORES TABLE
-- Tracks individual pain scores per participant per meeting slot
-- ============================================
CREATE TABLE sacrifice_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES meeting_participants(id) ON DELETE CASCADE,
  meeting_slot_id UUID NOT NULL REFERENCES meeting_slots(id) ON DELETE CASCADE,
  points INTEGER NOT NULL CHECK (points >= 0),
  local_start_time TIME NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('core', 'early_start', 'evening', 'early_morning', 'late_evening', 'night', 'graveyard')),
  multiplier DECIMAL(3,2) DEFAULT 1.0 CHECK (multiplier > 0),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, meeting_slot_id)
);

-- Indexes for score queries
CREATE INDEX idx_sacrifice_scores_participant ON sacrifice_scores(participant_id);
CREATE INDEX idx_sacrifice_scores_slot ON sacrifice_scores(meeting_slot_id);
CREATE INDEX idx_sacrifice_scores_calculated_at ON sacrifice_scores(calculated_at DESC);

-- ============================================
-- GOLDEN WINDOWS TABLE (Energy Curves)
-- Custom energy/sharpness settings per user per hour
-- ============================================
CREATE TABLE golden_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  sharpness DECIMAL(3,2) NOT NULL CHECK (sharpness >= 0 AND sharpness <= 1),
  is_available BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, hour)
);

-- Index for energy curve lookups
CREATE INDEX idx_golden_windows_user ON golden_windows(user_id);

-- ============================================
-- ASYNC NUDGES TABLE
-- Tracks when meetings are converted to async
-- ============================================
CREATE TABLE async_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('went_async', 'scheduled_anyway')),
  original_sacrifice_points INTEGER,
  hours_saved DECIMAL(4,2),
  async_type VARCHAR(50) CHECK (async_type IN ('loom', 'doc', 'poll', 'email', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for nudge analytics
CREATE INDEX idx_async_nudges_meeting ON async_nudges(meeting_id);
CREATE INDEX idx_async_nudges_decision ON async_nudges(decision);
CREATE INDEX idx_async_nudges_created_at ON async_nudges(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacrifice_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE golden_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE async_nudges ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can view teams they're members of
CREATE POLICY "Team members can view team" ON teams
  FOR SELECT USING (
    id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Team members can view each other
CREATE POLICY "Team members can view members" ON team_members
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Users can view meetings they organize or participate in
CREATE POLICY "Users can view own meetings" ON meetings
  FOR SELECT USING (
    organizer_id = auth.uid() OR
    id IN (
      SELECT meeting_id FROM meeting_participants WHERE user_id = auth.uid()
    )
  );

-- Users can view participants of meetings they're in
CREATE POLICY "Users can view meeting participants" ON meeting_participants
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE organizer_id = auth.uid()
      UNION
      SELECT meeting_id FROM meeting_participants WHERE user_id = auth.uid()
    )
  );

-- Users can view slots for meetings they're in
CREATE POLICY "Users can view meeting slots" ON meeting_slots
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE organizer_id = auth.uid()
      UNION
      SELECT meeting_id FROM meeting_participants WHERE user_id = auth.uid()
    )
  );

-- Users can view sacrifice scores for meetings they're in
CREATE POLICY "Users can view sacrifice scores" ON sacrifice_scores
  FOR SELECT USING (
    participant_id IN (
      SELECT id FROM meeting_participants WHERE user_id = auth.uid()
    ) OR
    meeting_slot_id IN (
      SELECT ms.id FROM meeting_slots ms
      JOIN meetings m ON m.id = ms.meeting_id
      WHERE m.organizer_id = auth.uid()
    )
  );

-- Users can manage their own golden windows
CREATE POLICY "Users can manage own golden windows" ON golden_windows
  FOR ALL USING (user_id = auth.uid());

-- Users can view async nudges for their meetings
CREATE POLICY "Users can view async nudges" ON async_nudges
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE organizer_id = auth.uid()
      UNION
      SELECT meeting_id FROM meeting_participants WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate sacrifice category based on local hour
CREATE OR REPLACE FUNCTION get_sacrifice_category(local_hour INTEGER)
RETURNS VARCHAR(20) AS $$
BEGIN
  CASE
    WHEN local_hour >= 9 AND local_hour < 18 THEN RETURN 'core';
    WHEN local_hour >= 8 AND local_hour < 9 THEN RETURN 'early_start';
    WHEN local_hour >= 18 AND local_hour < 20 THEN RETURN 'evening';
    WHEN local_hour >= 6 AND local_hour < 8 THEN RETURN 'early_morning';
    WHEN local_hour >= 20 AND local_hour < 22 THEN RETURN 'late_evening';
    WHEN local_hour >= 22 OR local_hour < 6 THEN 
      IF local_hour >= 0 AND local_hour < 6 THEN 
        RETURN 'graveyard';
      ELSE 
        RETURN 'night';
      END IF;
    ELSE RETURN 'core';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate base sacrifice points based on category
CREATE OR REPLACE FUNCTION get_sacrifice_points(category VARCHAR(20))
RETURNS INTEGER AS $$
BEGIN
  CASE category
    WHEN 'core' THEN RETURN 0;
    WHEN 'early_start' THEN RETURN 1;
    WHEN 'evening' THEN RETURN 2;
    WHEN 'early_morning' THEN RETURN 3;
    WHEN 'late_evening' THEN RETURN 4;
    WHEN 'night' THEN RETURN 6;
    WHEN 'graveyard' THEN RETURN 10;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- SEED DEFAULT ENERGY CURVE
-- Default energy profile values
-- ============================================
COMMENT ON TABLE golden_windows IS 'Default sharpness values by hour:
0-5: 0.30 (sleeping)
6-7: 0.60 (waking up)
8-9: 0.90 (morning peak)
10-11: 0.95 (maximum focus)
12-13: 0.65 (post-lunch dip)
14-15: 0.80 (afternoon recovery)
16-17: 0.85 (secondary peak)
18-19: 0.70 (winding down)
20-23: 0.50 (evening fatigue)';
