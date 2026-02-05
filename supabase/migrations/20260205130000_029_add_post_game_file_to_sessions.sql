/*
  # Add post_game_file_url to sessions

  This migration adds a post_game_file_url column to sessions table
  to store PDF files that are shown after game completion.
*/

-- Add post_game_file_url column to sessions
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS post_game_file_url text;

-- Create storage bucket for session files if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('session-files', 'session-files', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads to session-files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'session-files');

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to session-files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'session-files');

-- Create policy to allow authenticated users to delete their files
CREATE POLICY "Allow authenticated deletes from session-files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'session-files');
