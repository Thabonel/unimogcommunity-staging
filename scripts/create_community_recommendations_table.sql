-- IMPORTANT: Run this script in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/ydevatqwkoccxhtejdor/sql/new

-- First, check if community_recommendations table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'community_recommendations') THEN
        
        -- Create the community_recommendations table
        CREATE TABLE public.community_recommendations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
            
            -- Content fields
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            excerpt TEXT,
            
            -- Author fields
            author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            author_name TEXT,
            author_avatar TEXT,
            
            -- Categorization
            category TEXT NOT NULL,
            recommendation_type TEXT NOT NULL DEFAULT 'tip',
            tags TEXT[] DEFAULT '{}',
            
            -- Business/Service fields
            business_name TEXT,
            location TEXT,
            contact_info JSONB,
            rating DECIMAL(2,1),
            price_range TEXT,
            
            -- Publishing
            is_published BOOLEAN DEFAULT false,
            published_at TIMESTAMP WITH TIME ZONE,
            
            -- Engagement metrics
            likes_count INTEGER DEFAULT 0,
            views_count INTEGER DEFAULT 0,
            saves_count INTEGER DEFAULT 0,
            
            -- Metadata
            is_featured BOOLEAN DEFAULT false,
            is_verified BOOLEAN DEFAULT false
        );

        RAISE NOTICE 'Table community_recommendations created successfully';
    ELSE
        RAISE NOTICE 'Table community_recommendations already exists';
    END IF;
END $$;

-- Create indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_community_recommendations_category 
    ON public.community_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_community_recommendations_type 
    ON public.community_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_community_recommendations_author 
    ON public.community_recommendations(author_id);
CREATE INDEX IF NOT EXISTS idx_community_recommendations_published 
    ON public.community_recommendations(is_published, published_at);

-- Enable RLS
ALTER TABLE public.community_recommendations ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Anyone can view published recommendations" ON public.community_recommendations;
DROP POLICY IF EXISTS "Users can create their own recommendations" ON public.community_recommendations;
DROP POLICY IF EXISTS "Users can update their own recommendations" ON public.community_recommendations;
DROP POLICY IF EXISTS "Users can delete their own recommendations" ON public.community_recommendations;
DROP POLICY IF EXISTS "Admins can do everything" ON public.community_recommendations;

-- Create RLS policies
CREATE POLICY "Anyone can view published recommendations" 
    ON public.community_recommendations
    FOR SELECT
    USING (is_published = true);

CREATE POLICY "Users can create their own recommendations" 
    ON public.community_recommendations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own recommendations" 
    ON public.community_recommendations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own recommendations" 
    ON public.community_recommendations
    FOR DELETE
    TO authenticated
    USING (auth.uid() = author_id);

-- Admin policy
CREATE POLICY "Admins can do everything" 
    ON public.community_recommendations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON public.community_recommendations TO authenticated;
GRANT SELECT ON public.community_recommendations TO anon;

-- Add update trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_community_recommendations_updated_at ON public.community_recommendations;
CREATE TRIGGER update_community_recommendations_updated_at 
    BEFORE UPDATE ON public.community_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data only if table is empty
INSERT INTO public.community_recommendations (
    title, content, excerpt, author_id, author_name, category, 
    recommendation_type, business_name, location, rating, 
    is_published, published_at, tags
)
SELECT * FROM (VALUES 
    (
        'Excellent Unimog Parts Supplier in Sydney',
        'I''ve been dealing with Unimog Parts Australia for over 5 years and they consistently provide excellent service. They stock a wide range of genuine Mercedes-Benz parts as well as quality aftermarket alternatives. Their technical knowledge is outstanding.',
        'Reliable parts supplier with excellent technical knowledge.',
        'f91c4216-27cb-4b39-ba52-01dd95765b21'::UUID,
        'Thabonel',
        'repair',
        'supplier',
        'Unimog Parts Australia',
        'Sydney, NSW',
        4.5,
        true,
        NOW(),
        ARRAY['parts', 'sydney', 'supplier']
    ),
    (
        'Portal Axle Maintenance Guide',
        'Complete step-by-step guide for maintaining your Unimog''s portal axles. Regular maintenance is crucial for longevity.',
        'Guide to portal axle maintenance.',
        'f91c4216-27cb-4b39-ba52-01dd95765b21'::UUID,
        'Thabonel',
        'maintenance',
        'guide',
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        ARRAY['portal-axles', 'maintenance', 'guide']
    ),
    (
        'Recommended Tyre Shop - Melbourne',
        'Offroad Tyre Centre in Dandenong stocks Michelin XZL and Continental MPT81 tyres. Great service and competitive prices.',
        'Melbourne tyre specialist with Unimog experience.',
        'f91c4216-27cb-4b39-ba52-01dd95765b21'::UUID,
        'Thabonel',
        'tyres',
        'service',
        'Offroad Tyre Centre',
        'Dandenong, VIC',
        4.0,
        true,
        NOW(),
        ARRAY['tyres', 'melbourne']
    )
) AS t(title, content, excerpt, author_id, author_name, category, 
       recommendation_type, business_name, location, rating, 
       is_published, published_at, tags)
WHERE NOT EXISTS (
    SELECT 1 FROM public.community_recommendations LIMIT 1
);

-- Show results
SELECT 'Table created/verified. Row count: ' || COUNT(*) as result 
FROM public.community_recommendations;