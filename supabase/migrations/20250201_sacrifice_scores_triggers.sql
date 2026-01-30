-- ============================================
-- Sacrifice Score™ Table Triggers
-- Day 3: CA-023
-- ============================================

-- Create an aggregated view for team sacrifice scores
CREATE OR REPLACE VIEW team_sacrifice_summary AS
SELECT 
  mp.user_id,
  m.team_id,
  u.name as user_name,
  u.email as user_email,
  u.timezone,
  COUNT(DISTINCT ms.id) as meeting_count,
  SUM(ss.points) as total_points,
  AVG(ss.points) as avg_points_per_meeting,
  COUNT(CASE WHEN ss.category = 'graveyard' THEN 1 END) as graveyard_count,
  COUNT(CASE WHEN ss.category = 'late_night' THEN 1 END) as late_night_count,
  COUNT(CASE WHEN ss.category = 'night' THEN 1 END) as night_count,
  COUNT(CASE WHEN ss.category = 'early_morning' THEN 1 END) as early_morning_count,
  DATE_TRUNC('month', ss.calculated_at) as period_month
FROM sacrifice_scores ss
JOIN meeting_participants mp ON mp.id = ss.participant_id
JOIN meetings m ON m.id = mp.meeting_id
JOIN meeting_slots ms ON ms.id = ss.meeting_slot_id
LEFT JOIN users u ON u.id = mp.user_id
WHERE mp.user_id IS NOT NULL
GROUP BY mp.user_id, m.team_id, u.name, u.email, u.timezone, DATE_TRUNC('month', ss.calculated_at);

-- Create function to update sacrifice score stats when a new score is inserted
CREATE OR REPLACE FUNCTION update_sacrifice_score_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the meeting slot's total sacrifice points
  UPDATE meeting_slots 
  SET total_sacrifice_points = (
    SELECT COALESCE(SUM(points), 0)
    FROM sacrifice_scores 
    WHERE meeting_slot_id = NEW.meeting_slot_id
  )
  WHERE id = NEW.meeting_slot_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sacrifice score inserts
DROP TRIGGER IF EXISTS trigger_update_sacrifice_stats ON sacrifice_scores;
CREATE TRIGGER trigger_update_sacrifice_stats
AFTER INSERT OR UPDATE ON sacrifice_scores
FOR EACH ROW
EXECUTE FUNCTION update_sacrifice_score_stats();

-- Function to calculate and insert sacrifice scores for a meeting slot
CREATE OR REPLACE FUNCTION calculate_meeting_sacrifice_scores(
  p_meeting_slot_id UUID,
  p_meeting_id UUID,
  p_duration_minutes INT DEFAULT 30,
  p_is_recurring BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
  participant RECORD;
  local_hour INT;
  base_points NUMERIC;
  final_points NUMERIC;
  category TEXT;
  multiplier NUMERIC;
  slot_start TIMESTAMPTZ;
BEGIN
  -- Get the slot start time
  SELECT start_time INTO slot_start 
  FROM meeting_slots 
  WHERE id = p_meeting_slot_id;
  
  -- Calculate score for each participant
  FOR participant IN 
    SELECT 
      mp.id as participant_id,
      mp.user_id,
      mp.timezone,
      mp.user_id = m.organizer_id as is_organizer
    FROM meeting_participants mp
    JOIN meetings m ON m.id = mp.meeting_id
    WHERE mp.meeting_id = p_meeting_id
  LOOP
    -- Calculate local hour in participant's timezone
    local_hour := EXTRACT(HOUR FROM slot_start AT TIME ZONE participant.timezone);
    
    -- Determine base points and category based on hour
    CASE 
      WHEN local_hour BETWEEN 10 AND 15 THEN
        base_points := 1; category := 'golden';
      WHEN local_hour IN (9, 16) THEN
        base_points := 1.5; category := 'good';
      WHEN local_hour IN (8, 17) THEN
        base_points := 2; category := 'acceptable';
      WHEN local_hour = 7 THEN
        base_points := 3; category := 'early_morning';
      WHEN local_hour IN (18, 19) THEN
        base_points := 3; category := 'evening';
      WHEN local_hour = 20 THEN
        base_points := 4; category := 'late_evening';
      WHEN local_hour = 21 THEN
        base_points := 5; category := 'night';
      WHEN local_hour = 22 THEN
        base_points := 6; category := 'late_night';
      ELSE
        base_points := 10; category := 'graveyard';
    END CASE;
    
    -- Calculate multiplier
    multiplier := (p_duration_minutes::NUMERIC / 30);
    IF p_is_recurring THEN
      multiplier := multiplier * 1.5;
    END IF;
    IF participant.is_organizer THEN
      multiplier := multiplier * 0.8;
    END IF;
    
    -- Calculate final points
    final_points := ROUND(base_points * multiplier, 1);
    
    -- Insert or update sacrifice score
    INSERT INTO sacrifice_scores (
      participant_id,
      meeting_slot_id,
      points,
      local_start_time,
      category,
      multiplier,
      calculated_at
    ) VALUES (
      participant.participant_id,
      p_meeting_slot_id,
      final_points,
      (slot_start AT TIME ZONE participant.timezone)::TIME,
      category,
      multiplier,
      NOW()
    )
    ON CONFLICT (participant_id, meeting_slot_id) 
    DO UPDATE SET
      points = EXCLUDED.points,
      local_start_time = EXCLUDED.local_start_time,
      category = EXCLUDED.category,
      multiplier = EXCLUDED.multiplier,
      calculated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sacrifice_scores_participant_slot_unique'
  ) THEN
    ALTER TABLE sacrifice_scores 
    ADD CONSTRAINT sacrifice_scores_participant_slot_unique 
    UNIQUE (participant_id, meeting_slot_id);
  END IF;
