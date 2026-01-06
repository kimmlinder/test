-- Add premium_payment_link to payment_settings table
ALTER TABLE public.payment_settings
ADD COLUMN IF NOT EXISTS premium_payment_link TEXT;