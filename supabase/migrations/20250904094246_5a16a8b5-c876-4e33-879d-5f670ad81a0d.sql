-- Add default value for the used column in password_reset_codes table
ALTER TABLE public.password_reset_codes 
ALTER COLUMN used SET DEFAULT false;