END $$;

-- Create index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_sacrifice_scores_calculated_at 
ON sacrifice_scores(calculated_at);

CREATE INDEX IF NOT EXISTS idx_sacrifice_scores_category 
ON sacrifice_scores(category);

-- Function to get team leaderboard
CREATE OR REPLACE FUNCTION get_team_leaderboard(
  p_team_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT (NOW() - INTERVAL '30 days'),
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  timezone TEXT,
  total_points NUMERIC,
  meeting_count BIGINT,
  avg_points NUMERIC,
  graveyard_count BIGINT,
  late_night_count BIGINT,
  night_count BIGINT,
  early_morning_count BIGINT,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH scores AS (
    SELECT 
      mp.user_id,
      u.name::TEXT as user_name,
      u.email::TEXT as user_email,
      u.timezone::TEXT,
      SUM(ss.points) as total_points,
      COUNT(DISTINCT ms.id) as meeting_count,
      AVG(ss.points) as avg_points,
      COUNT(CASE WHEN ss.category = 'graveyard' THEN 1 END) as graveyard_count,
      COUNT(CASE WHEN ss.category = 'late_night' THEN 1 END) as late_night_count,
      COUNT(CASE WHEN ss.category = 'night' THEN 1 END) as night_count,
      COUNT(CASE WHEN ss.category = 'early_morning' THEN 1 END) as early_morning_count
    FROM sacrifice_scores ss
    JOIN meeting_participants mp ON mp.id = ss.participant_id
    JOIN meetings m ON m.id = mp.meeting_id
    JOIN meeting_slots ms ON ms.id = ss.meeting_slot_id
    LEFT JOIN users u ON u.id = mp.user_id
    WHERE m.team_id = p_team_id
      AND ss.calculated_at BETWEEN p_start_date AND p_end_date
      AND mp.user_id IS NOT NULL
    GROUP BY mp.user_id, u.name, u.email, u.timezone
  )
  SELECT 
    s.*,
    ROW_NUMBER() OVER (ORDER BY s.total_points DESC) as rank
  FROM scores s
  ORDER BY s.total_points DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user score history
CREATE OR REPLACE FUNCTION get_user_score_history(
  p_user_id UUID,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  points NUMERIC,
  meeting_count BIGINT,
  categories JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_scores AS (
    SELECT 
      DATE(ss.calculated_at) as score_date,
      SUM(ss.points) as daily_points,
      COUNT(DISTINCT ms.id) as daily_meetings,
      JSONB_OBJECT_AGG(
        ss.category, 
        COUNT(*) FILTER (WHERE ss.category = ss.category)
      ) as category_counts
    FROM sacrifice_scores ss
    JOIN meeting_participants mp ON mp.id = ss.participant_id
    JOIN meeting_slots ms ON ms.id = ss.meeting_slot_id
    WHERE mp.user_id = p_user_id
      AND ss.calculated_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(ss.calculated_at)
  )
  SELECT 
    d.score_date,
    d.daily_points,
    d.daily_meetings,
    d.category_counts
  FROM daily_scores d
  ORDER BY d.score_date;
END;
$$ LANGUAGE plpgsql;
