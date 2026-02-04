/*
  # Fix Theme Constraint to Match Application Themes

  1. Changes
    - Drop the existing CHECK constraint on design_background_theme
    - Update existing sessions with old theme values to use 'highland' (default)
    - Add new CHECK constraint with correct theme values: 'highland', 'desert', 'frost', 'shadow'
    - Update default value to 'highland'
    
  2. Notes
    - This fixes the mismatch between database schema and application theme options
    - Existing sessions will be migrated to the closest matching theme
    - 'island' → 'highland' (both green/nature themed)
    - 'space' → 'shadow' (both dark themed)
    - 'city' → 'highland' (default)
    - 'strategy' → 'highland' (default)
*/

-- Drop the old CHECK constraint first
ALTER TABLE sessions
DROP CONSTRAINT IF EXISTS sessions_design_background_theme_check;

-- Update any existing sessions with old theme values to use appropriate new themes
UPDATE sessions
SET design_background_theme = CASE
  WHEN design_background_theme = 'space' THEN 'shadow'
  WHEN design_background_theme IN ('island', 'city', 'strategy') THEN 'highland'
  ELSE design_background_theme
END
WHERE design_background_theme NOT IN ('highland', 'desert', 'frost', 'shadow');

-- Add new CHECK constraint with correct theme values matching the application
ALTER TABLE sessions
ADD CONSTRAINT sessions_design_background_theme_check
CHECK (design_background_theme IN ('highland', 'desert', 'frost', 'shadow'));

-- Update the default value for new sessions
ALTER TABLE sessions
ALTER COLUMN design_background_theme SET DEFAULT 'highland';