/*
  # Update Theme Constraint to Match Application Themes
  
  1. Changes
    - Drop existing CHECK constraint on design_background_theme
    - Add new CHECK constraint with updated theme values: 'island', 'space', 'city', 'strategy'
    - Update default value from 'ocean' to 'island'
    
  2. Notes
    - Existing sessions with 'ocean', 'forest', or 'desert' themes will be updated to 'island'
    - This ensures consistency between database schema and application theme options
*/

-- First, update any existing sessions with old theme values to use 'island'
UPDATE sessions
SET design_background_theme = 'island'
WHERE design_background_theme IN ('ocean', 'forest', 'desert');

-- Drop the old CHECK constraint
ALTER TABLE sessions
DROP CONSTRAINT IF EXISTS sessions_design_background_theme_check;

-- Add new CHECK constraint with updated theme values
ALTER TABLE sessions
ADD CONSTRAINT sessions_design_background_theme_check
CHECK (design_background_theme IN ('island', 'space', 'city', 'strategy'));

-- Update the default value for new sessions
ALTER TABLE sessions
ALTER COLUMN design_background_theme SET DEFAULT 'island';