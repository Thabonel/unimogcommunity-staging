# Supabase Backend Context

## Database Architecture
- **Type**: PostgreSQL with Row Level Security (RLS)
- **Client**: Supabase JavaScript client
- **Auth**: Supabase Auth with JWT tokens
- **Storage**: Supabase Storage for file uploads
- **Functions**: Edge Functions (Deno runtime)

## Folder Structure
```
supabase/
├── migrations/           # Database schema migrations
├── functions/           # Edge Functions (Deno)
├── config.toml         # Supabase configuration
└── seed.sql            # Initial data seeding
```

## Database Schema Overview

### Core Tables
- **`profiles`**: User profiles and preferences
- **`vehicles`**: User vehicle registry  
- **`marketplace_listings`**: Items for sale
- **`messages`**: User communications
- **`manual_chunks`**: Processed manual content (for Barry AI)
- **`gpx_tracks`**: GPS track data
- **`gpx_waypoints`**: Points of interest

### Authentication Tables (managed by Supabase)
- **`auth.users`**: User accounts
- **`auth.sessions`**: Active sessions
- **`user_roles`**: Custom role assignments

### WIS-EPC System Tables
- **`wis_servers`**: Server configurations
- **`wis_sessions`**: Active user sessions
- **`wis_bookmarks`**: Saved procedures
- **`wis_usage_logs`**: Usage tracking
- **`user_subscriptions`**: Tier management

### Community Tables
- **`community_posts`**: User posts and content
- **`post_comments`**: Comments on posts
- **`post_likes`**: Like/reaction tracking
- **`user_connections`**: Following relationships

## Security Model

### Row Level Security (RLS)
**Every table MUST have RLS enabled:**
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Example policy
CREATE POLICY "Users can read own data" ON profiles
  FOR SELECT USING (auth.uid() = id);
```

### Function Security
**All functions MUST use SECURITY DEFINER:**
```sql
CREATE OR REPLACE FUNCTION function_name()
RETURNS type
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Function implementation
END;
$$;
```

### Admin Functions
**Admin access pattern:**
```sql
CREATE OR REPLACE FUNCTION check_admin_access()
RETURNS BOOLEAN
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;
```

## Migration Guidelines

### Migration Naming
```
YYYYMMDD_descriptive_name.sql
20250903_add_security_functions.sql
```

### Migration Structure
```sql
-- Migration: Add trip planning tables
-- Date: 2025-03-15
-- Purpose: Enable trip planning functionality

BEGIN;

-- Create table with proper constraints
CREATE TABLE IF NOT EXISTS trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own trips" ON trips
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_created_at ON trips(created_at);

-- Create trigger for updated_at
CREATE TRIGGER trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

### Pre-Migration Checklist
- [ ] Check if tables/columns already exist
- [ ] Plan rollback strategy
- [ ] Test on staging first
- [ ] Backup critical data
- [ ] Update documentation

## Edge Functions

### Function Structure
```typescript
// Deno Edge Function pattern
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Function logic here
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### Common Edge Functions
- **`process-gpx`**: Process uploaded GPX files
- **`fetch-rss-feeds`**: Aggregate content from RSS feeds
- **`barry-chat`**: Handle Barry AI conversations
- **`wis-session-manager`**: Manage WIS-EPC sessions

## Client Configuration

### Supabase Client Setup
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

### Error Handling Pattern
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', user.id);

if (error) {
  console.error('Database error:', error);
  throw new Error('Failed to fetch data');
}

return data;
```

## Authentication Patterns

### Auth State Management
```typescript
// Check current user
const { data: { user } } = await supabase.auth.getUser();

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Handle sign in
  }
  if (event === 'SIGNED_OUT') {
    // Handle sign out
  }
});
```

### RLS Policy Patterns
```sql
-- Owner access pattern
CREATE POLICY "Users manage own records" ON table_name
  FOR ALL USING (auth.uid() = user_id);

-- Public read pattern  
CREATE POLICY "Public read access" ON table_name
  FOR SELECT USING (is_public = true);

-- Admin access pattern
CREATE POLICY "Admin full access" ON table_name
  FOR ALL USING (check_admin_access());
```

## Storage Configuration

### Bucket Structure
- **`avatars`**: User profile images
- **`vehicles`**: Vehicle photos
- **`manuals`**: PDF manual files
- **`gpx-files`**: GPS track files
- **`marketplace`**: Listing photos

### Storage Policies
```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Performance Optimization

### Indexing Strategy
```sql
-- Composite indexes for common queries
CREATE INDEX idx_table_user_created ON table_name(user_id, created_at DESC);

-- Partial indexes for filtered queries
CREATE INDEX idx_table_active ON table_name(user_id) WHERE active = true;

-- Text search indexes
CREATE INDEX idx_table_search ON table_name USING gin(to_tsvector('english', content));
```

### Query Optimization
- **Use select()**: Specify columns to reduce payload
- **Add limits**: Prevent large result sets
- **Use filters**: Apply WHERE conditions server-side
- **Implement pagination**: Use range() for large datasets

## Development Workflow

### Local Development
```bash
# Start local Supabase
supabase start

# Create new migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Reset database
supabase db reset
```

### Database Tools
- **Supabase Dashboard**: Visual database management
- **SQL Editor**: Run queries and migrations
- **Table Editor**: Visual table management
- **Function Editor**: Edge function development

## Monitoring & Maintenance

### Health Checks
- **Connection status**: Monitor client connections
- **Query performance**: Track slow queries  
- **Error rates**: Monitor function failures
- **Storage usage**: Track storage consumption

### Backup Strategy
- **Automated**: Supabase handles automated backups
- **Manual**: Export critical data before major changes
- **Point-in-time**: Available for paid plans
- **Migration rollback**: Plan rollback procedures

## Security Best Practices

### Function Security
- **Use SECURITY DEFINER**: Run with owner privileges
- **Set search_path**: Prevent schema manipulation
- **Validate inputs**: Check all parameters
- **Audit logging**: Log admin actions

### Access Control
- **Principle of least privilege**: Minimum required permissions
- **Regular reviews**: Audit user roles and permissions
- **Session management**: Proper session lifecycle
- **API key rotation**: Regular key rotation

---

*This file provides comprehensive context for Supabase backend operations, database management, and security practices.*