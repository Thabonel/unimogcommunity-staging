-- Fix Row Level Security policies for storage buckets
-- This migration resolves "profile bucket not found" errors and photo upload issues

-- ====================================
-- 1. ENABLE RLS ON STORAGE OBJECTS
-- ====================================

-- Ensure RLS is enabled on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ====================================
-- 2. CREATE/UPDATE STORAGE BUCKETS
-- ====================================

-- Ensure all required buckets exist with proper configuration
-- Note: Using ON CONFLICT to handle existing buckets gracefully
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  -- Profile Photos bucket (with space and capitals as expected by frontend)
  ('Profile Photos', 'Profile Photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  -- Fallback profile_photos bucket (lowercase, no space)
  ('profile_photos', 'profile_photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  -- Vehicle photos bucket
  ('vehicle_photos', 'vehicle_photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  -- User photos bucket (with dash)
  ('user-photos', 'user-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  -- Avatars bucket
  ('avatars', 'avatars', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ====================================
-- 3. DROP EXISTING STORAGE OBJECT POLICIES
-- ====================================

-- Drop all existing policies to recreate them properly
DROP POLICY IF EXISTS "Allow public to view public bucket files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;

-- Drop bucket-specific policies if they exist
DROP POLICY IF EXISTS "profile_photos_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_delete_policy" ON storage.objects;

DROP POLICY IF EXISTS "Profile Photos_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "Profile Photos_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "Profile Photos_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "Profile Photos_delete_policy" ON storage.objects;

DROP POLICY IF EXISTS "vehicle_photos_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "vehicle_photos_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "vehicle_photos_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "vehicle_photos_delete_policy" ON storage.objects;

DROP POLICY IF EXISTS "user-photos_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "user-photos_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "user-photos_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "user-photos_delete_policy" ON storage.objects;

DROP POLICY IF EXISTS "avatars_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_policy" ON storage.objects;

-- ====================================
-- 4. CREATE COMPREHENSIVE RLS POLICIES
-- ====================================

-- ====================================
-- 4.1. PROFILE PHOTOS BUCKET (with space and capitals)
-- ====================================

-- Allow authenticated users to upload to Profile Photos bucket
CREATE POLICY "Profile Photos_upload_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'Profile Photos' AND auth.uid() IS NOT NULL);

-- Allow public read access to Profile Photos bucket
CREATE POLICY "Profile Photos_read_policy"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'Profile Photos');

-- Allow users to update their own files in Profile Photos bucket
CREATE POLICY "Profile Photos_update_policy"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'Profile Photos' AND owner = auth.uid()::text);

-- Allow users to delete their own files in Profile Photos bucket
CREATE POLICY "Profile Photos_delete_policy"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'Profile Photos' AND owner = auth.uid()::text);

-- ====================================
-- 4.2. PROFILE_PHOTOS BUCKET (lowercase, no space - fallback)
-- ====================================

-- Allow authenticated users to upload to profile_photos bucket
CREATE POLICY "profile_photos_upload_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile_photos' AND auth.uid() IS NOT NULL);

-- Allow public read access to profile_photos bucket
CREATE POLICY "profile_photos_read_policy"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile_photos');

-- Allow users to update their own files in profile_photos bucket
CREATE POLICY "profile_photos_update_policy"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile_photos' AND owner = auth.uid()::text);

-- Allow users to delete their own files in profile_photos bucket
CREATE POLICY "profile_photos_delete_policy"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile_photos' AND owner = auth.uid()::text);

-- ====================================
-- 4.3. VEHICLE_PHOTOS BUCKET
-- ====================================

-- Allow authenticated users to upload to vehicle_photos bucket
CREATE POLICY "vehicle_photos_upload_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vehicle_photos' AND auth.uid() IS NOT NULL);

-- Allow public read access to vehicle_photos bucket
CREATE POLICY "vehicle_photos_read_policy"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle_photos');

-- Allow users to update their own files in vehicle_photos bucket
CREATE POLICY "vehicle_photos_update_policy"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'vehicle_photos' AND owner = auth.uid()::text);

-- Allow users to delete their own files in vehicle_photos bucket
CREATE POLICY "vehicle_photos_delete_policy"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'vehicle_photos' AND owner = auth.uid()::text);

-- ====================================
-- 4.4. USER-PHOTOS BUCKET
-- ====================================

-- Allow authenticated users to upload to user-photos bucket
CREATE POLICY "user-photos_upload_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-photos' AND auth.uid() IS NOT NULL);

-- Allow public read access to user-photos bucket
CREATE POLICY "user-photos_read_policy"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-photos');

-- Allow users to update their own files in user-photos bucket
CREATE POLICY "user-photos_update_policy"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'user-photos' AND owner = auth.uid()::text);

-- Allow users to delete their own files in user-photos bucket
CREATE POLICY "user-photos_delete_policy"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'user-photos' AND owner = auth.uid()::text);

-- ====================================
-- 4.5. AVATARS BUCKET
-- ====================================

-- Allow authenticated users to upload to avatars bucket
CREATE POLICY "avatars_upload_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- Allow public read access to avatars bucket
CREATE POLICY "avatars_read_policy"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow users to update their own files in avatars bucket
CREATE POLICY "avatars_update_policy"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND owner = auth.uid()::text);

-- Allow users to delete their own files in avatars bucket
CREATE POLICY "avatars_delete_policy"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND owner = auth.uid()::text);

-- ====================================
-- 5. GRANT NECESSARY PERMISSIONS
-- ====================================

-- Grant usage on storage schema
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;

-- Grant permissions on storage.objects table
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

-- Grant permissions on storage.buckets table
GRANT SELECT ON storage.buckets TO anon;
GRANT SELECT ON storage.buckets TO authenticated;

-- ====================================
-- 6. REFRESH SCHEMA CACHE
-- ====================================

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';

-- Return success message
SELECT 'Storage RLS policies fixed successfully. All photo upload buckets now have proper permissions.' as message;