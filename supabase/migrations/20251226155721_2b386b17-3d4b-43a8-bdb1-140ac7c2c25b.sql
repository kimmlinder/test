-- Add member_only column to products table
ALTER TABLE public.products 
ADD COLUMN member_only boolean NOT NULL DEFAULT false;