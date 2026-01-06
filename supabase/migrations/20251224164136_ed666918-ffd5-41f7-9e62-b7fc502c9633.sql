-- Create order_feedback table for preview feedback
CREATE TABLE public.order_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view feedback on their own orders
CREATE POLICY "Users can view feedback on own orders"
ON public.order_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add feedback to their own orders
CREATE POLICY "Users can add feedback to own orders"
ON public.order_feedback
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_feedback.order_id AND orders.user_id = auth.uid())
);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.order_feedback
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can add feedback responses
CREATE POLICY "Admins can add feedback"
ON public.order_feedback
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_timeline;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_feedback;