-- No-Credit-Card 45-Day Trial System
-- Designed for trust-sensitive 55+ Unimog community

-- Add trial tracking columns to profiles if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'trial', 'premium', 'lifetime')),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS trial_reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_nudge_shown_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_converted BOOLEAN DEFAULT false;

-- Create download logs table for guardrails
CREATE TABLE IF NOT EXISTS download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resource TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Create active sessions table for device tracking
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  device_id TEXT,
  device_type TEXT,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trial events table for analytics
CREATE TABLE IF NOT EXISTS trial_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create nudge history table
CREATE TABLE IF NOT EXISTS nudge_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nudge_type TEXT NOT NULL,
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT false,
  converted BOOLEAN DEFAULT false,
  days_into_trial INTEGER
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_download_logs_user_date ON download_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON active_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_trial_events_user ON trial_events(user_id);
CREATE INDEX IF NOT EXISTS idx_nudge_history_user ON nudge_history(user_id);

-- Function to start a free trial
CREATE OR REPLACE FUNCTION start_free_trial(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_profile RECORD;
  v_trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user exists and get current status
  SELECT * INTO v_profile 
  FROM profiles 
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User profile not found'
    );
  END IF;
  
  -- Check if already had trial
  IF v_profile.trial_started_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'You have already used your free trial'
    );
  END IF;
  
  -- Check if already premium
  IF v_profile.subscription_tier IN ('premium', 'lifetime') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'You already have an active subscription'
    );
  END IF;
  
  -- Calculate trial end date (45 days from now)
  v_trial_end := NOW() + INTERVAL '45 days';
  
  -- Start the trial
  UPDATE profiles
  SET 
    trial_started_at = NOW(),
    trial_ends_at = v_trial_end,
    subscription_tier = 'trial',
    trial_reminder_sent = false
  WHERE id = p_user_id;
  
  -- Log trial start event
  INSERT INTO trial_events (user_id, event, metadata)
  VALUES (
    p_user_id, 
    'trial_started',
    jsonb_build_object(
      'duration_days', 45,
      'end_date', v_trial_end
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Your 45-day free trial has started!',
    'trial_ends_at', v_trial_end
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check trial status
CREATE OR REPLACE FUNCTION check_trial_status(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_profile RECORD;
  v_days_remaining INTEGER;
  v_days_elapsed INTEGER;
  v_is_expired BOOLEAN;
BEGIN
  SELECT * INTO v_profile 
  FROM profiles 
  WHERE id = p_user_id;
  
  IF NOT FOUND OR v_profile.trial_started_at IS NULL THEN
    RETURN jsonb_build_object(
      'has_trial', false,
      'can_start_trial', true
    );
  END IF;
  
  v_days_remaining := GREATEST(0, EXTRACT(DAY FROM v_profile.trial_ends_at - NOW())::INTEGER);
  v_days_elapsed := EXTRACT(DAY FROM NOW() - v_profile.trial_started_at)::INTEGER;
  v_is_expired := NOW() > v_profile.trial_ends_at;
  
  RETURN jsonb_build_object(
    'has_trial', true,
    'is_active', NOT v_is_expired AND v_profile.subscription_tier = 'trial',
    'days_remaining', v_days_remaining,
    'days_elapsed', v_days_elapsed,
    'trial_started_at', v_profile.trial_started_at,
    'trial_ends_at', v_profile.trial_ends_at,
    'is_expired', v_is_expired,
    'subscription_tier', v_profile.subscription_tier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check download guardrails
CREATE OR REPLACE FUNCTION check_download_limit(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_download_count INTEGER;
  v_max_downloads INTEGER := 10; -- Daily limit for trial users
  v_subscription_tier TEXT;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO v_subscription_tier
  FROM profiles
  WHERE id = p_user_id;
  
  -- Premium users have no limits
  IF v_subscription_tier IN ('premium', 'lifetime') THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'limit', 0,
      'used', 0,
      'unlimited', true
    );
  END IF;
  
  -- Count today's downloads
  SELECT COUNT(*) INTO v_download_count
  FROM download_logs
  WHERE user_id = p_user_id
  AND created_at >= CURRENT_DATE;
  
  RETURN jsonb_build_object(
    'allowed', v_download_count < v_max_downloads,
    'limit', v_max_downloads,
    'used', v_download_count,
    'unlimited', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a download
CREATE OR REPLACE FUNCTION record_download(
  p_user_id UUID,
  p_resource TEXT,
  p_file_type TEXT DEFAULT NULL,
  p_file_size BIGINT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_check JSONB;
BEGIN
  -- Check if download is allowed
  v_check := check_download_limit(p_user_id);
  
  IF NOT (v_check->>'allowed')::BOOLEAN THEN
    RAISE EXCEPTION 'Daily download limit reached';
  END IF;
  
  -- Record the download
  INSERT INTO download_logs (user_id, resource, file_type, file_size)
  VALUES (p_user_id, p_resource, p_file_type, p_file_size);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check active devices
CREATE OR REPLACE FUNCTION check_device_limit(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_device_count INTEGER;
  v_max_devices INTEGER := 2; -- Limit for trial users
  v_subscription_tier TEXT;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO v_subscription_tier
  FROM profiles
  WHERE id = p_user_id;
  
  -- Premium users have higher limits
  IF v_subscription_tier IN ('premium', 'lifetime') THEN
    v_max_devices := 5;
  END IF;
  
  -- Count active devices (active in last 30 minutes)
  SELECT COUNT(DISTINCT device_id) INTO v_device_count
  FROM active_sessions
  WHERE user_id = p_user_id
  AND last_activity > NOW() - INTERVAL '30 minutes';
  
  RETURN jsonb_build_object(
    'allowed', v_device_count < v_max_devices,
    'limit', v_max_devices,
    'used', v_device_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own download logs"
  ON download_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions"
  ON active_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trial events"
  ON trial_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own nudge history"
  ON nudge_history FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert
CREATE POLICY "Service role can insert download logs"
  ON download_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can manage sessions"
  ON active_sessions FOR ALL
  USING (true);

CREATE POLICY "Service role can insert trial events"
  ON trial_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can manage nudge history"
  ON nudge_history FOR ALL
  USING (true);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION start_free_trial TO authenticated;
GRANT EXECUTE ON FUNCTION check_trial_status TO authenticated;
GRANT EXECUTE ON FUNCTION check_download_limit TO authenticated;
GRANT EXECUTE ON FUNCTION record_download TO authenticated;
GRANT EXECUTE ON FUNCTION check_device_limit TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION start_free_trial IS 'Starts a 45-day free trial without requiring credit card. Designed for trust-sensitive 55+ Unimog community.';
COMMENT ON TABLE download_logs IS 'Tracks downloads to enforce guardrails during trial period';
COMMENT ON TABLE active_sessions IS 'Tracks active devices to enforce concurrent device limits';
COMMENT ON TABLE trial_events IS 'Analytics for trial conversion optimization';
COMMENT ON TABLE nudge_history IS 'Tracks when and which nudges were shown to optimize conversion';