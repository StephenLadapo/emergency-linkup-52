-- Add PIN code fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN pin_code TEXT,
ADD COLUMN pin_salt TEXT,
ADD COLUMN pin_setup_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster PIN lookups
CREATE INDEX idx_profiles_pin ON public.profiles(id) WHERE pin_code IS NOT NULL;