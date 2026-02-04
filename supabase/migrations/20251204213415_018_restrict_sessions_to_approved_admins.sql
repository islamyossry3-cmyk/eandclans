/*
  # Restrict Session Creation to Approved Admins

  1. Problem
    - Admins with 'pending' or 'rejected' status should not be able to create sessions
    - Only approved admins should have access to session management

  2. Solution
    - Create helper function to check if admin is approved
    - Update session policies to check approval status
    - Only approved admins can create, read, update, or delete sessions

  3. Changes
    - Create is_approved_admin() helper function
    - Update all session policies to include approval check
*/

-- Create a security definer function to check if current user is an approved admin
CREATE OR REPLACE FUNCTION is_approved_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE auth_id = auth.uid()
    AND approval_status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing session policies
DROP POLICY IF EXISTS "Admins can create own sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can read own sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can delete own sessions" ON sessions;

-- Recreate session policies with approval check
CREATE POLICY "Approved admins can create own sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    is_approved_admin()
    AND EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = admin_id
      AND admins.auth_id = auth.uid()
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
      AND admins.auth_id = auth.uid()
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
      AND admins.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    is_approved_admin()
    AND EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = admin_id
      AND admins.auth_id = auth.uid()
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
      AND admins.auth_id = auth.uid()
    )
  );