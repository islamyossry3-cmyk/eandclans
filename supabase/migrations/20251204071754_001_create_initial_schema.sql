/*
  # Care Clans - Initial Schema Setup

  1. New Tables
    - `admins` - Admin user profiles and permissions
    - `sessions` - Game session configurations with questions
    - `session_history` - Completed session data for analytics
    - `question_banks` - Reusable question sets
    - `leaderboards` - Individual mode player rankings

  2. Security
    - Enable RLS on all tables
    - Admins: Can only manage their own sessions
    - Sessions: Publicly readable, writable by admins only
    - Session history: Publicly readable for analytics
    - Leaderboards: Publicly readable
*/

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  organization_name text,
  is_super_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'team_battle' CHECK (type IN ('team_battle', 'individual')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'live', 'completed')),
  session_pin text UNIQUE NOT NULL,
  qr_code_data text,
  
  config_duration integer DEFAULT 1800,
  config_max_players_per_team integer DEFAULT 10,
  config_hex_grid_size integer DEFAULT 37,
  config_time_per_question integer DEFAULT 15,
  config_points_per_correct_answer integer DEFAULT 10,
  config_allow_skip boolean DEFAULT false,
  
  design_team1_name text DEFAULT 'Team 1',
  design_team1_color text DEFAULT '#0EA5E9',
  design_team1_icon text DEFAULT '🏰',
  design_team2_name text DEFAULT 'Team 2',
  design_team2_color text DEFAULT '#10B981',
  design_team2_icon text DEFAULT '🏯',
  design_background_theme text DEFAULT 'ocean' CHECK (design_background_theme IN ('ocean', 'forest', 'desert', 'space')),
  design_logo_url text,
  design_branding_text text,
  
  questions jsonb DEFAULT '[]'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type text NOT NULL,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  total_players integer DEFAULT 0,
  
  team1_name text,
  team1_player_count integer DEFAULT 0,
  team1_final_score integer DEFAULT 0,
  team1_territories_claimed integer DEFAULT 0,
  
  team2_name text,
  team2_player_count integer DEFAULT 0,
  team2_final_score integer DEFAULT 0,
  team2_territories_claimed integer DEFAULT 0,
  
  winner text CHECK (winner IN ('team1', 'team2', 'tie')),
  
  players jsonb DEFAULT '[]'::jsonb,
  event_log jsonb DEFAULT '[]'::jsonb,
  
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS question_banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  questions jsonb DEFAULT '[]'::jsonb,
  is_shared boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  score integer DEFAULT 0,
  territories_claimed integer DEFAULT 0,
  questions_answered integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  time_played_seconds integer DEFAULT 0,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read own profile"
  ON admins FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Admins can update own profile"
  ON admins FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Admins can create own sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = admin_id
      AND admins.auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read own sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = admin_id
      AND admins.auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update own sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = admin_id
      AND admins.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = admin_id
      AND admins.auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete own sessions"
  ON sessions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = admin_id
      AND admins.auth_id = auth.uid()
    )
  );

CREATE POLICY "Public can read session history"
  ON session_history FOR SELECT
  USING (true);

CREATE POLICY "Admins can create session history"
  ON session_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_id
      AND EXISTS (
        SELECT 1 FROM admins
        WHERE admins.id = sessions.admin_id
        AND admins.auth_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can read own question banks"
  ON question_banks FOR SELECT
  TO authenticated
  USING (
    admin_id = (
      SELECT id FROM admins
      WHERE auth_id = auth.uid()
    )
    OR is_shared = true
  );

CREATE POLICY "Admins can create question banks"
  ON question_banks FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_id = (
      SELECT id FROM admins
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update own question banks"
  ON question_banks FOR UPDATE
  TO authenticated
  USING (
    admin_id = (
      SELECT id FROM admins
      WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    admin_id = (
      SELECT id FROM admins
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete own question banks"
  ON question_banks FOR DELETE
  TO authenticated
  USING (
    admin_id = (
      SELECT id FROM admins
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Public can read leaderboards"
  ON leaderboards FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit leaderboard entry"
  ON leaderboards FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_sessions_admin_id ON sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_pin ON sessions(session_pin);
CREATE INDEX IF NOT EXISTS idx_session_history_session_id ON session_history(session_id);
CREATE INDEX IF NOT EXISTS idx_question_banks_admin_id ON question_banks(admin_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_session_id ON leaderboards(session_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_score ON leaderboards(score DESC);