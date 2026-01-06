-- Create homepage settings table for hero media and featured projects
CREATE TABLE public.homepage_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hero_media_type TEXT NOT NULL DEFAULT 'images' CHECK (hero_media_type IN ('images', 'video')),
  hero_video_url TEXT,
  hero_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  featured_project_ids UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.homepage_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read homepage settings (public content)
CREATE POLICY "Homepage settings are viewable by everyone" 
ON public.homepage_settings 
FOR SELECT 
USING (true);

-- Only admins can modify homepage settings
CREATE POLICY "Admins can manage homepage settings" 
ON public.homepage_settings 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_homepage_settings_updated_at
BEFORE UPDATE ON public.homepage_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings row
INSERT INTO public.homepage_settings (hero_media_type, hero_images, featured_project_ids)
VALUES ('images', ARRAY[]::TEXT[], ARRAY[]::UUID[]);