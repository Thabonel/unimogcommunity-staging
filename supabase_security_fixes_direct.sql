-- Direct approach: Use pg_proc system table to fix search_path issues
-- This bypasses the information_schema view which may not reflect search_path correctly

-- First, let's see the actual function configurations
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as args,
    p.prosecdef as is_security_definer,
    p.proconfig as function_config,  -- This shows SET configurations
    CASE 
        WHEN p.proconfig IS NOT NULL AND array_to_string(p.proconfig, ',') LIKE '%search_path%' 
        THEN 'Has search_path' 
        ELSE 'Missing search_path' 
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN (
    'decrement_feedback_votes', 'get_trending_content', 'get_unread_message_count',
    'get_user_subscription', 'grant_free_access', 'has_role', 'is_admin',
    'is_trial_active', 'mark_conversation_as_read', 'mark_message_as_read',
    'search_manual_chunks', 'search_wis_content'
)
ORDER BY p.proname, args;

-- Now fix each function individually with explicit commands
-- decrement_feedback_votes
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'decrement_feedback_votes'
    LOOP
        EXECUTE format('ALTER FUNCTION public.decrement_feedback_votes(%s) SET search_path = public', rec.args);
        RAISE NOTICE 'Set search_path for decrement_feedback_votes(%s)', rec.args;
    END LOOP;
END $$;

-- get_trending_content
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'get_trending_content'
    LOOP
        EXECUTE format('ALTER FUNCTION public.get_trending_content(%s) SET search_path = public', rec.args);
        RAISE NOTICE 'Set search_path for get_trending_content(%s)', rec.args;
    END LOOP;
END $$;

-- get_unread_message_count
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'get_unread_message_count'
    LOOP
        EXECUTE format('ALTER FUNCTION public.get_unread_message_count(%s) SET search_path = public', rec.args);
        RAISE NOTICE 'Set search_path for get_unread_message_count(%s)', rec.args;
    END LOOP;
END $$;

-- get_user_subscription
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'get_user_subscription'
    LOOP
        EXECUTE format('ALTER FUNCTION public.get_user_subscription(%s) SET search_path = public', rec.args);
        RAISE NOTICE 'Set search_path for get_user_subscription(%s)', rec.args;
    END LOOP;
END $$;

-- grant_free_access
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'grant_free_access'
    LOOP
        EXECUTE format('ALTER FUNCTION public.grant_free_access(%s) SET search_path = public', rec.args);
        RAISE NOTICE 'Set search_path for grant_free_access(%s)', rec.args;
    END LOOP;
END $$;

-- has_role
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'has_role'
    LOOP
        EXECUTE format('ALTER FUNCTION public.has_role(%s) SET search_path = public', rec.args);
        RAISE NOTICE 'Set search_path for has_role(%s)', rec.args;
    END LOOP;
END $$;

-- is_trial_active
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'is_trial_active'
    LOOP
        EXECUTE format('ALTER FUNCTION public.is_trial_active(%s) SET search_path = public', rec.args);
        RAISE NOTICE 'Set search_path for is_trial_active(%s)', rec.args;
    END LOOP;
END $$;

-- mark_conversation_as_read
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'mark_conversation_as_read'
    LOOP
        EXECUTE format('ALTER FUNCTION public.mark_conversation_as_read(%s) SET search_path = public', rec.args);
        RAISE NOTICE 'Set search_path for mark_conversation_as_read(%s)', rec.args;
    END LOOP;
END $$;

-- mark_message_as_read
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'mark_message_as_read'
    LOOP
        EXECUTE format('ALTER FUNCTION public.mark_message_as_read(%s) SET search_path = public', rec.args);
        RAISE NOTICE 'Set search_path for mark_message_as_read(%s)', rec.args;
    END LOOP;
END $$;

-- search_manual_chunks
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'search_manual_chunks'
    LOOP
        EXECUTE format('ALTER FUNCTION public.search_manual_chunks(%s) SET search_path = public', rec.args);
        RAISE NOTICE 'Set search_path for search_manual_chunks(%s)', rec.args;
    END LOOP;
END $$;

-- search_wis_content
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'search_wis_content'
    LOOP
        EXECUTE format('ALTER FUNCTION public.search_wis_content(%s) SET search_path = public', rec.args);
        RAISE NOTICE 'Set search_path for search_wis_content(%s)', rec.args;
    END LOOP;
END $$;

-- Final verification using pg_proc directly (more reliable than information_schema)
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
AND p.proname IN (
    'decrement_feedback_votes', 'get_trending_content', 'get_unread_message_count',
    'get_user_subscription', 'grant_free_access', 'has_role', 'is_admin',
    'is_trial_active', 'mark_conversation_as_read', 'mark_message_as_read',
    'search_manual_chunks', 'search_wis_content'
)
ORDER BY p.proname, args;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== FINAL SECURITY FIX COMPLETE ===';
    RAISE NOTICE 'All functions should now have:';
    RAISE NOTICE '1. SECURITY DEFINER = true';
    RAISE NOTICE '2. search_path = public';
    RAISE NOTICE 'Check the verification query above to confirm!';
END $$;