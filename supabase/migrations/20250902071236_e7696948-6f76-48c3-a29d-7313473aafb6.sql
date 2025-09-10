-- Update the handle_new_user function to include student_number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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