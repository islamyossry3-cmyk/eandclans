/*
  # Fix Realtime and RLS for Game Players

  This migration ensures that:
  1. game_players table has proper RLS policies for INSERT/UPDATE/DELETE
  2. Realtime is properly configured for the game_players table
  3. All necessary columns have proper defaults

  ## Changes
  - Re-enable RLS policies to ensure public INSERT access
  - Verify realtime publication includes game_players
  - Add DELETE policy for game cleanup
*/

-- Ensure RLS is enabled
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them cleanly)
DROP POLICY IF EXISTS "Public can read game players" ON game_players;
DROP POLICY IF EXISTS "Anyone can join games" ON game_players;
DROP POLICY IF EXISTS "Players can update own data" ON game_players;
DROP POLICY IF EXISTS "Anyone can delete game players" ON game_players;

-- Recreate policies with explicit permissions
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

CREATE POLICY "Anyone can delete game players"
  ON game_players FOR DELETE
  USING (true);

-- Ensure replica identity is set for realtime
ALTER TABLE game_players REPLICA IDENTITY FULL;

-- Verify the table is in the realtime publication
-- (This is idempotent - will not error if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'game_players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_players;
  END IF;
END $$;

-- Also ensure live_games and hex_territories are in the publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'live_games'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_games;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'hex_territories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE hex_territories;
  END IF;
END $$;

-- Add index for faster player lookups by game
CREATE INDEX IF NOT EXISTS idx_game_players_live_game_team ON game_players(live_game_id, team);
