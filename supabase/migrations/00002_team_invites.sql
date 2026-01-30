-- Team Invites Table
-- Migration: 00002_team_invites.sql
-- Description: Add team invites table for invite system

-- ============================================
-- TEAM INVITES TABLE
-- ============================================
CREATE TABLE team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  invite_code VARCHAR(20) NOT NULL UNIQUE,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_team_invites_team ON team_invites(team_id);
CREATE INDEX idx_team_invites_email ON team_invites(email);
CREATE INDEX idx_team_invites_code ON team_invites(invite_code);
CREATE INDEX idx_team_invites_status ON team_invites(status);

-- Enable RLS
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Team admins/owners can manage invites
CREATE POLICY "Team admins can manage invites" ON team_invites
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Anyone can view invite by code (for accepting)
CREATE POLICY "Anyone can view invite by code" ON team_invites
  FOR SELECT USING (true);
