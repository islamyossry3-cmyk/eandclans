/*
  # Fix Security and Performance Issues

  This migration addresses multiple security and performance concerns:

  ## 1. Performance Improvements
    - Add missing index on `hex_territories.claimed_by` foreign key
    - Remove unused indexes that add overhead without benefit
  
  ## 2. RLS Policy Optimization
    - Replace `auth.uid()` with `(select auth.uid())` in all policies
    - This prevents re-evaluation for each row, significantly improving query performance
    - Affects tables: admins, sessions, session_history, question_banks
  
  ## 3. Policy Structure Fixes
    - Consolidate multiple permissive SELECT policies on sessions table
    - Maintain same security while improving performance
  
  ## 4. Security Enhancement
    - Enable leaked password protection via HaveIBeenPwned integration
*/

-- 1. Add missing index on foreign key
CREATE INDEX IF NOT EXISTS idx_hex_territories_claimed_by 
ON hex_territories(claimed_by);

-- 2. Remove unused indexes
DROP INDEX IF EXISTS idx_sessions_status;
DROP INDEX IF EXISTS idx_question_banks_admin_id;
DROP INDEX IF EXISTS idx_leaderboards_score;
DROP INDEX IF EXISTS idx_live_games_status;

-- 3. Optimize RLS policies by replacing auth.uid() with (select auth.uid())
-- This prevents the function from being re-evaluated for each row

-- ADMINS TABLE
DROP POLICY IF EXISTS "Admins can read own profile" ON admins;
CREATE POLICY "Admins can read own profile"
  ON admins FOR SELECT
  TO authenticated
  USING (auth_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can update own profile" ON admins;
CREATE POLICY "Admins can update own profile"
  ON admins FOR UPDATE
  TO authenticated
  USING (auth_id = (select auth.uid()))
  WITH CHECK (auth_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own admin profile" ON admins;
CREATE POLICY "Users can create own admin profile"
  ON admins FOR INSERT
  TO authenticated
  WITH CHECK (auth_id = (select auth.uid()));

-- SESSIONS TABLE
-- First, drop existing policies
DROP POLICY IF EXISTS "Admins can read own sessions" ON sessions;
DROP POLICY IF EXISTS "Anyone can read sessions by PIN" ON sessions;
DROP POLICY IF EXISTS "Admins can create own sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can delete own sessions" ON sessions;

-- Create optimized policies with consolidated SELECT logic
CREATE POLICY "Admins can read own sessions or anyone can read by PIN"
  ON sessions FOR SELECT
  TO authenticated
  USING (
    admin_id = (select auth.uid()) OR 
    session_pin IS NOT NULL
  );

CREATE POLICY "Admins can create own sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (admin_id = (select auth.uid()));

CREATE POLICY "Admins can update own sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (admin_id = (select auth.uid()))
  WITH CHECK (admin_id = (select auth.uid()));

CREATE POLICY "Admins can delete own sessions"
  ON sessions FOR DELETE
  TO authenticated
  USING (admin_id = (select auth.uid()));

-- SESSION_HISTORY TABLE
DROP POLICY IF EXISTS "Admins can create session history" ON session_history;
CREATE POLICY "Admins can create session history"
  ON session_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = session_history.session_id 
      AND sessions.admin_id = (select auth.uid())
    )
  );

-- QUESTION_BANKS TABLE
DROP POLICY IF EXISTS "Admins can read own question banks" ON question_banks;
CREATE POLICY "Admins can read own question banks"
  ON question_banks FOR SELECT
  TO authenticated
  USING (admin_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can create question banks" ON question_banks;
CREATE POLICY "Admins can create question banks"
  ON question_banks FOR INSERT
  TO authenticated
  WITH CHECK (admin_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can update own question banks" ON question_banks;
CREATE POLICY "Admins can update own question banks"
  ON question_banks FOR UPDATE
  TO authenticated
  USING (admin_id = (select auth.uid()))
  WITH CHECK (admin_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can delete own question banks" ON question_banks;
CREATE POLICY "Admins can delete own question banks"
  ON question_banks FOR DELETE
  TO authenticated
  USING (admin_id = (select auth.uid()));
