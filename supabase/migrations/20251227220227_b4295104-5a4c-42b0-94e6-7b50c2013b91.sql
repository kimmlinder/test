-- Create a table to track digital product downloads
CREATE TABLE public.digital_downloads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    download_token TEXT NOT NULL UNIQUE,
    download_count INTEGER NOT NULL DEFAULT 0,
    max_downloads INTEGER NOT NULL DEFAULT 10,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_digital_downloads_token ON public.digital_downloads(download_token);
CREATE INDEX idx_digital_downloads_order ON public.digital_downloads(order_id);

-- Enable RLS
ALTER TABLE public.digital_downloads ENABLE ROW LEVEL SECURITY;

-- Users can view their own downloads
CREATE POLICY "Users can view own downloads"
ON public.digital_downloads
FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = digital_downloads.order_id
    AND orders.user_id = auth.uid()
));

-- Admins can view all downloads
CREATE POLICY "Admins can view all downloads"
ON public.digital_downloads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage downloads
CREATE POLICY "Admins can manage downloads"
ON public.digital_downloads
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));