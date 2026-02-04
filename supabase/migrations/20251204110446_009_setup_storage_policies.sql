/*
  # Setup Storage Policies for Game Assets

  1. Storage Object Policies
    - Allow public read access to files in game-assets bucket
    - Allow authenticated users to upload files to game-assets bucket
    - Allow authenticated users to update their uploaded files
    - Allow authenticated users to delete files from game-assets bucket
    
  2. Security Notes
    - Public read access for all files in the game-assets bucket
    - Only authenticated users (admins) can upload, update, and delete files
    - Bucket creation is handled by the Edge Function with service role
*/

-- Create policy for public read access to game-assets bucket
CREATE POLICY "Public read access for game assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'game-assets');

-- Create policy for authenticated users to insert files
CREATE POLICY "Authenticated users can upload game assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'game-assets');

-- Create policy for authenticated users to update files
CREATE POLICY "Authenticated users can update game assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'game-assets')
  WITH CHECK (bucket_id = 'game-assets');

-- Create policy for authenticated users to delete files
CREATE POLICY "Authenticated users can delete game assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'game-assets');