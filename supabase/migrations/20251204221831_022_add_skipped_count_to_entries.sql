/*
  # Add Skipped Count Column to Individual Game Entries

  1. Changes
    - Add `skipped_count` column to `individual_game_entries` table
      - Tracks questions that were intentionally skipped by players
      - Separate from timeout_count which tracks questions that ran out of time

  2. Notes
    - Default value is 0
    - This allows better analytics to distinguish between skipped vs timed-out questions
*/

-- Add skipped_count column to individual_game_entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'individual_game_entries' AND column_name = 'skipped_count'
  ) THEN
    ALTER TABLE individual_game_entries ADD COLUMN skipped_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;
