-- Add beta_features_enabled column to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN beta_features_enabled boolean DEFAULT false;