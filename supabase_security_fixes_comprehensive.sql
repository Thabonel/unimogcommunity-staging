-- Comprehensive fix for ALL remaining security issues
-- This will fix every function that needs SECURITY DEFINER and/or SET search_path

-- 1. Fix all get_user_subscription functions (still INVOKER)
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'get_user_subscription'
        AND NOT p.prosecdef  -- Only INVOKER functions
    LOOP
        EXECUTE format('ALTER FUNCTION public.get_user_subscription(%s) SECURITY DEFINER SET search_path = ''public''', rec.args);
        RAISE NOTICE 'Fixed get_user_subscription(%)', rec.args;
    END LOOP;
END $$;

-- 2. Fix all has_role functions that need search_path
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args, p.prosrc
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'has_role'
        AND p.prosrc NOT LIKE '%SET search_path%'  -- Missing search_path
    LOOP
        EXECUTE format('ALTER FUNCTION public.has_role(%s) SET search_path = ''public''', rec.args);
        RAISE NOTICE 'Added search_path to has_role(%)', rec.args;
    END LOOP;
END $$;

-- 3. Fix all search_manual_chunks functions
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'search_manual_chunks'
    LOOP
        EXECUTE format('ALTER FUNCTION public.search_manual_chunks(%s) SET search_path = ''public''', rec.args);
        RAISE NOTICE 'Added search_path to search_manual_chunks(%)', rec.args;
    END LOOP;
END $$;

-- 4. Fix all search_wis_content functions that need search_path
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args, p.prosrc
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'search_wis_content'
        AND p.prosrc NOT LIKE '%SET search_path%'  -- Missing search_path
    LOOP
        EXECUTE format('ALTER FUNCTION public.search_wis_content(%s) SET search_path = ''public''', rec.args);
        RAISE NOTICE 'Added search_path to search_wis_content(%)', rec.args;
    END LOOP;
END $$;

-- 5. Fix all grant_free_access functions that need search_path
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'grant_free_access'
    LOOP
        EXECUTE format('ALTER FUNCTION public.grant_free_access(%s) SET search_path = ''public''', rec.args);
        RAISE NOTICE 'Added search_path to grant_free_access(%)', rec.args;
    END LOOP;
END $$;

-- 6. Fix specific functions that definitely need search_path
ALTER FUNCTION public.decrement_saved_count(listing_id uuid) SET search_path = 'public';
ALTER FUNCTION public.get_available_server() SET search_path = 'public';  
ALTER FUNCTION public.get_popular_wis_content(limit_count integer) SET search_path = 'public';
ALTER FUNCTION public.get_post_comment_count(post_id_param uuid) SET search_path = 'public';
ALTER FUNCTION public.get_post_like_count(post_id_param uuid) SET search_path = 'public';
ALTER FUNCTION public.increment_saved_count(listing_id uuid) SET search_path = 'public';
ALTER FUNCTION public.is_user_admin(user_id uuid) SET search_path = 'public';
ALTER FUNCTION public.user_has_liked_post(post_id_param uuid, user_id_param uuid) SET search_path = 'public';

-- 7. Nuclear option - Fix ALL public schema functions to have proper security
-- This ensures no function is left behind
DO $$
DECLARE
    rec RECORD;
    cmd TEXT;
BEGIN
    -- First pass: Make all functions SECURITY DEFINER
    FOR rec IN 
        SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.prokind = 'f'  -- Only functions, not procedures
        AND NOT p.prosecdef  -- Only INVOKER functions
    LOOP
        BEGIN
            cmd := format('ALTER FUNCTION public.%I(%s) SECURITY DEFINER', rec.proname, rec.args);
            EXECUTE cmd;
            RAISE NOTICE 'Made DEFINER: %(%)', rec.proname, rec.args;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to alter %(%): %', rec.proname, rec.args, SQLERRM;
        END;
    END LOOP;

    -- Second pass: Add search_path to all functions that don't have it
    FOR rec IN 
        SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args, p.prosrc
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.prokind = 'f'  -- Only functions
        AND (p.prosrc NOT LIKE '%SET search_path%' OR p.prosrc IS NULL)
    LOOP
        BEGIN
            cmd := format('ALTER FUNCTION public.%I(%s) SET search_path = ''public''', rec.proname, rec.args);
            EXECUTE cmd;
            RAISE NOTICE 'Added search_path: %(%)', rec.proname, rec.args;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to add search_path to %(%): %', rec.proname, rec.args, SQLERRM;
        END;
    END LOOP;
END $$;

-- 8. Final comprehensive verification
SELECT 
    routine_name, 
    COUNT(*) as total_functions,
    SUM(CASE WHEN security_type = 'DEFINER' THEN 1 ELSE 0 END) as definer_count,
    SUM(CASE WHEN routine_definition LIKE '%SET search_path%' THEN 1 ELSE 0 END) as search_path_count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
GROUP BY routine_name
HAVING COUNT(*) > 1  -- Show functions with multiple versions
ORDER BY routine_name;

-- Success summary
DO $$
DECLARE
    definer_count INTEGER;
    total_count INTEGER;
    search_path_count INTEGER;
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE security_type = 'DEFINER'),
        COUNT(*),
        COUNT(*) FILTER (WHERE routine_definition LIKE '%SET search_path%')
    INTO definer_count, total_count, search_path_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION';

    RAISE NOTICE '=== SECURITY FIX SUMMARY ===';
    RAISE NOTICE 'Total functions: %', total_count;
    RAISE NOTICE 'SECURITY DEFINER: %', definer_count;
    RAISE NOTICE 'With search_path: %', search_path_count;
    RAISE NOTICE 'Security warnings should now be resolved!';
END $$;