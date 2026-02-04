/*
  # Prevent Duplicate Player Names in Same Game

  1. Changes
    - Add unique constraint on (live_game_id, player_name) to prevent duplicate player names in same game
    - This ensures each player can only join once per game session
  
  2. Security
    - No RLS changes needed (existing policies remain in place)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'game_players_unique_name_per_game'
  ) THEN
    ALTER TABLE game_players 
    ADD CONSTRAINT game_players_unique_name_per_game 
    UNIQUE (live_game_id, player_name);
  END IF;
END $$;