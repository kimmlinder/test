-- Create agency_settings table (single row for all settings)
CREATE TABLE public.agency_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Hero section
  hero_subtitle TEXT DEFAULT 'Who We Are',
  hero_title TEXT DEFAULT 'about',
  hero_tagline TEXT DEFAULT 'Creative agency bringing brands to life',
  hero_tagline_accent TEXT DEFAULT 'through innovation and storytelling',
  established_year TEXT DEFAULT '2025',
  -- Story section
  story_title TEXT DEFAULT 'Our Story',
  story_content TEXT DEFAULT 'Founded in 2025, PixenCy was born from a passion for creating meaningful digital experiences. We started as a small team of creatives with a shared vision: to help brands tell their stories in the most compelling way possible.

Today, we''ve grown into a full-service creative agency, offering everything from brand strategy and identity design to video production and web development. Our team brings together diverse talents and perspectives, united by our commitment to excellence.

We believe that great design has the power to transform businesses, inspire audiences, and create lasting connections. That''s why we approach every project with curiosity, creativity, and care.',
  story_image_url TEXT,
  -- Agency description
  agency_description TEXT DEFAULT 'We are a creative agency based in Larnaca, Cyprus, dedicated to bringing brands to life through innovative design, compelling storytelling, and strategic thinking.',
  -- Stats (JSON array)
  stats JSONB DEFAULT '[{"number": "50+", "label": "Projects Completed"}, {"number": "30+", "label": "Happy Clients"}, {"number": "5", "label": "Years Experience"}, {"number": "10+", "label": "Team Members"}]'::jsonb,
  -- Values (JSON array)
  values JSONB DEFAULT '[{"icon": "Users", "title": "Collaboration", "description": "We believe the best work comes from true partnership with our clients."}, {"icon": "Award", "title": "Excellence", "description": "We strive for perfection in every pixel, every frame, every detail."}, {"icon": "Globe", "title": "Innovation", "description": "We push boundaries and embrace new technologies and techniques."}, {"icon": "Heart", "title": "Passion", "description": "We love what we do, and it shows in every project we deliver."}]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view agency settings (public content)
CREATE POLICY "Anyone can view agency settings"
ON public.agency_settings
FOR SELECT
USING (true);

-- Admins can update agency settings
CREATE POLICY "Admins can update agency settings"
ON public.agency_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert agency settings (for initial setup)
CREATE POLICY "Admins can insert agency settings"
ON public.agency_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_agency_settings_updated_at
BEFORE UPDATE ON public.agency_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings row
INSERT INTO public.agency_settings (id) VALUES (gen_random_uuid());