-- Create table for saving AI creations (prompts, briefs, images)
CREATE TABLE public.ai_creations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  creation_type TEXT NOT NULL CHECK (creation_type IN ('brief', 'scene_plan', 'photo_scene_plan', 'prompt', 'image')),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_creations ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own creations" 
ON public.ai_creations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own creations" 
ON public.ai_creations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own creations" 
ON public.ai_creations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own creations" 
ON public.ai_creations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_ai_creations_user_type ON public.ai_creations(user_id, creation_type);
CREATE INDEX idx_ai_creations_user_favorites ON public.ai_creations(user_id, is_favorite) WHERE is_favorite = true;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ai_creations_updated_at
BEFORE UPDATE ON public.ai_creations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();