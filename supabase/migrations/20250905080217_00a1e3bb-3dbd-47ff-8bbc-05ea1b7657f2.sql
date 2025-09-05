-- Ensure password_reset_codes table exists with correct structure
CREATE TABLE IF NOT EXISTS public.password_reset_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert reset codes" ON public.password_reset_codes;
DROP POLICY IF EXISTS "Anyone can select unused reset codes" ON public.password_reset_codes;
DROP POLICY IF EXISTS "Anyone can update reset codes" ON public.password_reset_codes;

-- Create policies for password reset codes
CREATE POLICY "Anyone can insert reset codes" 
ON public.password_reset_codes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can select unused reset codes" 
ON public.password_reset_codes 
FOR SELECT 
USING ((NOT used) AND (expires_at > now()));

CREATE POLICY "Anyone can update reset codes" 
ON public.password_reset_codes 
FOR UPDATE 
USING ((NOT used) AND (expires_at > now()));

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_password_reset_codes_updated_at ON public.password_reset_codes;
CREATE TRIGGER update_password_reset_codes_updated_at
BEFORE UPDATE ON public.password_reset_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();