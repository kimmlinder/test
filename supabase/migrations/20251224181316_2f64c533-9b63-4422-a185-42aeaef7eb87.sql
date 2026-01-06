-- Add preview_url column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS preview_url text;

-- Create storage bucket for order previews
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-previews', 'order-previews', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload preview files
CREATE POLICY "Admins can upload order previews"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'order-previews' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update preview files
CREATE POLICY "Admins can update order previews"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'order-previews' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete preview files
CREATE POLICY "Admins can delete order previews"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'order-previews' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow anyone to view preview files (customers need to see their previews)
CREATE POLICY "Anyone can view order previews"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-previews');