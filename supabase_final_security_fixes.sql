-- Final Security Fixes for Remaining Warnings
-- Run these commands in the Supabase SQL Editor

-- 1. Fix check_admin_access function that still has mutable search_path
-- Let's check what's wrong with this specific function
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as args,
    p.prosecdef as is_security_definer,
    p.proconfig as config_array,
    array_to_string(p.proconfig, ', ') as config_settings,
    p.prosrc LIKE '%SET search_path%' as has_set_in_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'check_admin_access';

-- Force fix check_admin_access function
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'check_admin_access'
    LOOP
        -- First ensure it's SECURITY DEFINER
        EXECUTE format('ALTER FUNCTION public.check_admin_access(%s) SECURITY DEFINER', rec.args);
        -- Then set search_path
        EXECUTE format('ALTER FUNCTION public.check_admin_access(%s) SET search_path = public', rec.args);
        RAISE NOTICE 'Fixed check_admin_access(%s)', rec.args;
    END LOOP;
END $$;

-- 2. Move vector extension from public schema to extensions schema
-- WARNING: This might affect existing vector operations - test carefully first!
-- Only uncomment if you want to fix the extension_in_public warning

-- Check if extensions schema exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'extensions') THEN
        CREATE SCHEMA extensions;
        RAISE NOTICE 'Created extensions schema';
    END IF;
END $$;

-- UNCOMMENT BELOW ONLY IF YOU WANT TO MOVE THE VECTOR EXTENSION
-- This will fix the "extension_in_public" warning but may break existing vector operations
/*
DO $$
BEGIN
    -- Move vector extension to extensions schema
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        ALTER EXTENSION vector SET SCHEMA extensions;
        RAISE NOTICE 'Moved vector extension to extensions schema';
        RAISE NOTICE 'WARNING: You may need to update your vector function calls to use extensions.vector types';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Failed to move vector extension: %', SQLERRM;
    RAISE NOTICE 'This may require manual intervention or recreation of vector-dependent objects';
END $$;
*/

-- 3. Auth configuration fixes
-- These cannot be done via SQL - must be done in Supabase Dashboard
-- Go to: Authentication > Settings in your Supabase Dashboard

-- For OTP expiry warning:
-- Set "Email OTP expiry" to 600 seconds (10 minutes) or less

-- For leaked password protection warning: 
-- Enable "Leaked Password Protection" checkbox

-- Alternative: Use Supabase Management API if you have the keys
-- But this requires service role key and API calls outside of SQL

-- Create a reminder for manual steps
DO $$
BEGIN
    RAISE NOTICE '=== MANUAL STEPS REQUIRED ===';
    RAISE NOTICE '1. Go to Supabase Dashboard > Authentication > Settings';
    RAISE NOTICE '2. Set "Email OTP expiry" to 600 seconds (10 minutes)';
    RAISE NOTICE '3. Enable "Leaked Password Protection"';
    RAISE NOTICE '4. Optional: Consider moving vector extension (commented out above)';
    RAISE NOTICE '';
    RAISE NOTICE 'After these steps, all security warnings should be resolved!';
END $$;

-- Verification: Check the check_admin_access function after fix
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as args,
    p.prosecdef as is_security_definer,
    CASE 
        WHEN p.proconfig IS NOT NULL AND array_to_string(p.proconfig, ',') LIKE '%search_path%' 
        THEN 'YES' 
        ELSE 'NO' 
    END as has_search_path,
    array_to_string(p.proconfig, ', ') as config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'check_admin_access'
ORDER BY args;