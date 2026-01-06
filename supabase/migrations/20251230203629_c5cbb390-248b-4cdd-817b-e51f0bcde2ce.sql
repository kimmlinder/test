-- Create user_settings table for storing all beta settings
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  
  -- Profile extended fields
  display_name text,
  location text,
  default_start_page text DEFAULT 'automatic',
  website text,
  github text,
  twitter text,
  linkedin text,
  instagram text,
  
  -- AI Agent settings
  ai_conversation_tone text DEFAULT 'professional',
  ai_language text DEFAULT 'en',
  ai_response_length text DEFAULT 'medium',
  
  -- Business profile
  business_bio text,
  business_brand_name text,
  business_industry text,
  business_target_audience text,
  business_usp text,
  business_mission text,
  business_outreach_tone text DEFAULT 'authentic',
  
  -- Personal data / Communication style
  personal_company text,
  personal_role text,
  personal_greeting_style text DEFAULT 'friendly',
  personal_emoji_usage text DEFAULT 'rarely',
  personal_text_length text DEFAULT 'medium',
  personal_tone text DEFAULT 'friendly',
  personal_cta_style text DEFAULT 'direct',
  personal_note text,
  
  -- Notification settings (stored as JSONB for flexibility)
  notification_settings jsonb DEFAULT '{
    "bonus_credits": {"enabled": true, "frequency": "instant"},
    "comments": {"enabled": true, "frequency": "instant"},
    "join_requests": {"enabled": true, "frequency": "instant"},
    "mentions": {"enabled": true, "frequency": "instant"},
    "orders": {"enabled": true, "frequency": "instant"},
    "promotions": {"enabled": false, "frequency": "daily"},
    "system": {"enabled": true, "frequency": "instant"}
  }'::jsonb,
  
  -- Interface language
  interface_language text DEFAULT 'en',
  
  -- Team settings
  upline_user_id uuid,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all settings"
ON public.user_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();