-- Add team section title to agency_settings
ALTER TABLE public.agency_settings 
ADD COLUMN team_section_title TEXT DEFAULT 'Meet the Team';