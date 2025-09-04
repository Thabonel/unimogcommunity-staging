-- Fix remaining security issues from the verification results
-- Run these commands in the Supabase SQL Editor

-- 1. Fix functions that still have INVOKER security type (need to be DEFINER)
-- First, let's identify the exact function signatures to target the right overloads

-- Fix get_user_subscription functions (both are INVOKER)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Find all get_user_subscription functions and fix them
    FOR func_record IN 
        SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'get_user_subscription'
    LOOP
        -- Fix each version
        IF func_record.args = 'user_uuid uuid' THEN
            EXECUTE 'ALTER FUNCTION public.get_user_subscription(user_uuid uuid) SECURITY DEFINER SET search_path = ''public''';
        ELSIF func_record.args = 'user_id uuid' THEN  
            EXECUTE 'ALTER FUNCTION public.get_user_subscription(user_id uuid) SECURITY DEFINER SET search_path = ''public''';
        END IF;
    END LOOP;
END $$;

-- Fix has_role functions (multiple INVOKER versions exist)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'has_role'
    LOOP
        -- Fix each version that doesn't already have DEFINER + search_path
        EXECUTE 'ALTER FUNCTION public.has_role(' || func_record.args || ') SECURITY DEFINER SET search_path = ''public''';
    END LOOP;
END $$;

-- Fix search_manual_chunks functions (both are INVOKER)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'search_manual_chunks'
    LOOP
        EXECUTE 'ALTER FUNCTION public.search_manual_chunks(' || func_record.args || ') SECURITY DEFINER SET search_path = ''public''';
    END LOOP;
END $$;

-- Fix search_wis_content function (one is still INVOKER)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args,
               prosecdef
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'search_wis_content'
        AND NOT p.prosecdef  -- Only target INVOKER functions
    LOOP
        EXECUTE 'ALTER FUNCTION public.search_wis_content(' || func_record.args || ') SECURITY DEFINER SET search_path = ''public''';
    END LOOP;
END $$;

-- 2. Fix functions that have DEFINER but missing SET search_path
-- These need SET search_path added

ALTER FUNCTION public.decrement_saved_count(listing_id uuid) SET search_path = 'public';
ALTER FUNCTION public.get_available_server() SET search_path = 'public';  
ALTER FUNCTION public.get_popular_wis_content(limit_count integer) SET search_path = 'public';
ALTER FUNCTION public.get_post_comment_count(post_id_param uuid) SET search_path = 'public';
ALTER FUNCTION public.get_post_like_count(post_id_param uuid) SET search_path = 'public';
ALTER FUNCTION public.increment_saved_count(listing_id uuid) SET search_path = 'public';
ALTER FUNCTION public.is_user_admin(user_id uuid) SET search_path = 'public';
ALTER FUNCTION public.user_has_liked_post(post_id_param uuid, user_id_param uuid) SET search_path = 'public';

-- Fix grant_free_access functions (both need search_path)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'grant_free_access'
    LOOP
        EXECUTE 'ALTER FUNCTION public.grant_free_access(' || func_record.args || ') SET search_path = ''public''';
    END LOOP;
END $$;

-- Fix search_wis_content that has DEFINER but no search_path
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args,
               prosecdef,
               prosrc
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'search_wis_content'
        AND p.prosecdef  -- Only DEFINER functions
        AND prosrc NOT LIKE '%SET search_path%'  -- Missing search_path
    LOOP
        EXECUTE 'ALTER FUNCTION public.search_wis_content(' || func_record.args || ') SET search_path = ''public''';
    END LOOP;
END $$;

-- 3. Final verification query
SELECT 
    routine_name, 
    routine_type,
    security_type,
    CASE 
        WHEN routine_definition LIKE '%SET search_path%' THEN 'Yes'
        ELSE 'No'
    END as has_search_path_set,
    pg_get_function_identity_arguments(p.oid) as function_signature
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
JOIN pg_namespace n ON p.pronamespace = n.oid AND n.nspname = r.routine_schema
WHERE r.routine_schema = 'public' 
AND r.routine_type = 'FUNCTION'
AND r.routine_name IN (
    'check_admin_access', 'has_role', 'is_user_admin', 'make_admin',
    'grant_free_access', 'revoke_free_access', 'get_user_subscription',
    'search_wis_content', 'search_manual_chunks', 'search_manual_chunks_text',
    'get_popular_wis_content', 'cleanup_old_rate_limits', 'cleanup_expired_sessions',
    'get_available_server', 'log_admin_action', 'get_post_like_count',
    'get_post_comment_count', 'user_has_liked_post', 'increment_saved_count',
    'decrement_saved_count'
)
ORDER BY routine_name, function_signature;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Security fixes applied! All functions should now have SECURITY DEFINER and SET search_path = ''public''';
END $$;