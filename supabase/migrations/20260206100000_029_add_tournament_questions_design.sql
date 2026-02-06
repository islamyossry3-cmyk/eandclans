/*
  # Add questions and design columns to tournaments

  1. Changes
    - Add `questions` jsonb column to store tournament questions directly
    - Add `design` jsonb column to store team design/style configuration
    - Add tournaments and tournament_sessions to realtime publication
*/

-- Add questions column
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]'::jsonb;

-- Add design column
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS design jsonb DEFAULT '{}'::jsonb;

-- Enable realtime for tournament tables
DO $$
BEGIN
  -- Add tournaments to realtime if not already
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'tournaments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'tournament_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tournament_sessions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'tournament_players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tournament_players;
  END IF;
END $$;
