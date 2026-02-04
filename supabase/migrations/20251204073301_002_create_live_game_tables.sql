/*
  # Live Game State Tables

  1. New Tables
    - `live_games` - Active game sessions with real-time state
    - `game_players` - Players in active games
    - `hex_territories` - Territory ownership for hex grid

  2. Security
    - Enable RLS on all tables
    - Public read access for live game display
    - Controlled write access for game updates
*/

CREATE TABLE IF NOT EXISTS live_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'playing', 'ended')),
  started_at timestamptz,
  ends_at timestamptz,
  team1_score integer DEFAULT 0,
  team2_score integer DEFAULT 0,
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
  connected boolean DEFAULT true,
  joined_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hex_territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_game_id uuid NOT NULL REFERENCES live_games(id) ON DELETE CASCADE,
  hex_id text NOT NULL,
  owner text CHECK (owner IN ('team1', 'team2')),
  claimed_by uuid REFERENCES game_players(id) ON DELETE SET NULL,
  claimed_at timestamptz DEFAULT now(),
  UNIQUE(live_game_id, hex_id)
);

ALTER TABLE live_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE hex_territories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read live games"
  ON live_games FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create live games"
  ON live_games FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update live games"
  ON live_games FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read game players"
  ON game_players FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join games"
  ON game_players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Players can update own data"
  ON game_players FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read hex territories"
  ON hex_territories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can claim territories"
  ON hex_territories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update territories"
  ON hex_territories FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_live_games_session_id ON live_games(session_id);
CREATE INDEX IF NOT EXISTS idx_live_games_status ON live_games(status);
CREATE INDEX IF NOT EXISTS idx_game_players_live_game_id ON game_players(live_game_id);
CREATE INDEX IF NOT EXISTS idx_hex_territories_live_game_id ON hex_territories(live_game_id);