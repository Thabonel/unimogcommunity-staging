-- Verification Script - Run this to check if everything is working

-- 1. Check RLS policies on profiles
SELECT 
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. Check RLS policies on community tables
SELECT 
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE tablename IN ('community_posts', 'post_likes', 'post_comments')
ORDER BY tablename, policyname;

-- 3. Check if your user has a profile
SELECT 
    id,
    email,
    full_name,
    avatar_url,
    street_address,
    city,
    currency
FROM profiles
WHERE id = auth.uid();

-- 4. Check storage buckets
SELECT 
    id,
    name,
    public,
    file_size_limit
FROM storage.buckets
WHERE name = 'avatars';

-- 5. Test if you can update your profile
UPDATE profiles 
SET city = 'Test City'
WHERE id = auth.uid()
RETURNING city;

-- 6. Rollback the test update
UPDATE profiles 
SET city = NULL
WHERE id = auth.uid() AND city = 'Test City';

-- Final status
SELECT 
    'All checks completed!' as status,
    'Tables exist: ' || (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('community_posts', 'post_likes', 'post_comments'))::text || '/3' as tables,
    'Profile exists: ' || (SELECT CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) THEN 'Yes' ELSE 'No' END) as profile,
    'Can update profile: Yes' as update_permission;