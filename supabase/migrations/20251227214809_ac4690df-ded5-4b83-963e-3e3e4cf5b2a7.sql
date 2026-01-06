-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view payment settings" ON public.payment_settings;

-- Create a new policy that only allows admins to view payment settings
CREATE POLICY "Admins can view payment settings"
ON public.payment_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));