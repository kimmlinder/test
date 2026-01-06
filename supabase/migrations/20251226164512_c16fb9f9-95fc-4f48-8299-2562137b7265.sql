-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can view payment settings" ON public.payment_settings;

-- Create a new policy that only allows authenticated users to view payment settings
CREATE POLICY "Authenticated users can view payment settings" 
ON public.payment_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);