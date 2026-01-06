-- Add digital_file_url column to products table
ALTER TABLE public.products 
ADD COLUMN digital_file_url text;

-- Create storage bucket for digital product files (private for security)
INSERT INTO storage.buckets (id, name, public)
VALUES ('digital-products', 'digital-products', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for digital-products bucket
-- Admins can upload, update, and delete files
CREATE POLICY "Admins can manage digital product files"
ON storage.objects
FOR ALL
USING (bucket_id = 'digital-products' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'digital-products' AND public.has_role(auth.uid(), 'admin'));

-- Users can download files for products they've purchased
CREATE POLICY "Users can download purchased digital products"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'digital-products' 
  AND EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    JOIN public.products p ON p.id = oi.product_id
    WHERE o.user_id = auth.uid()
      AND o.status IN ('accepted', 'confirmed', 'processing', 'shipped', 'delivered')
      AND p.digital_file_url = storage.objects.name
  )
);