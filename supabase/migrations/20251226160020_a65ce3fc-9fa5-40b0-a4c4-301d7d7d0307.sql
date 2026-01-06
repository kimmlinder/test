-- Add contact fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone text,
ADD COLUMN address text,
ADD COLUMN city text,
ADD COLUMN country text,
ADD COLUMN postal_code text;