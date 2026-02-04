/*
  # Add Registration Fields to Game Players

  ## Changes
    - Add `player_email` column to game_players for email collection
    - Add `player_organization` column to game_players for organization/company
    - Add `custom_fields` JSONB column for additional custom registration fields
    - These fields match the registration fields system used in session configuration

  ## Purpose
    - Allow team battle games to collect the same registration data as individual games
    - Support custom registration fields defined in session settings
    - Maintain consistency between team and individual game modes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_players' AND column_name = 'player_email'
  ) THEN
    ALTER TABLE game_players ADD COLUMN player_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_players' AND column_name = 'player_organization'
  ) THEN
    ALTER TABLE game_players ADD COLUMN player_organization text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_players' AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE game_players ADD COLUMN custom_fields jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
