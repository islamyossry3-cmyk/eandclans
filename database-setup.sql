-- ============================================================================
-- The& Way Database Setup Script
-- ============================================================================
-- This script creates all necessary tables and the initial e& admin user
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1. Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  organization_name text,
  is_super_admin boolean DEFAULT false,
  last_login_at timestamptz,
  is_approved boolean DEFAULT false,
  approved_by uuid REFERENCES admins(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create sessions table
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
  design_team1_color text DEFAULT '#E00800',
  design_team1_icon text DEFAULT '🏰',
  design_team2_name text DEFAULT 'Team 2',
  design_team2_color text DEFAULT '#47CB6C',
  design_team2_icon text DEFAULT '🏯',
  design_background_theme text DEFAULT 'innovation' CHECK (design_background_theme IN ('innovation', 'excellence', 'integrity', 'customer-focus', 'collaboration', 'empowerment')),
  design_logo_url text,
  design_branding_text text,
  design_background_video_url text,
  design_background_image_url text,

  questions jsonb DEFAULT '[]'::jsonb,

  registration_fields jsonb DEFAULT '[]'::jsonb,
  require_player_email boolean DEFAULT false,
  require_player_organization boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create other necessary tables
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

CREATE TABLE IF NOT EXISTS live_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'playing', 'ended')),
  team1_score integer DEFAULT 0,
  team2_score integer DEFAULT 0,
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_game_id uuid NOT NULL REFERENCES live_games(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  team text CHECK (team IN ('team1', 'team2')),
  score integer DEFAULT 0,
  territories_claimed integer DEFAULT 0,
  questions_answered integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  is_connected boolean DEFAULT true,
  last_active_at timestamptz DEFAULT now(),
  email text,
  organization text,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hex_territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_game_id uuid NOT NULL REFERENCES live_games(id) ON DELETE CASCADE,
  hex_id text NOT NULL,
  team text NOT NULL CHECK (team IN ('team1', 'team2')),
  claimed_by_player_id uuid REFERENCES game_players(id),
  claimed_at timestamptz DEFAULT now(),
  UNIQUE(live_game_id, hex_id)
);

CREATE TABLE IF NOT EXISTS individual_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS individual_game_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_game_id uuid NOT NULL REFERENCES individual_games(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  email text,
  organization text,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  score integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  wrong_answers integer DEFAULT 0,
  skipped_count integer DEFAULT 0,
  timeout_count integer DEFAULT 0,
  total_time_seconds integer DEFAULT 0,
  result_photo_url text,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 4. Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE hex_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_game_entries ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
CREATE POLICY "Admins can read own profile" ON admins FOR SELECT TO authenticated USING (auth.uid() = auth_id);
CREATE POLICY "Admins can update own profile" ON admins FOR UPDATE TO authenticated USING (auth.uid() = auth_id) WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Admins can create sessions" ON sessions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE admins.id = admin_id AND admins.auth_id = auth.uid() AND admins.is_approved = true));
CREATE POLICY "Admins can read own sessions" ON sessions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = admin_id AND admins.auth_id = auth.uid()));
CREATE POLICY "Admins can update own sessions" ON sessions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = admin_id AND admins.auth_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE admins.id = admin_id AND admins.auth_id = auth.uid()));
CREATE POLICY "Admins can delete own sessions" ON sessions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = admin_id AND admins.auth_id = auth.uid()));
CREATE POLICY "Public can read sessions by PIN" ON sessions FOR SELECT USING (true);

CREATE POLICY "Public can read session history" ON session_history FOR SELECT USING (true);
CREATE POLICY "Public can read leaderboards" ON leaderboards FOR SELECT USING (true);
CREATE POLICY "Public can insert leaderboard entries" ON leaderboards FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read live games" ON live_games FOR SELECT USING (true);
CREATE POLICY "Public can read game players" ON game_players FOR SELECT USING (true);
CREATE POLICY "Public can read territories" ON hex_territories FOR SELECT USING (true);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_admin_id ON sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_pin ON sessions(session_pin);
CREATE INDEX IF NOT EXISTS idx_live_games_session_id ON live_games(session_id);
CREATE INDEX IF NOT EXISTS idx_game_players_live_game_id ON game_players(live_game_id);
CREATE INDEX IF NOT EXISTS idx_hex_territories_live_game_id ON hex_territories(live_game_id);

-- 7. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE live_games;
ALTER PUBLICATION supabase_realtime ADD TABLE game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE hex_territories;

-- ============================================================================
-- MANUAL STEP REQUIRED:
-- After running this script, you need to create the auth user manually:
--
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User"
-- 3. Enter:
--    Email: Sarah.Yasser@eand.com.eg
--    Password: The&way
--    Confirm: Yes
-- 4. Copy the User ID (it will look like: 550e8400-e29b-41d4-a716-446655440000)
-- 5. Then run this SQL (replace USER_ID_HERE with the actual ID):
--
-- INSERT INTO admins (auth_id, email, organization_name, is_super_admin, is_approved, approved_at)
-- VALUES (
--   'USER_ID_HERE'::uuid,
--   'Sarah.Yasser@eand.com.eg',
--   'e& Egypt',
--   true,
--   true,
--   now()
-- );
-- ============================================================================
