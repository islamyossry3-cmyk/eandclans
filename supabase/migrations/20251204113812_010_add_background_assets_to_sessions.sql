/*
  # Add Background Assets to Sessions

  1. Changes
    - Add `background_video_url` column to `sessions` table
    - Add `island_image_url` column to `sessions` table
    
  2. Purpose
    - Allow admins to select custom background videos from uploaded assets
    - Allow admins to select custom island images from uploaded assets
    - These assets will be displayed in the HexGrid during gameplay
    
  3. Notes
    - Columns are optional (nullable) to maintain backward compatibility
    - Existing sessions will continue to work with default assets
*/

-- Add background_video_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'background_video_url'
  ) THEN
    ALTER TABLE sessions ADD COLUMN background_video_url text;
  END IF;
END $$;

-- Add island_image_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'island_image_url'
  ) THEN
    ALTER TABLE sessions ADD COLUMN island_image_url text;
  END IF;
END $$;
