-- QUICK FIX: Essential RLS Policies for Photo Uploads
-- Copy and paste this into Supabase Dashboard -> SQL Editor -> Run

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Profile Photos_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "Profile Photos_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "vehicle_photos_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "vehicle_photos_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_read_policy" ON storage.objects;

-- ESSENTIAL POLICIES FOR PROFILE PHOTOS BUCKET
CREATE POLICY "Profile Photos_upload_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'Profile Photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Profile Photos_read_policy"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'Profile Photos');

-- ESSENTIAL POLICIES FOR VEHICLE PHOTOS BUCKET  
CREATE POLICY "vehicle_photos_upload_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vehicle_photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "vehicle_photos_read_policy"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle_photos');

-- ESSENTIAL POLICIES FOR AVATARS BUCKET
CREATE POLICY "avatars_upload_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "avatars_read_policy"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- Update bucket MIME types
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
WHERE name IN ('Profile Photos', 'vehicle_photos', 'avatars');

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT 'Photo upload policies applied successfully!' as result;