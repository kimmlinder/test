-- Allow admins to view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update orders
CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all order items
CREATE POLICY "Admins can view all order items"
ON public.order_items
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all order timeline
CREATE POLICY "Admins can view all order timeline"
ON public.order_timeline
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert order timeline entries
CREATE POLICY "Admins can insert order timeline"
ON public.order_timeline
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));