-- Create a table to track feature usage
CREATE TABLE public.feature_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  feature_type text NOT NULL,
  usage_count integer NOT NULL DEFAULT 0,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature_type, usage_date)
);

-- Create index for faster lookups
CREATE INDEX idx_feature_usage_user_date ON public.feature_usage(user_id, usage_date);
CREATE INDEX idx_feature_usage_feature_type ON public.feature_usage(feature_type);

-- Enable Row Level Security
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own feature usage" 
ON public.feature_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feature usage" 
ON public.feature_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature usage" 
ON public.feature_usage 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feature usage" 
ON public.feature_usage 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a function to increment feature usage
CREATE OR REPLACE FUNCTION public.increment_feature_usage(
  p_user_id uuid,
  p_feature_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.feature_usage (user_id, feature_type, usage_count, usage_date)
  VALUES (p_user_id, p_feature_type, 1, CURRENT_DATE)
  ON CONFLICT (user_id, feature_type, usage_date)
  DO UPDATE SET 
    usage_count = feature_usage.usage_count + 1,
    updated_at = now();
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_feature_usage_updated_at
BEFORE UPDATE ON public.feature_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();