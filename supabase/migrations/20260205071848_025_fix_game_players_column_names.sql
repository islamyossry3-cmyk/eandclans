/*
  # Fix game_players Column Names

  1. Changes
    - Add `joined_at` column (using created_at as default value for existing records)
    - Rename `is_connected` to `connected` for consistency with application code
    - Add `last_active` column as alias to `last_active_at`
    
  2. Notes
    - These changes align the database schema with the application's expectations
    - Ensures backward compatibility with existing data
*/

-- Add joined_at column, defaulting to created_at for existing records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_players' AND column_name = 'joined_at'
  ) THEN
    ALTER TABLE game_players ADD COLUMN joined_at timestamptz DEFAULT now();
    
    -- Set joined_at to created_at for existing records
    UPDATE game_players SET joined_at = created_at WHERE joined_at IS NULL;
  END IF;
END $$;

-- Add connected column (copy data from is_connected)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_players' AND column_name = 'connected'
  ) THEN
    ALTER TABLE game_players ADD COLUMN connected boolean DEFAULT true;
    
    -- Copy existing is_connected values to connected
    UPDATE game_players SET connected = COALESCE(is_connected, true);
  END IF;
END $$;

-- Add last_active column (copy data from last_active_at)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_players' AND column_name = 'last_active'
  ) THEN
    ALTER TABLE game_players ADD COLUMN last_active timestamptz DEFAULT now();
    
    -- Copy existing last_active_at values to last_active
    UPDATE game_players SET last_active = COALESCE(last_active_at, now());
  END IF;
END $$;

-- Create a trigger to keep both connected columns in sync
CREATE OR REPLACE FUNCTION sync_game_player_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync connected fields
  IF NEW.connected IS DISTINCT FROM OLD.connected THEN
    NEW.is_connected := NEW.connected;
  ELSIF NEW.is_connected IS DISTINCT FROM OLD.is_connected THEN
    NEW.connected := NEW.is_connected;
  END IF;
  
  -- Sync last_active fields
  IF NEW.last_active IS DISTINCT FROM OLD.last_active THEN
    NEW.last_active_at := NEW.last_active;
  ELSIF NEW.last_active_at IS DISTINCT FROM OLD.last_active_at THEN
    NEW.last_active := NEW.last_active_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_game_player_columns_trigger ON game_players;
CREATE TRIGGER sync_game_player_columns_trigger
  BEFORE INSERT OR UPDATE ON game_players
  FOR EACH ROW
  EXECUTE FUNCTION sync_game_player_columns();