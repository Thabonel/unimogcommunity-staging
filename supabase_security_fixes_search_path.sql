-- Final fix: Add SET search_path to all functions that are missing it
-- This addresses the search_path_count being lower than definer_count

-- Add search_path to all custom functions (exclude vector extension functions)
DO $$
DECLARE
    rec RECORD;
    cmd TEXT;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Adding SET search_path to all functions missing it...';
    
    FOR rec IN 
        SELECT 
            p.oid, 
            p.proname, 
            pg_get_function_identity_arguments(p.oid) as args,
            n.nspname as schema_name
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.prokind = 'f'  -- Only functions
        AND p.proname NOT LIKE 'vector_%'  -- Exclude vector extension functions
        AND p.proname NOT LIKE '%_distance'  -- Exclude distance functions  
        AND p.proname NOT LIKE '%_product'   -- Exclude product functions
        AND p.proname NOT LIKE 'array_to_%'  -- Exclude array conversion functions
        AND p.proname NOT LIKE '%quantize'   -- Exclude quantize functions
        AND p.proname NOT LIKE '%normalize'  -- Exclude normalize functions
        AND p.proname NOT LIKE 'subvector'   -- Exclude subvector
        AND p.proname NOT LIKE 'l1_%'        -- Exclude L1 functions
        AND p.proname NOT LIKE 'l2_%'        -- Exclude L2 functions
        AND p.proname NOT LIKE '%halfvec'    -- Exclude halfvec functions
        AND p.proname NOT LIKE '%sparsevec'  -- Exclude sparsevec functions
        -- Only target functions that don't already have search_path set
        AND NOT EXISTS (
            SELECT 1 FROM pg_proc p2 
            WHERE p2.oid = p.oid 
            AND p2.prosrc LIKE '%SET search_path%'
        )
    LOOP
        BEGIN
            cmd := format('ALTER FUNCTION public.%I(%s) SET search_path = ''public''', rec.proname, rec.args);
            EXECUTE cmd;
            success_count := success_count + 1;
            RAISE NOTICE 'Added search_path: %(%)', rec.proname, rec.args;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Failed to add search_path to %(%): %', rec.proname, rec.args, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Successfully added search_path to % functions', success_count;
    RAISE NOTICE 'Failed to modify % functions', error_count;
END $$;

-- Specifically target the functions we know need search_path from your results
DO $$
DECLARE
    functions_to_fix TEXT[] := ARRAY[
        'decrement_feedback_votes',
        'get_trending_content', 
        'get_unread_message_count',
        'get_user_subscription',
        'grant_free_access',
        'has_role',
        'is_trial_active',
        'mark_conversation_as_read',
        'mark_message_as_read',
        'search_manual_chunks',
        'search_wis_content'
    ];
    func_name TEXT;
    rec RECORD;
    cmd TEXT;
BEGIN
    FOREACH func_name IN ARRAY functions_to_fix
    LOOP
        -- Fix all versions of each function
        FOR rec IN 
            SELECT 
                p.oid, 
                p.proname, 
                pg_get_function_identity_arguments(p.oid) as args
            FROM pg_proc p 
            JOIN pg_namespace n ON p.pronamespace = n.oid 
            WHERE n.nspname = 'public' 
            AND p.proname = func_name
        LOOP
            BEGIN
                cmd := format('ALTER FUNCTION public.%I(%s) SET search_path = ''public''', rec.proname, rec.args);
                EXECUTE cmd;
                RAISE NOTICE 'Fixed search_path: %(%)', rec.proname, rec.args;
            EXCEPTION WHEN OTHERS THEN
                -- Ignore errors for functions that already have it set
                IF SQLERRM NOT LIKE '%already has%' THEN
                    RAISE NOTICE 'Error fixing %(%): %', rec.proname, rec.args, SQLERRM;
                END IF;
            END;
        END LOOP;
    END LOOP;
END $$;

-- Final verification - should show much higher search_path_count
SELECT 
    routine_name, 
    COUNT(*) as total_functions,
    SUM(CASE WHEN security_type = 'DEFINER' THEN 1 ELSE 0 END) as definer_count,
    SUM(CASE WHEN routine_definition LIKE '%SET search_path%' THEN 1 ELSE 0 END) as search_path_count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name IN (
    'decrement_feedback_votes', 'get_trending_content', 'get_unread_message_count',
    'get_user_subscription', 'grant_free_access', 'has_role', 'is_admin',
    'is_trial_active', 'mark_conversation_as_read', 'mark_message_as_read',
    'search_manual_chunks', 'search_wis_content'
)
GROUP BY routine_name
ORDER BY routine_name;

-- Overall security status summary
DO $$
DECLARE
    total_funcs INTEGER;
    definer_funcs INTEGER;
    searchpath_funcs INTEGER;
    custom_funcs INTEGER;
BEGIN
    -- Count all public functions
    SELECT COUNT(*) INTO total_funcs
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
    
    -- Count DEFINER functions
    SELECT COUNT(*) INTO definer_funcs
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' 
    AND security_type = 'DEFINER';
    
    -- Count functions with search_path
    SELECT COUNT(*) INTO searchpath_funcs
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' 
    AND routine_definition LIKE '%SET search_path%';
    
    -- Count custom functions (excluding vector extension)
    SELECT COUNT(*) INTO custom_funcs
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
    AND routine_name NOT LIKE 'vector_%' 
    AND routine_name NOT LIKE '%_distance'
    AND routine_name NOT LIKE 'array_to_%'
    AND routine_name NOT LIKE '%quantize'
    AND routine_name NOT LIKE '%normalize'
    AND routine_name NOT LIKE 'subvector'
    AND routine_name NOT LIKE 'l1_%'
    AND routine_name NOT LIKE 'l2_%'
    AND routine_name NOT LIKE '%halfvec'
    AND routine_name NOT LIKE '%sparsevec'
    AND routine_name NOT LIKE '%_product';

    RAISE NOTICE '=== FINAL SECURITY STATUS ===';
    RAISE NOTICE 'Total functions: %', total_funcs;
    RAISE NOTICE 'Custom functions: %', custom_funcs;
    RAISE NOTICE 'SECURITY DEFINER: %', definer_funcs;
    RAISE NOTICE 'With search_path: %', searchpath_funcs;
    
    IF definer_funcs >= custom_funcs AND searchpath_funcs >= custom_funcs THEN
        RAISE NOTICE '✅ ALL SECURITY WARNINGS SHOULD BE RESOLVED!';
    ELSE
        RAISE NOTICE '⚠️  Some functions may still need attention';
    END IF;
END $$;