-- Supabase Security Fixes
-- Run these commands in the Supabase SQL Editor to fix all security warnings

-- 1. Fix function search_path warnings by adding SECURITY DEFINER and SET search_path
ALTER FUNCTION public.start_free_trial(uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.check_trial_status(uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.check_download_limit(uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.check_admin_access() SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.has_role(text) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.grant_free_access(uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.search_wis_content(text, integer, integer) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.search_manual_chunks(text, integer, integer) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.get_popular_wis_content(integer) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.get_wis_content_by_category(text, integer, integer) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.get_related_wis_content(uuid, integer) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.increment_wis_view_count(uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.get_user_wis_bookmarks(uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.toggle_wis_bookmark(uuid, uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.get_wis_usage_stats(uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.log_wis_session(uuid, text, text, text) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.end_wis_session(uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.get_active_wis_sessions(uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.cleanup_expired_sessions() SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.get_user_subscription_status(uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.create_user_subscription(uuid, text, text, timestamp with time zone) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.update_subscription_status(uuid, text) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.cancel_user_subscription(uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.get_subscription_analytics() SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.create_social_post(text, text, text[], uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.get_social_posts(integer, integer) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.toggle_post_like(uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.add_post_comment(uuid, text) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.get_post_comments(uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.follow_user(uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.unfollow_user(uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.get_user_followers(uuid) SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.get_user_following(uuid) SECURITY DEFINER SET search_path = 'public';

-- 2. Fix auth configuration
-- Reduce OTP expiry from >1 hour to <1 hour (set to 10 minutes)
UPDATE auth.config 
SET otp_expiry = 600 
WHERE key = 'otp_expiry';

-- Enable leaked password protection
UPDATE auth.config 
SET leaked_password_protection = true 
WHERE key = 'leaked_password_protection';

-- If the config entries don't exist, insert them
INSERT INTO auth.config (key, value) 
VALUES ('otp_expiry', '600') 
ON CONFLICT (key) DO UPDATE SET value = '600';

INSERT INTO auth.config (key, value) 
VALUES ('leaked_password_protection', 'true') 
ON CONFLICT (key) DO UPDATE SET value = 'true';

-- 3. Move vector extension from public schema (OPTIONAL - may break existing functionality)
-- Only run this if you're sure it won't break existing vector operations
-- DROP EXTENSION IF EXISTS vector CASCADE;
-- CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Verification queries to run after applying fixes:
-- SELECT routine_name, routine_type, security_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('start_free_trial', 'check_trial_status', 'check_admin_access');

-- SELECT * FROM auth.config WHERE key IN ('otp_expiry', 'leaked_password_protection');