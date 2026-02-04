/*
  # Create Missing Admin Profiles

  1. Changes
    - Insert admin profiles for auth users that don't have them
    - This fixes orphaned auth users from failed signups
    
  2. Notes
    - Creates admin records for all auth users without corresponding admin profiles
    - Uses email from auth.users table
*/

INSERT INTO admins (auth_id, email, organization_name, is_super_admin)
SELECT 
  u.id,
  u.email,
  '',
  false
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM admins a WHERE a.auth_id = u.id
);
