-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can view subscribers" ON public.newsletter_subscribers;

-- Create a new policy using the has_role function
CREATE POLICY "Admins can view all subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));