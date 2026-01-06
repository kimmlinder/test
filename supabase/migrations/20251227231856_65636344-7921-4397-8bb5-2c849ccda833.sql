-- Drop the admin-only policy
DROP POLICY IF EXISTS "Admins can view payment settings" ON public.payment_settings;

-- Create a policy that allows everyone to read payment settings (bank details need to be public for bank transfers)
CREATE POLICY "Anyone can view payment settings for bank transfers"
ON public.payment_settings
FOR SELECT
USING (true);