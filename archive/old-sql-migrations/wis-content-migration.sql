-- WIS EPC Content Storage Tables
-- This stores the actual WIS data in Supabase instead of on a VPS

-- Main procedures table
CREATE TABLE IF NOT EXISTS public.wis_procedures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  procedure_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  model TEXT NOT NULL,
  system TEXT NOT NULL,
  subsystem TEXT,
  content TEXT, -- HTML/Markdown content
  steps JSONB, -- Structured steps array
  tools_required TEXT[],
  parts_required TEXT[],
  safety_warnings TEXT[],
  time_estimate INTEGER, -- minutes
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Parts catalog
CREATE TABLE IF NOT EXISTS public.wis_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  part_number TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  models TEXT[], -- Compatible models
  superseded_by TEXT, -- New part number if replaced
  price DECIMAL(10,2),
  availability TEXT,
  specifications JSONB,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Diagrams and images
CREATE TABLE IF NOT EXISTS public.wis_diagrams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('wiring', 'exploded', 'schematic', 'photo')),
  procedure_id UUID REFERENCES public.wis_procedures(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.wis_parts(id) ON DELETE CASCADE,
  file_path TEXT, -- Supabase Storage path
  thumbnail_path TEXT, -- Small preview image
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wiring diagrams (interactive)
CREATE TABLE IF NOT EXISTS public.wis_wiring (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model TEXT NOT NULL,
  system TEXT NOT NULL,
  diagram_name TEXT NOT NULL,
  svg_content TEXT, -- Store as SVG for interactivity
  connections JSONB, -- Structured wiring data
  components JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Technical bulletins
CREATE TABLE IF NOT EXISTS public.wis_bulletins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bulletin_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  models_affected TEXT[],
  issue_date DATE,
  category TEXT,
  content TEXT,
  priority TEXT CHECK (priority IN ('info', 'recommended', 'mandatory', 'safety')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Model specifications
CREATE TABLE IF NOT EXISTS public.wis_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_code TEXT UNIQUE NOT NULL,
  model_name TEXT NOT NULL,
  year_from INTEGER,
  year_to INTEGER,
  engine_options JSONB,
  specifications JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wis_procedures_model ON public.wis_procedures(model);
CREATE INDEX IF NOT EXISTS idx_wis_procedures_system ON public.wis_procedures(system);
CREATE INDEX IF NOT EXISTS idx_wis_parts_models ON public.wis_parts USING GIN(models);
CREATE INDEX IF NOT EXISTS idx_wis_parts_part_number ON public.wis_parts(part_number);
CREATE INDEX IF NOT EXISTS idx_wis_bulletins_models ON public.wis_bulletins USING GIN(models_affected);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_wis_procedures_search 
  ON public.wis_procedures 
  USING GIN(to_tsvector('english', title || ' ' || COALESCE(content, '')));

CREATE INDEX IF NOT EXISTS idx_wis_parts_search 
  ON public.wis_parts 
  USING GIN(to_tsvector('english', description || ' ' || part_number));

-- RLS Policies (all content is public read)
ALTER TABLE public.wis_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wis_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wis_diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wis_wiring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wis_bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wis_models ENABLE ROW LEVEL SECURITY;

-- Anyone can read WIS content
CREATE POLICY "Public read access" ON public.wis_procedures FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.wis_parts FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.wis_diagrams FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.wis_wiring FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.wis_bulletins FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.wis_models FOR SELECT USING (true);

-- Search function
CREATE OR REPLACE FUNCTION search_wis_content(
  search_query TEXT,
  filter_model TEXT DEFAULT NULL,
  filter_system TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content_type TEXT,
  model TEXT,
  system TEXT,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  -- Search procedures
  SELECT 
    p.id,
    p.title,
    'procedure'::TEXT as content_type,
    p.model,
    p.system,
    ts_rank(
      to_tsvector('english', p.title || ' ' || COALESCE(p.content, '')), 
      plainto_tsquery('english', search_query)
    ) as relevance
  FROM public.wis_procedures p
  WHERE 
    to_tsvector('english', p.title || ' ' || COALESCE(p.content, '')) @@ plainto_tsquery('english', search_query)
    AND (filter_model IS NULL OR p.model = filter_model)
    AND (filter_system IS NULL OR p.system = filter_system)
  
  UNION ALL
  
  -- Search parts
  SELECT 
    pt.id,
    pt.description as title,
    'part'::TEXT as content_type,
    NULL as model,
    NULL as system,
    ts_rank(
      to_tsvector('english', pt.description || ' ' || pt.part_number), 
      plainto_tsquery('english', search_query)
    ) as relevance
  FROM public.wis_parts pt
  WHERE 
    to_tsvector('english', pt.description || ' ' || pt.part_number) @@ plainto_tsquery('english', search_query)
    AND (filter_model IS NULL OR filter_model = ANY(pt.models))
  
  ORDER BY relevance DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Track view counts
CREATE OR REPLACE FUNCTION increment_view_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'wis_procedures' THEN
    UPDATE public.wis_procedures 
    SET view_count = view_count + 1 
    WHERE id = NEW.id;
  ELSIF TG_TABLE_NAME = 'wis_parts' THEN
    UPDATE public.wis_parts 
    SET view_count = view_count + 1 
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Get popular content
CREATE OR REPLACE FUNCTION get_popular_wis_content(
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content_type TEXT,
  model TEXT,
  view_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    'procedure'::TEXT as content_type,
    p.model,
    p.view_count
  FROM public.wis_procedures p
  ORDER BY p.view_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;