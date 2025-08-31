-- Add WIS EPC Development Server
-- Run this in Supabase SQL Editor

-- First, check if any servers exist
SELECT * FROM wis_servers;

-- Add development server
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
  '{
    "note": "Update with actual server details when ready",
    "environment": "development",
    "instructions": "Follow docs/WIS-EPC-DEPLOYMENT-GUIDE.md to set up"
  }'::jsonb
);

-- Verify it was added
SELECT * FROM wis_servers;

-- When you're ready to go live, update the server:
/*
UPDATE wis_servers 
SET 
  host_url = 'your-server-ip:3389',
  guacamole_url = 'http://your-server-ip:8080/guacamole',
  status = 'active',
  specs = jsonb_set(specs, '{environment}', '"production"')
WHERE name = 'WIS EPC Development Server';
*/