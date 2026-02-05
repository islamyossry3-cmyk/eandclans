/*
  # Add live_game_id to tournament_sessions

  This migration adds a live_game_id column to tournament_sessions table
  to link tournament sessions with live games.
*/

-- Add live_game_id column to tournament_sessions
ALTER TABLE tournament_sessions 
ADD COLUMN IF NOT EXISTS live_game_id uuid REFERENCES live_games(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_live_game_id 
ON tournament_sessions(live_game_id);
