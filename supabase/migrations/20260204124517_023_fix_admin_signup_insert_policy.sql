/*
  # Fix Admin Signup - Add INSERT Policy

  1. Problem
    - Users can sign up in auth.users
    - But they CANNOT create their admin profile (no INSERT policy)
    - This causes login to fail (admin profile not found)

  2. Solution
    - Add INSERT policy for authenticated users to create their own admin profile
    - This allows signup to complete successfully

  3. Security
    - Users can only insert records with their own auth_id
    - Cannot create profiles for other users
*/

-- Add INSERT policy for admins table during signup
CREATE POLICY "Users can create own admin profile during signup"
  ON admins
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_id);
