-- Add youtube_url column to blog_posts
ALTER TABLE public.blog_posts 
ADD COLUMN youtube_url text;