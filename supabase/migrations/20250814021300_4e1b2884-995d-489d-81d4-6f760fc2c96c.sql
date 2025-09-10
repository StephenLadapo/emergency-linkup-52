-- Add additional columns to profiles table for personal information
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faculty TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year_of_study TEXT;

-- Create emergency_contacts table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create medical_info table
CREATE TABLE IF NOT EXISTS public.medical_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blood_type TEXT,
  allergies TEXT,
  conditions TEXT,
  medications TEXT,
  medical_aid_number TEXT,
  medical_aid_provider TEXT,
  doctor_name TEXT,
  doctor_contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies for emergency_contacts
CREATE POLICY "Users can view own emergency contacts"
ON public.emergency_contacts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emergency contacts"
ON public.emergency_contacts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emergency contacts"
ON public.emergency_contacts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own emergency contacts"
ON public.emergency_contacts FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for medical_info
CREATE POLICY "Users can view own medical info"
ON public.medical_info FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical info"
ON public.medical_info FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medical info"
ON public.medical_info FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medical info"
ON public.medical_info FOR DELETE
USING (auth.uid() = user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_emergency_contacts_updated_at
  BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_info_updated_at
  BEFORE UPDATE ON public.medical_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update the handle_new_user function to include student_number from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, role, student_number)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'username',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    NEW.raw_user_meta_data->>'student_number'
  );
  RETURN NEW;
END;
$$;