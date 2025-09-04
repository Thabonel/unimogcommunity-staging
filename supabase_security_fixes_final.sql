-- FINAL Supabase Security Fixes - Only targeting existing functions
-- Run these commands in the Supabase SQL Editor

-- First, let's check what functions need fixing by finding ones without SECURITY DEFINER
-- This query will show functions that need to be fixed:
SELECT 
    routine_name, 
    routine_type,
    security_type,
    routine_definition LIKE '%SET search_path%' as has_search_path
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND security_type = 'INVOKER'  -- These need to be changed to DEFINER
ORDER BY routine_name;

-- Now fix the functions that actually exist and need fixing:
-- Only run ALTERs for functions that definitely exist

-- 1. Core admin and access functions
DO $$
BEGIN
    -- check_admin_access (already has SET search_path from migration)
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'check_admin_access') THEN
        ALTER FUNCTION public.check_admin_access() SECURITY DEFINER;
    END IF;

    -- has_role (already has SET search_path from migration)
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'has_role') THEN
        ALTER FUNCTION public.has_role(role_name text) SECURITY DEFINER;
    END IF;

    -- is_user_admin
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'is_user_admin') THEN
        ALTER FUNCTION public.is_user_admin(user_id uuid) SECURITY DEFINER SET search_path = 'public';
    END IF;

    -- make_admin
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'make_admin') THEN
        ALTER FUNCTION public.make_admin(target_user_id uuid, granting_user_id uuid) SECURITY DEFINER SET search_path = 'public';
    END IF;
END $$;

-- 2. Access and subscription functions
DO $$
BEGIN
    -- grant_free_access (multiple versions exist)
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'grant_free_access' 
               AND p.pronargs = 2 AND pg_get_function_identity_arguments(p.oid) LIKE '%target_user_id%granting_user_id%') THEN
        ALTER FUNCTION public.grant_free_access(target_user_id uuid, granting_user_id uuid) SECURITY DEFINER SET search_path = 'public';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'grant_free_access' 
               AND p.pronargs = 2 AND pg_get_function_identity_arguments(p.oid) LIKE '%target_feature%') THEN
        ALTER FUNCTION public.grant_free_access(target_user_id uuid, target_feature text) SECURITY DEFINER;
    END IF;

    -- revoke_free_access
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'revoke_free_access') THEN
        ALTER FUNCTION public.revoke_free_access(target_user_id uuid, revoking_user_id uuid) SECURITY DEFINER SET search_path = 'public';
    END IF;

    -- get_user_subscription (multiple versions)
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'get_user_subscription' 
               AND pg_get_function_result(p.oid) = 'json') THEN
        ALTER FUNCTION public.get_user_subscription(user_id uuid) SECURITY DEFINER;
    END IF;
END $$;

-- 3. Search functions
DO $$
BEGIN
    -- search_wis_content (single parameter version)
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'search_wis_content' AND p.pronargs = 1) THEN
        ALTER FUNCTION public.search_wis_content(search_query text) SECURITY DEFINER SET search_path = 'public';
    END IF;

    -- search_wis_content (three parameter version) 
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'search_wis_content' AND p.pronargs = 3) THEN
        ALTER FUNCTION public.search_wis_content(search_query text, filter_model text, filter_system text) SECURITY DEFINER SET search_path = 'public';
    END IF;

    -- search_manual_chunks (text version)
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'search_manual_chunks' 
               AND pg_get_function_identity_arguments(p.oid) LIKE '%query_text text%') THEN
        ALTER FUNCTION public.search_manual_chunks(query_text text, match_count integer, match_threshold float) SECURITY DEFINER SET search_path = 'public';
    END IF;

    -- search_manual_chunks_text
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'search_manual_chunks_text') THEN
        ALTER FUNCTION public.search_manual_chunks_text(query_text text, match_count integer, match_threshold float) SECURITY DEFINER SET search_path = 'public';
    END IF;

    -- get_popular_wis_content
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'get_popular_wis_content') THEN
        ALTER FUNCTION public.get_popular_wis_content(limit_count integer) SECURITY DEFINER SET search_path = 'public';
    END IF;
END $$;

-- 4. Utility and cleanup functions  
DO $$
BEGIN
    -- cleanup_old_rate_limits
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'cleanup_old_rate_limits') THEN
        ALTER FUNCTION public.cleanup_old_rate_limits() SECURITY DEFINER SET search_path = 'public';
    END IF;

    -- cleanup_expired_sessions  
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'cleanup_expired_sessions') THEN
        ALTER FUNCTION public.cleanup_expired_sessions() SECURITY DEFINER SET search_path = 'public';
    END IF;

    -- get_available_server
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'get_available_server') THEN
        ALTER FUNCTION public.get_available_server() SECURITY DEFINER SET search_path = 'public';
    END IF;

    -- log_admin_action
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'log_admin_action') THEN
        ALTER FUNCTION public.log_admin_action(p_action text, p_entity_type text, p_entity_id text, p_details jsonb) SECURITY DEFINER SET search_path = 'public';
    END IF;
END $$;

-- 5. Community functions
DO $$
BEGIN
    -- get_post_like_count
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'get_post_like_count') THEN
        ALTER FUNCTION public.get_post_like_count(post_id_param uuid) SECURITY DEFINER SET search_path = 'public';
    END IF;

    -- get_post_comment_count
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'get_post_comment_count') THEN
        ALTER FUNCTION public.get_post_comment_count(post_id_param uuid) SECURITY DEFINER SET search_path = 'public';
    END IF;

    -- user_has_liked_post
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'user_has_liked_post') THEN
        ALTER FUNCTION public.user_has_liked_post(post_id_param uuid, user_id_param uuid) SECURITY DEFINER SET search_path = 'public';
    END IF;
END $$;

-- 6. Marketplace functions
DO $$
BEGIN
    -- increment_saved_count
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'increment_saved_count') THEN
        ALTER FUNCTION public.increment_saved_count(listing_id uuid) SECURITY DEFINER SET search_path = 'public';
    END IF;

    -- decrement_saved_count
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'decrement_saved_count') THEN
        ALTER FUNCTION public.decrement_saved_count(listing_id uuid) SECURITY DEFINER SET search_path = 'public';
    END IF;
END $$;

-- 7. Verification query - Run this after to see what was fixed
SELECT 
    routine_name, 
    routine_type,
    security_type,
    CASE 
        WHEN routine_definition LIKE '%SET search_path%' THEN 'Yes'
        ELSE 'No'
    END as has_search_path_set
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name IN (
    'check_admin_access', 'has_role', 'is_user_admin', 'make_admin',
    'grant_free_access', 'revoke_free_access', 'get_user_subscription',
    'search_wis_content', 'search_manual_chunks', 'search_manual_chunks_text',
    'get_popular_wis_content', 'cleanup_old_rate_limits', 'cleanup_expired_sessions',
    'get_available_server', 'log_admin_action', 'get_post_like_count',
    'get_post_comment_count', 'user_has_liked_post', 'increment_saved_count',
    'decrement_saved_count'
)
ORDER BY routine_name;

-- 8. Auth settings note
-- For OTP expiry and leaked password protection:
-- 1. Go to Supabase Dashboard > Authentication > Settings
-- 2. Under "Email OTP expiry" set to 600 seconds (10 minutes)
-- 3. Enable "Leaked Password Protection" if available in your project settings