-- Create password reset codes table
CREATE TABLE public.password_reset_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Create policies - anyone can insert/select for password reset
CREATE POLICY "Anyone can insert reset codes" 
ON public.password_reset_codes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can select unused reset codes" 
ON public.password_reset_codes 
FOR SELECT 
USING (NOT used AND expires_at > now());

CREATE POLICY "Anyone can update reset codes" 
ON public.password_reset_codes 
FOR UPDATE 
USING (NOT used AND expires_at > now());

-- Add trigger for timestamps
CREATE TRIGGER update_password_reset_codes_updated_at
BEFORE UPDATE ON public.password_reset_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_password_reset_codes_email_code ON public.password_reset_codes(email, code);
CREATE INDEX idx_password_reset_codes_expires_at ON public.password_reset_codes(expires_at);