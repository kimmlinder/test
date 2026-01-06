-- Create highlights table
CREATE TABLE public.highlights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  image_url text,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  display_order integer DEFAULT 0,
  published boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view published highlights"
ON public.highlights
FOR SELECT
USING (published = true);

CREATE POLICY "Admins can view all highlights"
ON public.highlights
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create highlights"
ON public.highlights
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update highlights"
ON public.highlights
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete highlights"
ON public.highlights
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_highlights_updated_at
BEFORE UPDATE ON public.highlights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for highlight images
INSERT INTO storage.buckets (id, name, public)
VALUES ('highlight-images', 'highlight-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for highlight images
CREATE POLICY "Anyone can view highlight images"
ON storage.objects FOR SELECT
USING (bucket_id = 'highlight-images');

CREATE POLICY "Admins can upload highlight images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'highlight-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update highlight images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'highlight-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete highlight images"
ON storage.objects FOR DELETE
USING (bucket_id = 'highlight-images' AND has_role(auth.uid(), 'admin'));