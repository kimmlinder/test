-- Update the product-images bucket to allow larger file sizes (50MB)
UPDATE storage.buckets 
SET file_size_limit = 52428800 
WHERE id = 'product-images';

-- Also update other image buckets for consistency
UPDATE storage.buckets 
SET file_size_limit = 52428800 
WHERE id IN ('highlight-images', 'avatars', 'order-previews');