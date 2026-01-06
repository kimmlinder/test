-- Create table for storing scene plans
CREATE TABLE public.scene_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  video_description TEXT,
  video_duration INTEGER,
  video_style TEXT,
  scene_plan JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scene_plans ENABLE ROW LEVEL SECURITY;

-- Users can view their own scene plans
CREATE POLICY "Users can view own scene plans"
ON public.scene_plans
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own scene plans
CREATE POLICY "Users can create own scene plans"
ON public.scene_plans
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own scene plans
CREATE POLICY "Users can update own scene plans"
ON public.scene_plans
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own scene plans
CREATE POLICY "Users can delete own scene plans"
ON public.scene_plans
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all scene plans
CREATE POLICY "Admins can view all scene plans"
ON public.scene_plans
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_scene_plans_updated_at
BEFORE UPDATE ON public.scene_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();