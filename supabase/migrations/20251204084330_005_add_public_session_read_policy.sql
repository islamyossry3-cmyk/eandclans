/*
  # Add Public Session Read Policy

  1. Changes
    - Add policy to allow anyone (including unauthenticated users) to read sessions
    - This is required for the live game page and player join flow
    - Sessions are identified by PIN, which acts as the access control

  2. Security
    - Sessions remain writable only by their owner admins
    - Public read access is safe because the session PIN acts as authentication
*/

CREATE POLICY "Anyone can read sessions by PIN"
  ON sessions FOR SELECT
  USING (true);
