/*
  # Fix Security and Performance Issues

  1. Performance Optimizations
    - Add missing index for hex_territories.claimed_by foreign key
    - Remove unused indexes to reduce write overhead
    - Fix RLS policies to use (select auth.uid()) instead of auth.uid()

  2. Security Fixes
    - Fix function search_path to prevent security vulnerabilities
    - Set explicit search_path for security definer functions

  3. Indexes
    - Add: idx_hex_territories_claimed_by (for foreign key)
    - Remove: idx_question_banks_admin_id (unused)
    - Remove: idx_admins_approval_status (unused)
    - Remove: idx_admins_license_expires_at (unused)
    - Remove: idx_admins_last_login_at (unused)

  4. RLS Policy Updates
    - Update all session policies to use (select auth.uid())
    - This prevents re-evaluation for each row, improving performance
*/

-- ============================================
-- 1. Add Missing Index for Foreign Key
-- ============================================

CREATE INDEX IF NOT EXISTS idx_hex_territories_claimed_by 
  ON hex_territories(claimed_by);

-- ============================================
-- 2. Remove Unused Indexes
-- ============================================

DROP INDEX IF EXISTS idx_question_banks_admin_id;
DROP INDEX IF EXISTS idx_admins_approval_status;
DROP INDEX IF EXISTS idx_admins_license_expires_at;
DROP INDEX IF EXISTS idx_admins_last_login_at;

-- ============================================
-- 3. Fix Function Search Paths (Security)
-- ============================================

-- Recreate is_super_admin with fixed search_path
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE auth_id = auth.uid()
    AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Recreate is_approved_admin with fixed search_path
CREATE OR REPLACE FUNCTION is_approved_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE auth_id = auth.uid()
    AND approval_status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================
-- 4. Fix Session RLS Policies (Performance)
-- ============================================

-- Drop existing session policies
DROP POLICY IF EXISTS "Approved admins can create own sessions" ON sessions;
DROP POLICY IF EXISTS "Approved admins can read own sessions" ON sessions;
DROP POLICY IF EXISTS "Approved admins can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Approved admins can delete own sessions" ON sessions;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Approved admins can create own sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    is_approved_admin()
    AND EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = admin_id
      AND admins.auth_id = (select auth.uid())
    )
  );

CREATE POLICY "Approved admins can read own sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (
    is_approved_admin()
    AND EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = admin_id
      AND admins.auth_id = (select auth.uid())
    )
  );

CREATE POLICY "Approved admins can update own sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (
    is_approved_admin()
    AND EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = admin_id
      AND admins.auth_id = (select auth.uid())
    )
  )
  WITH CHECK (
    is_approved_admin()
    AND EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = admin_id
      AND admins.auth_id = (select auth.uid())
    )
  );

CREATE POLICY "Approved admins can delete own sessions"
  ON sessions FOR DELETE
  TO authenticated
  USING (
    is_approved_admin()
    AND EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = admin_id
      AND admins.auth_id = (select auth.uid())
    )
  );