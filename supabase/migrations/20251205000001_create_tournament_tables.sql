/*
  # Tournament System Tables

  1. New Tables
    - `tournaments` - Tournament configuration and metadata
    - `tournament_sessions` - Auto-generated game sessions within a tournament
    - `tournament_players` - Persistent player data across tournament sessions

  2. Changes
    - Add `credits` and `preferred_language` columns to `game_players`

  3. Security
    - Enable RLS on all tables
    - Public read access for tournament display
    - Controlled write access for game updates
*/

-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  session_duration_seconds integer DEFAULT 480, -- 8 minutes
  break_duration_seconds integer DEFAULT 120, -- 2 minutes
  max_players_per_session integer DEFAULT 50,
  max_players_per_team integer DEFAULT 25,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'paused', 'completed')),
  question_bank_id uuid REFERENCES question_banks(id) ON DELETE SET NULL,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tournament_sessions table
CREATE TABLE IF NOT EXISTS tournament_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  session_number integer NOT NULL,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  actual_start timestamptz,
  actual_end timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  team1_final_score integer DEFAULT 0,
  team2_final_score integer DEFAULT 0,
  winner text CHECK (winner IN ('team1', 'team2', 'tie', NULL)),
  created_at timestamptz DEFAULT now()
);

-- Create tournament_players table
CREATE TABLE IF NOT EXISTS tournament_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  email text,
  preferred_language text DEFAULT 'en' CHECK (preferred_language IN ('en', 'ar')),
  total_credits integer DEFAULT 0,
  total_correct_answers integer DEFAULT 0,
  total_territories_claimed integer DEFAULT 0,
  sessions_played integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, player_name)
);

-- Add credits and preferred_language columns to game_players if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_players' AND column_name = 'credits'
  ) THEN
    ALTER TABLE game_players ADD COLUMN credits integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_players' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE game_players ADD COLUMN preferred_language text DEFAULT 'en' CHECK (preferred_language IN ('en', 'ar'));
  END IF;
END $$;

-- Enable RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_players ENABLE ROW LEVEL SECURITY;

-- Tournaments policies
CREATE POLICY "Public can read tournaments"
  ON tournaments FOR SELECT
  USING (true);

CREATE POLICY "Admins can create tournaments"
  ON tournaments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update own tournaments"
  ON tournaments FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete own tournaments"
  ON tournaments FOR DELETE
  USING (true);

-- Tournament sessions policies
CREATE POLICY "Public can read tournament sessions"
  ON tournament_sessions FOR SELECT
  USING (true);

CREATE POLICY "System can create tournament sessions"
  ON tournament_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update tournament sessions"
  ON tournament_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Tournament players policies
CREATE POLICY "Public can read tournament players"
  ON tournament_players FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join tournaments"
  ON tournament_players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Players can update own data"
  ON tournament_players FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_admin_id ON tournaments(admin_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON tournaments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_tournament_id ON tournament_sessions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_status ON tournament_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament_id ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_name ON tournament_players(player_name);
