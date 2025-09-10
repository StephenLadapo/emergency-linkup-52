-- Drop all existing policies before recreating
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- Now create/update the new tables and policies
-- Update the existing tables with better policies focused on role-based access

-- Drop old policies on emergency_requests if they exist  
DROP POLICY IF EXISTS "Users can view own emergency requests" ON public.emergency_requests;
DROP POLICY IF EXISTS "Users can insert own emergency requests" ON public.emergency_requests;
DROP POLICY IF EXISTS "Staff can view emergency requests based on type" ON public.emergency_requests;
DROP POLICY IF EXISTS "Students can view own emergency requests" ON public.emergency_requests;
DROP POLICY IF EXISTS "Students can insert emergency requests" ON public.emergency_requests;
DROP POLICY IF EXISTS "Staff can update emergency requests" ON public.emergency_requests;
DROP POLICY IF EXISTS "Users can view relevant emergency requests" ON public.emergency_requests;

-- Create new policies for emergency_requests
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

-- Drop old policies on staff_responses if they exist
DROP POLICY IF EXISTS "Staff can view responses for their emergency types" ON public.staff_responses;
DROP POLICY IF EXISTS "Staff can insert responses for their emergency types" ON public.staff_responses;
DROP POLICY IF EXISTS "Staff can update own responses" ON public.staff_responses;
DROP POLICY IF EXISTS "Users can view relevant responses" ON public.staff_responses;

-- Create new policies for staff_responses
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

-- Drop old policies on notifications if they exist
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

-- Create new policies for notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own notifications"  
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);