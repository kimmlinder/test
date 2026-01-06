-- Drop the public policy
DROP POLICY IF EXISTS "Anyone can view payment settings for bank transfers" ON public.payment_settings;

-- Restore admin-only policy
CREATE POLICY "Admins can view payment settings"
ON public.payment_settings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));