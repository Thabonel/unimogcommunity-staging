-- Corrected Supabase Security Fixes
-- Run these commands in the Supabase SQL Editor to fix security warnings

-- 1. Fix functions that don't already have SECURITY DEFINER + SET search_path
-- These are the actual function signatures from your codebase:

-- Trial and subscription functions (from your security warnings)
ALTER FUNCTION public.start_45_day_trial(p_user_id uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.get_trial_status(p_user_id uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.has_active_subscription_or_trial(p_user_id uuid) SECURITY DEFINER SET search_path = 'public';

-- WIS/EPC content search functions
ALTER FUNCTION public.search_wis_content(search_query text, filter_model text, filter_system text) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.search_wis_content(search_query text) SECURITY DEFINER SET search_path = 'public';

-- Manual search functions (multiple overloads exist)
ALTER FUNCTION public.search_manual_chunks(query_text text, match_count integer, match_threshold float) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.search_manual_chunks_text(query_text text, match_count integer, match_threshold float) SECURITY DEFINER SET search_path = 'public';

-- Admin and role functions
ALTER FUNCTION public.is_user_admin(user_id uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.make_admin(target_user_id uuid, granting_user_id uuid) SECURITY DEFINER SET search_path = 'public';

-- Free access functions  
ALTER FUNCTION public.grant_free_access(target_user_id uuid, target_feature text) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.revoke_free_access(target_user_id uuid, revoking_user_id uuid) SECURITY DEFINER SET search_path = 'public';

-- System configuration functions
ALTER FUNCTION public.get_system_setting(p_key text) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.update_system_setting(p_key text, p_value jsonb, p_description text) SECURITY DEFINER SET search_path = 'public';

-- Utility and trigger functions
ALTER FUNCTION public.cleanup_old_rate_limits() SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.log_admin_action(p_action text, p_entity_type text, p_entity_id text, p_details jsonb) SECURITY DEFINER SET search_path = 'public';

-- Community functions (if they exist and don't already have security settings)
DO $$
BEGIN
    -- Only modify functions that exist and don't already have proper security
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_post_like_count' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_post_like_count(post_id_param uuid) SECURITY DEFINER SET search_path = 'public';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_post_comment_count' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_post_comment_count(post_id_param uuid) SECURITY DEFINER SET search_path = 'public';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'user_has_liked_post' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.user_has_liked_post(post_id_param uuid, user_id_param uuid) SECURITY DEFINER SET search_path = 'public';
    END IF;
END $$;

-- 2. Auth configuration fixes
-- These need to be done through Supabase dashboard Settings > Authentication
-- OR you can use the Supabase Management API
-- The auth.config table doesn't exist in standard Supabase installations

-- Note: For OTP expiry and leaked password protection:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Authentication > Settings  
-- 3. Set "Email OTP expiry" to 600 seconds (10 minutes) or less
-- 4. Enable "Leaked Password Protection" if available

-- 3. Vector extension schema warning (OPTIONAL - may break existing functionality)
-- Only run this if you're absolutely sure it won't break vector operations
-- This moves the vector extension to the extensions schema instead of public

-- UNCOMMENT BELOW ONLY IF YOU WANT TO MOVE VECTOR EXTENSION:
-- DO $$
-- BEGIN
--     IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
--         -- First check if extensions schema exists
--         IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'extensions') THEN
--             CREATE SCHEMA extensions;
--         END IF;
--         
--         -- Move the extension (this may break existing vector operations!)
--         ALTER EXTENSION vector SET SCHEMA extensions;
--     END IF;
-- END $$;

-- 4. Verification queries
-- Run these to confirm the fixes were applied:

SELECT 
    routine_name, 
    routine_type,
    security_type,
    routine_definition LIKE '%SET search_path%' as has_search_path_set
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'start_45_day_trial', 'get_trial_status', 'search_wis_content', 
    'search_manual_chunks', 'check_admin_access', 'grant_free_access'
)
ORDER BY routine_name;

-- Check for remaining functions without SECURITY DEFINER
SELECT routine_name, routine_type, security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND security_type = 'INVOKER'  -- Should be 'DEFINER' for secure functions
AND routine_type = 'FUNCTION'
ORDER BY routine_name;