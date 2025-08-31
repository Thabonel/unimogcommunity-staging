-- Make yourself admin in UnimogCommunityHub
-- Run this in your Supabase SQL Editor

-- First, ensure the user_roles table exists
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS if not already enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles table (if they don't exist)
DO $$ 
BEGIN
  -- Policy: Users can view their own roles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' AND policyname = 'Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles" ON user_roles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Policy: Admins can view all roles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' AND policyname = 'Admins can view all roles'
  ) THEN
    CREATE POLICY "Admins can view all roles" ON user_roles
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() 
          AND ur.role = 'admin'
        )
      );
  END IF;

  -- Policy: Admins can insert roles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' AND policyname = 'Admins can insert roles'
  ) THEN
    CREATE POLICY "Admins can insert roles" ON user_roles
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() 
          AND ur.role = 'admin'
        )
      );
  END IF;

  -- Policy: Admins can update roles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' AND policyname = 'Admins can update roles'
  ) THEN
    CREATE POLICY "Admins can update roles" ON user_roles
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() 
          AND ur.role = 'admin'
        )
      );
  END IF;

  -- Policy: Admins can delete roles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' AND policyname = 'Admins can delete roles'
  ) THEN
    CREATE POLICY "Admins can delete roles" ON user_roles
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() 
          AND ur.role = 'admin'
        )
      );
  END IF;
END $$;

-- Create the has_role function if it doesn't exist
CREATE OR REPLACE FUNCTION has_role(_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = _role
  );
END;
$$;

-- TODO: REPLACE 'your-email@example.com' with your actual email address!
-- Make yourself admin (replace the email address below)
DO $$
DECLARE
  user_id_var UUID;
  target_email TEXT := 'your-email@example.com';  -- CHANGE THIS TO YOUR EMAIL!
BEGIN
  -- Get your user ID based on email
  SELECT id INTO user_id_var 
  FROM auth.users 
  WHERE email = target_email
  LIMIT 1;
  
  IF user_id_var IS NOT NULL THEN
    -- Insert admin role (ON CONFLICT DO NOTHING prevents duplicates)
    INSERT INTO user_roles (user_id, role)
    VALUES (user_id_var, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role granted to user: % (email: %)', user_id_var, target_email;
    
    -- Show current admin users
    RAISE NOTICE 'Current admin users:';
    FOR user_id_var IN 
      SELECT ur.user_id 
      FROM user_roles ur 
      JOIN auth.users u ON ur.user_id = u.id 
      WHERE ur.role = 'admin'
    LOOP
      RAISE NOTICE '  User ID: %', user_id_var;
    END LOOP;
    
  ELSE
    RAISE NOTICE 'User not found with email: %', target_email;
    RAISE NOTICE 'Available users:';
    FOR user_id_var IN 
      SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 5
    LOOP
      SELECT email INTO target_email FROM auth.users WHERE id = user_id_var;
      RAISE NOTICE '  % (ID: %)', target_email, user_id_var;
    END LOOP;
  END IF;
END $$;

-- Verify the setup
SELECT 
  u.email,
  ur.role,
  ur.created_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'admin'
ORDER BY ur.created_at DESC;