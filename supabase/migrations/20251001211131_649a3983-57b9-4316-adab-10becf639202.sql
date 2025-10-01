-- Create table for 2FA codes
CREATE TABLE public.two_factor_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.two_factor_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own 2FA codes
CREATE POLICY "Users can view their own 2FA codes"
ON public.two_factor_codes
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert 2FA codes
CREATE POLICY "System can insert 2FA codes"
ON public.two_factor_codes
FOR INSERT
WITH CHECK (true);

-- System can update 2FA codes (mark as used)
CREATE POLICY "System can update 2FA codes"
ON public.two_factor_codes
FOR UPDATE
USING (auth.uid() = user_id);

-- Add 2FA enabled flag to profiles
ALTER TABLE public.profiles
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX idx_two_factor_codes_user_id ON public.two_factor_codes(user_id);
CREATE INDEX idx_two_factor_codes_expires_at ON public.two_factor_codes(expires_at);