-- Script to add missing columns to existing community_recommendations table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ydevatqwkoccxhtejdor/sql/new

-- First, let's check what columns currently exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'community_recommendations'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add recommendation_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'community_recommendations' 
                   AND column_name = 'recommendation_type') THEN
        ALTER TABLE public.community_recommendations 
        ADD COLUMN recommendation_type TEXT DEFAULT 'tip';
        RAISE NOTICE 'Added recommendation_type column';
    END IF;

    -- Add business_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'community_recommendations' 
                   AND column_name = 'business_name') THEN
        ALTER TABLE public.community_recommendations 
        ADD COLUMN business_name TEXT;
        RAISE NOTICE 'Added business_name column';
    END IF;

    -- Add location column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'community_recommendations' 
                   AND column_name = 'location') THEN
        ALTER TABLE public.community_recommendations 
        ADD COLUMN location TEXT;
        RAISE NOTICE 'Added location column';
    END IF;

    -- Add contact_info column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'community_recommendations' 
                   AND column_name = 'contact_info') THEN
        ALTER TABLE public.community_recommendations 
        ADD COLUMN contact_info JSONB;
        RAISE NOTICE 'Added contact_info column';
    END IF;

    -- Add rating column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'community_recommendations' 
                   AND column_name = 'rating') THEN
        ALTER TABLE public.community_recommendations 
        ADD COLUMN rating DECIMAL(2,1);
        RAISE NOTICE 'Added rating column';
    END IF;

    -- Add price_range column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'community_recommendations' 
                   AND column_name = 'price_range') THEN
        ALTER TABLE public.community_recommendations 
        ADD COLUMN price_range TEXT;
        RAISE NOTICE 'Added price_range column';
    END IF;

    -- Add engagement metrics columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'community_recommendations' 
                   AND column_name = 'likes_count') THEN
        ALTER TABLE public.community_recommendations 
        ADD COLUMN likes_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added likes_count column';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'community_recommendations' 
                   AND column_name = 'views_count') THEN
        ALTER TABLE public.community_recommendations 
        ADD COLUMN views_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added views_count column';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'community_recommendations' 
                   AND column_name = 'saves_count') THEN
        ALTER TABLE public.community_recommendations 
        ADD COLUMN saves_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added saves_count column';
    END IF;

    -- Add metadata columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'community_recommendations' 
                   AND column_name = 'is_featured') THEN
        ALTER TABLE public.community_recommendations 
        ADD COLUMN is_featured BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_featured column';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'community_recommendations' 
                   AND column_name = 'is_verified') THEN
        ALTER TABLE public.community_recommendations 
        ADD COLUMN is_verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_verified column';
    END IF;

    -- Add author columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'community_recommendations' 
                   AND column_name = 'author_name') THEN
        ALTER TABLE public.community_recommendations 
        ADD COLUMN author_name TEXT;
        RAISE NOTICE 'Added author_name column';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'community_recommendations' 
                   AND column_name = 'author_avatar') THEN
        ALTER TABLE public.community_recommendations 
        ADD COLUMN author_avatar TEXT;
        RAISE NOTICE 'Added author_avatar column';
    END IF;

    -- Add excerpt column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'community_recommendations' 
                   AND column_name = 'excerpt') THEN
        ALTER TABLE public.community_recommendations 
        ADD COLUMN excerpt TEXT;
        RAISE NOTICE 'Added excerpt column';
    END IF;

    -- Add tags column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'community_recommendations' 
                   AND column_name = 'tags') THEN
        ALTER TABLE public.community_recommendations 
        ADD COLUMN tags TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added tags column';
    END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_community_recommendations_type 
    ON public.community_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_community_recommendations_featured 
    ON public.community_recommendations(is_featured);
CREATE INDEX IF NOT EXISTS idx_community_recommendations_verified 
    ON public.community_recommendations(is_verified);

-- Check the final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'community_recommendations'
ORDER BY ordinal_position;

-- Insert sample data if table is empty
INSERT INTO public.community_recommendations (
    title, content, category, author_id, 
    recommendation_type, business_name, location, rating, 
    is_published, published_at, tags, author_name, excerpt
)
SELECT * FROM (VALUES 
    (
        'Excellent Unimog Parts Supplier in Sydney',
        'I''ve been dealing with Unimog Parts Australia for over 5 years and they consistently provide excellent service.',
        'repair',
        'f91c4216-27cb-4b39-ba52-01dd95765b21'::UUID,
        'supplier',
        'Unimog Parts Australia',
        'Sydney, NSW',
        4.5,
        true,
        NOW(),
        ARRAY['parts', 'sydney', 'supplier'],
        'Thabonel',
        'Reliable parts supplier with excellent service.'
    ),
    (
        'Portal Axle Maintenance Guide',
        'Complete guide for maintaining your Unimog portal axles. Regular maintenance is crucial.',
        'maintenance',
        'f91c4216-27cb-4b39-ba52-01dd95765b21'::UUID,
        'guide',
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        ARRAY['portal-axles', 'maintenance'],
        'Thabonel',
        'Step-by-step portal axle maintenance.'
    )
) AS t(title, content, category, author_id, recommendation_type, 
       business_name, location, rating, is_published, published_at, 
       tags, author_name, excerpt)
WHERE NOT EXISTS (
    SELECT 1 FROM public.community_recommendations LIMIT 1
);

-- Final check
SELECT COUNT(*) as total_recommendations FROM public.community_recommendations;