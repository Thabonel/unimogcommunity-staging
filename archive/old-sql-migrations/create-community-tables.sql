-- Create community_group_members table
CREATE TABLE IF NOT EXISTS community_group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Create community_group_posts table
CREATE TABLE IF NOT EXISTS community_group_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE community_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_group_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_group_members
-- Anyone can view members of public groups
CREATE POLICY "View public group members" ON community_group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_groups 
            WHERE id = group_id AND is_private = false
        )
    );

-- Members can view members of private groups they belong to
CREATE POLICY "View private group members" ON community_group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_group_members cgm
            WHERE cgm.group_id = community_group_members.group_id 
            AND cgm.user_id = auth.uid()
        )
    );

-- Users can join groups
CREATE POLICY "Join groups" ON community_group_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Users can leave groups (delete their membership)
CREATE POLICY "Leave groups" ON community_group_members
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- Group admins can manage members
CREATE POLICY "Admins manage members" ON community_group_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM community_group_members
            WHERE group_id = community_group_members.group_id 
            AND user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- RLS Policies for community_group_posts
-- Anyone can view posts in public groups
CREATE POLICY "View public group posts" ON community_group_posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_groups 
            WHERE id = group_id AND is_private = false
        )
    );

-- Members can view posts in private groups they belong to
CREATE POLICY "View private group posts" ON community_group_posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_group_members
            WHERE group_id = community_group_posts.group_id 
            AND user_id = auth.uid()
        )
    );

-- Members can create posts in groups they belong to
CREATE POLICY "Create posts" ON community_group_posts
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM community_group_members
            WHERE group_id = community_group_posts.group_id 
            AND user_id = auth.uid()
        )
    );

-- Users can edit their own posts
CREATE POLICY "Edit own posts" ON community_group_posts
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- Users can delete their own posts
CREATE POLICY "Delete own posts" ON community_group_posts
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- Group admins can manage all posts
CREATE POLICY "Admins manage posts" ON community_group_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM community_group_members
            WHERE group_id = community_group_posts.group_id 
            AND user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON community_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON community_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON community_group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_user_id ON community_group_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_created_at ON community_group_posts(created_at DESC);