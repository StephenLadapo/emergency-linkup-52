-- Create role enum if not exists
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('student', 'medical_staff', 'security_staff', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create emergency type enum if not exists
DO $$ BEGIN
    CREATE TYPE public.emergency_type AS ENUM ('medical', 'security', 'fire', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create emergency status enum if not exists
DO $$ BEGIN
    CREATE TYPE public.emergency_status AS ENUM ('pending', 'acknowledged', 'in_progress', 'resolved', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create response status enum if not exists
DO $$ BEGIN
    CREATE TYPE public.response_status AS ENUM ('dispatched', 'arrived', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update profiles table to include role if column doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role user_role NOT NULL DEFAULT 'student';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department') THEN
        ALTER TABLE public.profiles ADD COLUMN department TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_number') THEN
        ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create emergency_requests table
CREATE TABLE IF NOT EXISTS public.emergency_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type emergency_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location JSONB,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status emergency_status DEFAULT 'pending',
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on emergency_requests
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;

-- Create staff_responses table
CREATE TABLE IF NOT EXISTS public.staff_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id UUID REFERENCES public.emergency_requests(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  response_type TEXT,
  message TEXT,
  status response_status DEFAULT 'dispatched',
  estimated_arrival TIMESTAMP WITH TIME ZONE,
  arrived_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on staff_responses
ALTER TABLE public.staff_responses ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emergency_id UUID REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id;
$$;

-- Security definer function to check if user can access emergency type
CREATE OR REPLACE FUNCTION public.can_access_emergency_type(_user_id UUID, _emergency_type emergency_type)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN public.get_user_role(_user_id) = 'admin' THEN true
    WHEN public.get_user_role(_user_id) = 'medical_staff' AND _emergency_type = 'medical' THEN true
    WHEN public.get_user_role(_user_id) = 'security_staff' AND _emergency_type IN ('security', 'fire', 'general') THEN true
    ELSE false
  END;
$$;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for emergency_requests
CREATE POLICY "Users can view relevant emergency requests" 
ON public.emergency_requests FOR SELECT 
USING (
  auth.uid() = user_id OR 
  public.get_user_role(auth.uid()) = 'admin' OR
  public.can_access_emergency_type(auth.uid(), type)
);

CREATE POLICY "Students can insert emergency requests" 
ON public.emergency_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can update emergency requests"
ON public.emergency_requests FOR UPDATE
USING (
  public.get_user_role(auth.uid()) = 'admin' OR
  public.can_access_emergency_type(auth.uid(), type)
);

-- RLS Policies for staff_responses
CREATE POLICY "Users can view relevant responses"
ON public.staff_responses FOR SELECT
USING (
  auth.uid() = staff_id OR
  public.get_user_role(auth.uid()) = 'admin' OR
  EXISTS (
    SELECT 1 FROM public.emergency_requests er 
    WHERE er.id = emergency_id 
    AND (er.user_id = auth.uid() OR public.can_access_emergency_type(auth.uid(), er.type))
  )
);

CREATE POLICY "Staff can insert responses for their emergency types"
ON public.staff_responses FOR INSERT
WITH CHECK (
  auth.uid() = staff_id AND
  EXISTS (
    SELECT 1 FROM public.emergency_requests er 
    WHERE er.id = emergency_id 
    AND public.can_access_emergency_type(auth.uid(), er.type)
  )
);

CREATE POLICY "Staff can update own responses"
ON public.staff_responses FOR UPDATE
USING (auth.uid() = staff_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'username',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for new emergency
CREATE OR REPLACE FUNCTION public.notify_staff_of_emergency()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify relevant staff based on emergency type
  INSERT INTO public.notifications (user_id, emergency_id, title, message, type)
  SELECT 
    p.id,
    NEW.id,
    'New Emergency: ' || NEW.title,
    'A new ' || NEW.type || ' emergency has been reported.',
    'emergency'
  FROM public.profiles p
  WHERE 
    (p.role = 'admin') OR
    (p.role = 'medical_staff' AND NEW.type = 'medical') OR
    (p.role = 'security_staff' AND NEW.type IN ('security', 'fire', 'general'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger for emergency notifications
DROP TRIGGER IF EXISTS notify_staff_trigger ON public.emergency_requests;
CREATE TRIGGER notify_staff_trigger
  AFTER INSERT ON public.emergency_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_staff_of_emergency();

-- Enable realtime for all tables
ALTER TABLE public.emergency_requests REPLICA IDENTITY FULL;
ALTER TABLE public.staff_responses REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;