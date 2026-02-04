/*
  # Fix Admin Signup - Add INSERT Policy

  1. Changes
    - Add INSERT policy for admins table to allow new user registration
    
  2. Security
    - Policy ensures users can only create admin profiles for themselves
    - Validates that the auth_id matches the authenticated user's ID
*/

CREATE POLICY "Users can create own admin profile"
  ON admins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_id);
