-- Create community_recommendations table
CREATE TABLE IF NOT EXISTS public.community_recommendations (
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
  category TEXT NOT NULL CHECK (category IN ('repair', 'maintenance', 'modifications', 'tyres', 'adventures', 'general')),
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('supplier', 'service', 'guide', 'tip')),
  tags TEXT[] DEFAULT '{}',
  
  -- Business/Service fields
  business_name TEXT,
  location TEXT,
  contact_info JSONB,
  rating DECIMAL(2,1) CHECK (rating >= 1 AND rating <= 5),
  price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_recommendations_category ON public.community_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_community_recommendations_type ON public.community_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_community_recommendations_author ON public.community_recommendations(author_id);
CREATE INDEX IF NOT EXISTS idx_community_recommendations_published ON public.community_recommendations(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_community_recommendations_featured ON public.community_recommendations(is_featured);

-- Enable RLS
ALTER TABLE public.community_recommendations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view published recommendations" ON public.community_recommendations;
DROP POLICY IF EXISTS "Users can create their own recommendations" ON public.community_recommendations;
DROP POLICY IF EXISTS "Users can update their own recommendations" ON public.community_recommendations;
DROP POLICY IF EXISTS "Users can delete their own recommendations" ON public.community_recommendations;
DROP POLICY IF EXISTS "Admins can do everything" ON public.community_recommendations;

-- Create RLS policies
-- Anyone can read published recommendations
CREATE POLICY "Anyone can view published recommendations" ON public.community_recommendations
  FOR SELECT
  USING (is_published = true);

-- Authenticated users can create recommendations
CREATE POLICY "Users can create their own recommendations" ON public.community_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own recommendations
CREATE POLICY "Users can update their own recommendations" ON public.community_recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Users can delete their own recommendations
CREATE POLICY "Users can delete their own recommendations" ON public.community_recommendations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Admins can do everything
CREATE POLICY "Admins can do everything" ON public.community_recommendations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_community_recommendations_updated_at 
  BEFORE UPDATE ON public.community_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO public.community_recommendations (
  title,
  content,
  excerpt,
  author_id,
  author_name,
  category,
  recommendation_type,
  business_name,
  location,
  rating,
  is_published,
  published_at,
  tags
) VALUES 
(
  'Excellent Unimog Parts Supplier in Sydney',
  'I''ve been dealing with Unimog Parts Australia for over 5 years and they consistently provide excellent service. They stock a wide range of genuine Mercedes-Benz parts as well as quality aftermarket alternatives. Their technical knowledge is outstanding - they''ve helped me diagnose several issues over the phone, saving me time and money. Highly recommended for anyone in the Sydney area.',
  'Reliable parts supplier with excellent technical knowledge and competitive prices.',
  'f91c4216-27cb-4b39-ba52-01dd95765b21',
  'Thabonel',
  'repair',
  'supplier',
  'Unimog Parts Australia',
  'Sydney, NSW, Australia',
  4.5,
  true,
  NOW(),
  ARRAY['parts', 'sydney', 'supplier', 'genuine']
),
(
  'Portal Axle Maintenance Guide',
  'Here''s my step-by-step guide for maintaining your Unimog''s portal axles. Regular maintenance is crucial for longevity. First, check the oil level monthly - it should be at the fill plug level when cold. Change the oil every 20,000km or annually, whichever comes first. Use only the specified gear oil (usually 85W-90 GL5). When changing, always clean the magnetic drain plug thoroughly. Check for any metal particles which could indicate wear. Don''t forget to inspect the breather valves - blocked breathers can cause seal failure.',
  'Complete guide to portal axle maintenance including oil changes and inspection tips.',
  'f91c4216-27cb-4b39-ba52-01dd95765b21',
  'Thabonel',
  'maintenance',
  'guide',
  NULL,
  NULL,
  NULL,
  true,
  NOW(),
  ARRAY['portal-axles', 'maintenance', 'oil-change', 'guide']
),
(
  'Recommended Tyre Shop - Melbourne',
  'For anyone in Melbourne looking for Unimog tyres, I highly recommend Offroad Tyre Centre in Dandenong. They stock Michelin XZL and Continental MPT81 tyres in various sizes. They understand the unique requirements of Unimog tyres and can source hard-to-find sizes. Their prices are competitive and they offer professional fitting with proper torque specifications. They also do tyre repairs and can retread certain sizes.',
  'Melbourne tyre specialist with Unimog experience and good stock availability.',
  'f91c4216-27cb-4b39-ba52-01dd95765b21',
  'Thabonel',
  'tyres',
  'service',
  'Offroad Tyre Centre',
  'Dandenong, VIC, Australia',
  4.0,
  true,
  NOW(),
  ARRAY['tyres', 'melbourne', 'michelin', 'continental']
);

-- Grant necessary permissions
GRANT ALL ON public.community_recommendations TO authenticated;
GRANT SELECT ON public.community_recommendations TO anon;