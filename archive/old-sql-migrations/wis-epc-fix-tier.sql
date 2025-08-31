-- Fix for WIS EPC migration - Add missing tier column

-- 1. First check if user_subscriptions table exists
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_minutes_used INTEGER DEFAULT 0,
  monthly_minutes_limit INTEGER DEFAULT 30,
  priority_level INTEGER DEFAULT 1,
  valid_until TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- 2. Add the tier column if it doesn't exist
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free' 
CHECK (tier IN ('free', 'premium', 'professional'));

-- 3. Ensure all existing rows have a tier value
UPDATE public.user_subscriptions 
SET tier = 'free' 
WHERE tier IS NULL;

-- 4. Enable RLS if not already enabled
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. Create policy if not exists (safe to re-run)
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- 6. Now you can run the rest of the WIS EPC migration
-- The main migration file is at: wis-epc-migration.sql