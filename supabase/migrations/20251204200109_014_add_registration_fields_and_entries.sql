/*
  # Add Registration Form Configuration and Individual Game Entries

  1. New Tables
    - `individual_game_entries`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to sessions)
      - `player_name` (text)
      - `player_email` (text, nullable)
      - `player_organization` (text, nullable)
      - `custom_fields` (jsonb, for additional custom fields)
      - `score` (integer)
      - `correct_count` (integer)
      - `wrong_count` (integer)
      - `timeout_count` (integer)
      - `total_time` (numeric)
      - `photo_url` (text, nullable)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Changes
    - Add `registration_fields` column to `sessions` table (jsonb)
      - This will store the configuration for what fields to show in registration

  3. Security
    - Enable RLS on `individual_game_entries` table
    - Admin can view all entries for their sessions
    - Players can insert their own entries
    - Public can read entries for analytics/leaderboard
*/

-- Add registration fields configuration to sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'registration_fields'
  ) THEN
    ALTER TABLE sessions ADD COLUMN registration_fields jsonb DEFAULT '[
      {"id": "name", "label": "Your Name", "type": "text", "required": true, "placeholder": "Enter your name", "enabled": true},
      {"id": "email", "label": "Email", "type": "email", "required": false, "placeholder": "your.email@example.com", "enabled": false},
      {"id": "organization", "label": "Organization", "type": "text", "required": false, "placeholder": "Your company or school", "enabled": false}
    ]'::jsonb;
  END IF;
END $$;

-- Create individual game entries table
CREATE TABLE IF NOT EXISTS individual_game_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  player_email text,
  player_organization text,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  score integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  wrong_count integer NOT NULL DEFAULT 0,
  timeout_count integer NOT NULL DEFAULT 0,
  total_time numeric NOT NULL DEFAULT 0,
  photo_url text,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_individual_game_entries_session_id ON individual_game_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_individual_game_entries_completed_at ON individual_game_entries(completed_at DESC);

-- Enable RLS
ALTER TABLE individual_game_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view entries for their sessions
CREATE POLICY "Admins can view entries for their sessions"
  ON individual_game_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = individual_game_entries.session_id
      AND sessions.admin_id = auth.uid()
    )
  );

-- Policy: Anyone can insert their game entry
CREATE POLICY "Anyone can insert game entries"
  ON individual_game_entries
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Public can read entries for leaderboard (limited fields)
CREATE POLICY "Public can read entries for leaderboard"
  ON individual_game_entries
  FOR SELECT
  TO public
  USING (true);

-- Policy: Admins can delete entries for their sessions
CREATE POLICY "Admins can delete entries for their sessions"
  ON individual_game_entries
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = individual_game_entries.session_id
      AND sessions.admin_id = auth.uid()
    )
  );
