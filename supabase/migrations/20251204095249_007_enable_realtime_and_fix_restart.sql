/*
  # Enable Realtime and Fix Session Restart

  1. Changes
    - Enable replica identity for realtime updates on live_games, game_players, and hex_territories tables
    - Ensure proper realtime functionality for all game tables
    
  2. Notes
    - Replica identity is required for Supabase Realtime to broadcast changes
    - Using FULL replica identity to broadcast all column values
*/

-- Enable replica identity for realtime updates
ALTER TABLE live_games REPLICA IDENTITY FULL;
ALTER TABLE game_players REPLICA IDENTITY FULL;
ALTER TABLE hex_territories REPLICA IDENTITY FULL;