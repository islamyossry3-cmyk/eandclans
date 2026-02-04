/*
  # Add Admin Management Fields

  1. Changes to admins table
    - Add `approval_status` field to track admin approval (pending, approved, rejected)
    - Add `license_expires_at` field for license/subscription management
    - Add `last_login_at` field to track last login time
    - Add `notes` field for super admin to add notes about admins

  2. Security Updates
    - Add policy for super admins to read all admin profiles
    - Add policy for super admins to update any admin profile
    - Add policy for super admins to delete admin accounts

  3. Indexes
    - Add index on approval_status for faster filtering
    - Add index on license_expires_at for expiry checks
*/

-- Add new columns to admins table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE admins ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'license_expires_at'
  ) THEN
    ALTER TABLE admins ADD COLUMN license_expires_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE admins ADD COLUMN last_login_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'notes'
  ) THEN
    ALTER TABLE admins ADD COLUMN notes text;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admins_approval_status ON admins(approval_status);
CREATE INDEX IF NOT EXISTS idx_admins_license_expires_at ON admins(license_expires_at);
CREATE INDEX IF NOT EXISTS idx_admins_last_login_at ON admins(last_login_at);

-- Super admin policies for reading all admins
CREATE POLICY "Super admins can read all admin profiles"
  ON admins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins super_admin
      WHERE super_admin.auth_id = auth.uid()
      AND super_admin.is_super_admin = true
    )
  );

-- Super admin policies for updating any admin
CREATE POLICY "Super admins can update any admin profile"
  ON admins FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins super_admin
      WHERE super_admin.auth_id = auth.uid()
      AND super_admin.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins super_admin
      WHERE super_admin.auth_id = auth.uid()
      AND super_admin.is_super_admin = true
    )
  );

-- Super admin policies for deleting admins
CREATE POLICY "Super admins can delete any admin"
  ON admins FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins super_admin
      WHERE super_admin.auth_id = auth.uid()
      AND super_admin.is_super_admin = true
    )
  );

-- Update existing admins to have approved status (they were created before this system)
UPDATE admins SET approval_status = 'approved' WHERE approval_status = 'pending';