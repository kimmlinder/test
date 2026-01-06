-- Allow all authenticated users to view payment settings (for upgrade flow)
CREATE POLICY "Authenticated users can view payment links"
ON public.payment_settings
FOR SELECT
TO authenticated
USING (true);