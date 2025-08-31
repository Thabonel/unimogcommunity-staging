-- Run this query in Supabase SQL Editor to see your profiles table structure
-- Copy and paste this entire query

-- 1. Show all columns in profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;