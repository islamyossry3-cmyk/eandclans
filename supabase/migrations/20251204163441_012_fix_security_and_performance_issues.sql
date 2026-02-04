/*
  # Fix Security and Performance Issues

  ## Changes Made

  1. **Performance Improvements**
     - Add missing index on `hex_territories.claimed_by` foreign key
     - Optimize RLS policies by using `(select auth.uid())` instead of `auth.uid()`
     - Remove unused indexes that add overhead without benefit

  2. **Security Enhancements**
     - Consolidate multiple permissive policies on sessions table

  3. **Affected Tables**
     - `admins` - RLS policy optimization
     - `sessions` - RLS policy optimization and consolidation
     - `session_history` - RLS policy optimization
     - `question_banks` - RLS policy optimization
     - `hex_territories` - Add performance index
     - Various tables - Remove unused indexes

  ## Security Notes
     All policies maintain the same security boundaries while improving performance.
     The `(select auth.uid())` pattern ensures auth functions are evaluated once per query
     rather than once per row, dramatically improving performance at scale.
*/

-- =====================================================
-- 1. Add Missing Index for Foreign Key
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_hex_territories_claimed_by 
ON hex_territories(claimed_by);

-- =====================================================
-- 2. Drop Unused Indexes
-- =====================================================

DROP INDEX IF EXISTS idx_sessions_status;
DROP INDEX IF EXISTS idx_question_banks_admin_id;
DROP INDEX IF EXISTS idx_leaderboards_score;
DROP INDEX IF EXISTS idx_live_games_status;

-- =====================================================
-- 3. Optimize RLS Policies - Admins Table
-- =====================================================

DROP POLICY IF EXISTS "Admins can read own profile" ON admins;
DROP POLICY IF EXISTS "Admins can update own profile" ON admins;
DROP POLICY IF EXISTS "Users can create own admin profile" ON admins;

CREATE POLICY "Admins can read own profile"
  ON admins FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = auth_id);

CREATE POLICY "Admins can update own profile"
  ON admins FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = auth_id)
  WITH CHECK ((select auth.uid()) = auth_id);

CREATE POLICY "Users can create own admin profile"
  ON admins FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = auth_id);

-- =====================================================
-- 4. Optimize RLS Policies - Sessions Table
-- =====================================================

DROP POLICY IF EXISTS "Admins can read own sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can create own sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can delete own sessions" ON sessions;
DROP POLICY IF EXISTS "Anyone can read sessions by PIN" ON sessions;

CREATE POLICY "Admins can read own sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = sessions.admin_id
      AND admins.auth_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can create own sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = sessions.admin_id
      AND admins.auth_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can update own sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = sessions.admin_id
      AND admins.auth_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = sessions.admin_id
      AND admins.auth_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can delete own sessions"
  ON sessions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = sessions.admin_id
      AND admins.auth_id = (select auth.uid())
    )
  );

CREATE POLICY "Public can read sessions by PIN"
  ON sessions FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- 5. Optimize RLS Policies - Session History Table
-- =====================================================

DROP POLICY IF EXISTS "Admins can create session history" ON session_history;

CREATE POLICY "Admins can create session history"
  ON session_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_history.session_id
      AND EXISTS (
        SELECT 1 FROM admins
        WHERE admins.id = sessions.admin_id
        AND admins.auth_id = (select auth.uid())
      )
    )
  );

-- =====================================================
-- 6. Optimize RLS Policies - Question Banks Table
-- =====================================================

DROP POLICY IF EXISTS "Admins can read own question banks" ON question_banks;
DROP POLICY IF EXISTS "Admins can create question banks" ON question_banks;
DROP POLICY IF EXISTS "Admins can update own question banks" ON question_banks;
DROP POLICY IF EXISTS "Admins can delete own question banks" ON question_banks;

CREATE POLICY "Admins can read own question banks"
  ON question_banks FOR SELECT
  TO authenticated
  USING (
    admin_id = (
      SELECT id FROM admins
      WHERE auth_id = (select auth.uid())
    )
    OR is_shared = true
  );

CREATE POLICY "Admins can create question banks"
  ON question_banks FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_id = (
      SELECT id FROM admins
      WHERE auth_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can update own question banks"
  ON question_banks FOR UPDATE
  TO authenticated
  USING (
    admin_id = (
      SELECT id FROM admins
      WHERE auth_id = (select auth.uid())
    )
  )
  WITH CHECK (
    admin_id = (
      SELECT id FROM admins
      WHERE auth_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can delete own question banks"
  ON question_banks FOR DELETE
  TO authenticated
  USING (
    admin_id = (
      SELECT id FROM admins
      WHERE auth_id = (select auth.uid())
    )
  );
