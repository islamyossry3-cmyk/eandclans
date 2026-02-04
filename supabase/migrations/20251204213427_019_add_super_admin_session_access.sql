/*
  # Add Super Admin Access to Sessions

  1. Problem
    - Super admins should be able to view all sessions for monitoring
    - Current policies only allow admins to see their own sessions

  2. Solution
    - Add policies for super admins to read all sessions
    - Super admins can view sessions but should not modify other admins' sessions
    - This allows for platform monitoring and analytics

  3. Changes
    - Add super admin read policy for sessions
    - Add super admin read policy for session_history
    - Add super admin read policy for question_banks
*/

-- Super admin can read all sessions
CREATE POLICY "Super admins can read all sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Super admin can read all session history
CREATE POLICY "Super admins can read all session history"
  ON session_history FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Super admin can read all question banks
CREATE POLICY "Super admins can read all question banks"
  ON question_banks FOR SELECT
  TO authenticated
  USING (is_super_admin());