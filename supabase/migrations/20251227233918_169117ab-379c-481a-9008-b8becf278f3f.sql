-- Add gallery display type column to projects
ALTER TABLE public.projects 
ADD COLUMN gallery_display_type TEXT DEFAULT 'stacked' CHECK (gallery_display_type IN ('stacked', 'carousel'));