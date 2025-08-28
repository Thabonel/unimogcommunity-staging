-- Create enum type for recommendation categories
CREATE TYPE recommendation_category AS ENUM ('Repair', 'Maintenance', 'Modifications', 'Tyres', 'Adventures');

-- Create community_recommendations table
CREATE TABLE community_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    supplier_name TEXT NOT NULL,
    category recommendation_category NOT NULL,
    description TEXT,
    location TEXT,
    website_url TEXT,
    author_id UUID REFERENCES profiles (id),
    author_name TEXT,
    author_avatar TEXT,
    rating SMALLINT,
    likes INTEGER DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE community_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies mirroring community_articles permissions

-- Allow anyone to read recommendations
CREATE POLICY "Anyone can read recommendations" ON community_recommendations
    FOR SELECT
    USING (true);

-- Allow authenticated users to create recommendations
CREATE POLICY "Authenticated users can create recommendations" ON community_recommendations
    FOR INSERT
    WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own recommendations
CREATE POLICY "Users can update own recommendations" ON community_recommendations
    FOR UPDATE
    USING (auth.uid() = author_id);

-- Allow users to delete their own recommendations
CREATE POLICY "Users can delete own recommendations" ON community_recommendations
    FOR DELETE
    USING (auth.uid() = author_id);
