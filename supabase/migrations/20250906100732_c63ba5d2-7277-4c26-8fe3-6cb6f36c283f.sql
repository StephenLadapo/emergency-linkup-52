-- Emergency Supply Inventory Table
CREATE TABLE IF NOT EXISTS public.emergency_supplies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'water', 'medical', 'tools', 'clothing', 'documents', 'other')),
  quantity INTEGER NOT NULL DEFAULT 1,
  expiry_date DATE,
  location TEXT,
  notes TEXT,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Incident Reports Table
CREATE TABLE IF NOT EXISTS public.incident_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('safety_hazard', 'security_concern', 'infrastructure', 'environmental', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  location TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Emergency Broadcasts Table
CREATE TABLE IF NOT EXISTS public.emergency_broadcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  broadcast_type TEXT NOT NULL CHECK (broadcast_type IN ('general', 'weather', 'security', 'medical', 'evacuation', 'all_clear')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'staff', 'faculty')),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Geofence Zones Table
CREATE TABLE IF NOT EXISTS public.geofence_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  zone_type TEXT NOT NULL CHECK (zone_type IN ('safe_zone', 'restricted', 'evacuation_route', 'emergency_assembly', 'hazard_zone')),
  coordinates JSON NOT NULL,
  radius DECIMAL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Location Tracking Table
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  accuracy DECIMAL,
  zone_id UUID REFERENCES public.geofence_zones(id),
  zone_status TEXT CHECK (zone_status IN ('entered', 'exited', 'inside')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.emergency_supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Emergency Supplies Policies
CREATE POLICY "Users can view their own emergency supplies" ON public.emergency_supplies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own emergency supplies" ON public.emergency_supplies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own emergency supplies" ON public.emergency_supplies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own emergency supplies" ON public.emergency_supplies FOR DELETE USING (auth.uid() = user_id);

-- Incident Reports Policies
CREATE POLICY "Users can view their own incident reports" ON public.incident_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create incident reports" ON public.incident_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own incident reports" ON public.incident_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all incident reports" ON public.incident_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'security_staff', 'medical_staff'))
);

-- Emergency Broadcasts Policies
CREATE POLICY "Everyone can view active broadcasts" ON public.emergency_broadcasts FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Admin and staff can create broadcasts" ON public.emergency_broadcasts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'security_staff'))
);
CREATE POLICY "Senders can update their own broadcasts" ON public.emergency_broadcasts FOR UPDATE USING (auth.uid() = sender_id);

-- Geofence Zones Policies
CREATE POLICY "Everyone can view active geofence zones" ON public.geofence_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can manage geofence zones" ON public.geofence_zones FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- User Locations Policies
CREATE POLICY "Users can view their own location history" ON public.user_locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own location records" ON public.user_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can view all location data" ON public.user_locations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'security_staff'))
);

-- Add update triggers
CREATE TRIGGER update_emergency_supplies_updated_at BEFORE UPDATE ON public.emergency_supplies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_incident_reports_updated_at BEFORE UPDATE ON public.incident_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_emergency_broadcasts_updated_at BEFORE UPDATE ON public.emergency_broadcasts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_geofence_zones_updated_at BEFORE UPDATE ON public.geofence_zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();