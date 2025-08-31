-- Verify WIS EPC tables and add development server

-- 1. Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wis_servers', 'wis_sessions', 'wis_bookmarks', 'wis_usage_logs', 'user_subscriptions');

-- 2. Add a development server for testing
INSERT INTO wis_servers (
  name, 
  host_url, 
  guacamole_url, 
  max_concurrent_sessions, 
  status,
  specs
) VALUES (
  'WIS EPC Development Server',
  'localhost:3389',
  'http://localhost:8080/guacamole',
  5,
  'maintenance',
  '{"note": "Update with actual server details when ready", "environment": "development"}'::jsonb
) ON CONFLICT DO NOTHING;

-- 3. Verify the server was added
SELECT * FROM wis_servers;

-- 4. Test the get_available_server function
SELECT * FROM get_available_server();

-- 5. Test the get_user_subscription function (replace with an actual user ID if you have one)
-- SELECT * FROM get_user_subscription('your-user-id-here'::uuid);