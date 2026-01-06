-- Add payment_method and revolut_link columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'pay_on_delivery',
ADD COLUMN IF NOT EXISTS revolut_link text;

-- Create payment_settings table for configurable bank details
CREATE TABLE public.payment_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_beneficiary text NOT NULL DEFAULT 'Kim Magnus Linder',
  bank_iban text NOT NULL DEFAULT 'LT91 3250 0314 3638 0880',
  bank_bic text NOT NULL DEFAULT 'REVOLT21',
  bank_name text NOT NULL DEFAULT 'Revolut Bank UAB',
  default_revolut_link text DEFAULT 'https://checkout.revolut.com/pay/f0f9a97b-2463-4d00-9ceb-fb1b9806a7e2',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on payment_settings
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view payment settings (needed for checkout)
CREATE POLICY "Anyone can view payment settings"
ON public.payment_settings
FOR SELECT
USING (true);

-- Only admins can update payment settings
CREATE POLICY "Admins can update payment settings"
ON public.payment_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert payment settings
CREATE POLICY "Admins can insert payment settings"
ON public.payment_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default payment settings
INSERT INTO public.payment_settings (
  bank_beneficiary,
  bank_iban,
  bank_bic,
  bank_name,
  default_revolut_link
) VALUES (
  'Kim Magnus Linder',
  'LT91 3250 0314 3638 0880',
  'REVOLT21',
  'Revolut Bank UAB',
  'https://checkout.revolut.com/pay/f0f9a97b-2463-4d00-9ceb-fb1b9806a7e2'
);

-- Create trigger to update updated_at
CREATE TRIGGER update_payment_settings_updated_at
BEFORE UPDATE ON public.payment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();