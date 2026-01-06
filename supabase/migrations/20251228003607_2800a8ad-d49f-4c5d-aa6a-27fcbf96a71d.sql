-- Add a custom link_url field to highlights table
ALTER TABLE public.highlights 
ADD COLUMN link_url text;