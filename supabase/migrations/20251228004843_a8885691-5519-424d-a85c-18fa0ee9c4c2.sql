-- Add playground display fields to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS show_in_playground boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS playground_align text DEFAULT 'center',
ADD COLUMN IF NOT EXISTS playground_scale text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS playground_order integer DEFAULT 0;