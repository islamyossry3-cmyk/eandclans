/*
  # Add Tables to Realtime Publication

  1. Changes
    - Add live_games, game_players, and hex_territories to supabase_realtime publication
    - This enables real-time broadcasting of changes to these tables
    
  2. Notes
    - This is required for Supabase Realtime subscriptions to work
    - Without this, clients won't receive real-time updates
*/

-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE live_games;
ALTER PUBLICATION supabase_realtime ADD TABLE game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE hex_territories;