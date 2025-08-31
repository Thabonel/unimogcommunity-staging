-- Create WIS EPC session management tables
-- This handles multi-user access to Mercedes WIS EPC VMs

-- VM servers table - tracks available WIS EPC servers
CREATE TABLE IF NOT EXISTS public.wis_servers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  host_url TEXT NOT NULL,
  guacamole_url TEXT NOT NULL,
  max_concurrent_sessions INTEGER DEFAULT 5,
  current_sessions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'offline')),
  specs JSONB DEFAULT '{}', -- Server specifications
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- WIS EPC sessions table - tracks active user sessions
CREATE TABLE IF NOT EXISTS public.wis_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  server_id UUID NOT NULL REFERENCES public.wis_servers(id) ON DELETE CASCADE,
  guacamole_token TEXT,
  session_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'expired', 'error')),
  queue_position INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}', -- Session-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User bookmarks for WIS procedures
CREATE TABLE IF NOT EXISTS public.wis_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  procedure_path TEXT, -- Path within WIS EPC system
  screenshot_url TEXT, -- Optional screenshot stored in Supabase Storage
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User session history and usage tracking
CREATE TABLE IF NOT EXISTS public.wis_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.wis_sessions(id) ON DELETE SET NULL,
  server_id UUID REFERENCES public.wis_servers(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'session_start', 'session_end', 'bookmark_created', etc.
  duration_minutes INTEGER,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User subscription tiers for WIS EPC access
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'professional')),
  monthly_minutes_used INTEGER DEFAULT 0,
  monthly_minutes_limit INTEGER DEFAULT 30, -- Free tier gets 30 minutes
  priority_level INTEGER DEFAULT 1, -- Higher number = higher priority in queue
  valid_until TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Indexes for better performance
CREATE INDEX idx_wis_sessions_user_id ON public.wis_sessions(user_id);
CREATE INDEX idx_wis_sessions_server_id ON public.wis_sessions(server_id);
CREATE INDEX idx_wis_sessions_status ON public.wis_sessions(status);
CREATE INDEX idx_wis_sessions_expires_at ON public.wis_sessions(expires_at);
CREATE INDEX idx_wis_bookmarks_user_id ON public.wis_bookmarks(user_id);
CREATE INDEX idx_wis_usage_logs_user_id ON public.wis_usage_logs(user_id);
CREATE INDEX idx_wis_usage_logs_created_at ON public.wis_usage_logs(created_at);
CREATE INDEX idx_user_subscriptions_tier ON public.user_subscriptions(tier);

-- RLS (Row Level Security) policies

-- WIS Servers - Public read access for status checking
ALTER TABLE public.wis_servers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active WIS servers" ON public.wis_servers
  FOR SELECT USING (status = 'active');

-- WIS Sessions - Users can only see their own sessions
ALTER TABLE public.wis_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own WIS sessions" ON public.wis_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own WIS sessions" ON public.wis_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own WIS sessions" ON public.wis_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- WIS Bookmarks - Users can manage their own bookmarks
ALTER TABLE public.wis_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookmarks" ON public.wis_bookmarks
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can insert own bookmarks" ON public.wis_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookmarks" ON public.wis_bookmarks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON public.wis_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Usage logs - Users can view their own usage
ALTER TABLE public.wis_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage logs" ON public.wis_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- User subscriptions - Users can view their own subscription
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Functions for session management

-- Function to get user's subscription tier and limits
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE (
  tier TEXT,
  monthly_minutes_used INTEGER,
  monthly_minutes_limit INTEGER,
  priority_level INTEGER,
  can_access BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(s.tier, 'free'),
    COALESCE(s.monthly_minutes_used, 0),
    COALESCE(s.monthly_minutes_limit, 30),
    COALESCE(s.priority_level, 1),
    CASE 
      WHEN COALESCE(s.tier, 'free') = 'free' THEN 
        COALESCE(s.monthly_minutes_used, 0) < COALESCE(s.monthly_minutes_limit, 30)
      ELSE TRUE 
    END as can_access
  FROM public.user_subscriptions s
  WHERE s.user_id = user_uuid
  UNION ALL
  SELECT 'free', 0, 30, 1, TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_subscriptions WHERE user_id = user_uuid
  )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check server availability
CREATE OR REPLACE FUNCTION get_available_server()
RETURNS TABLE (
  server_id UUID,
  server_name TEXT,
  guacamole_url TEXT,
  current_load NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.guacamole_url,
    (s.current_sessions::NUMERIC / s.max_concurrent_sessions::NUMERIC) as load_ratio
  FROM public.wis_servers s
  WHERE s.status = 'active' 
    AND s.current_sessions < s.max_concurrent_sessions
  ORDER BY (s.current_sessions::NUMERIC / s.max_concurrent_sessions::NUMERIC) ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  -- Mark expired sessions as completed
  UPDATE public.wis_sessions 
  SET status = 'expired'
  WHERE status = 'active' 
    AND expires_at < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  -- Update server session counts
  UPDATE public.wis_servers 
  SET current_sessions = (
    SELECT COUNT(*) 
    FROM public.wis_sessions 
    WHERE server_id = wis_servers.id 
      AND status = 'active'
  );
  
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial server configuration (update with your actual server details)
INSERT INTO public.wis_servers (name, host_url, guacamole_url, max_concurrent_sessions) 
VALUES (
  'WIS-EPC-Server-01',
  'https://your-vps-server.com',
  'https://your-vps-server.com/guacamole',
  5
) ON CONFLICT DO NOTHING;