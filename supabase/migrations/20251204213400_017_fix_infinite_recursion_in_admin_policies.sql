/*
  # Fix Infinite Recursion in Admin Policies

  1. Problem
    - Super admin policies were querying the admins table from within admins table policies
    - This created infinite recursion when checking permissions

  2. Solution
    - Create a security definer function to check super admin status
    - This function bypasses RLS and prevents recursion
    - Update policies to use this function instead of subqueries

  3. Changes
    - Drop existing super admin policies
    - Create helper function for checking super admin status
    - Recreate policies using the helper function
*/

-- Drop the problematic policies
DROP POLICY IF EXISTS "Super admins can read all admin profiles" ON admins;
DROP POLICY IF EXISTS "Super admins can update any admin profile" ON admins;
DROP POLICY IF EXISTS "Super admins can delete any admin" ON admins;

-- Create a security definer function to check if current user is super admin
-- This bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE auth_id = auth.uid()
    AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies using the helper function
CREATE POLICY "Super admins can read all admin profiles"
  ON admins FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admins can update any admin profile"
  ON admins FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can delete any admin"
  ON admins FOR DELETE
  TO authenticated
  USING (is_super_admin());