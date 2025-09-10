-- Add live status tracking for emergency requests
ALTER TABLE emergency_requests ADD COLUMN response_status text DEFAULT 'pending';
ALTER TABLE emergency_requests ADD COLUMN responder_eta timestamp with time zone;
ALTER TABLE emergency_requests ADD COLUMN response_notes text;

-- Create campus alerts table
CREATE TABLE IF NOT EXISTS campus_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  alert_type text NOT NULL DEFAULT 'general', -- 'lockdown', 'weather', 'threat', 'general'
  priority text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  sender_id uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone,
  target_audience text DEFAULT 'all', -- 'all', 'students', 'staff', 'faculty'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for campus_alerts
ALTER TABLE campus_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for campus_alerts
CREATE POLICY "Everyone can view active alerts" ON campus_alerts
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admin and staff can create alerts" ON campus_alerts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'security_staff')
    )
  );

CREATE POLICY "Senders can update their alerts" ON campus_alerts
  FOR UPDATE USING (auth.uid() = sender_id);

-- Create offline emergency requests table
CREATE TABLE IF NOT EXISTS offline_emergency_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  emergency_data jsonb NOT NULL,
  sync_status text DEFAULT 'pending', -- 'pending', 'synced', 'failed'
  created_at timestamp with time zone DEFAULT now(),
  synced_at timestamp with time zone
);

-- Enable RLS for offline requests
ALTER TABLE offline_emergency_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their offline requests" ON offline_emergency_requests
  FOR ALL USING (auth.uid() = user_id);

-- Create safe zones table
CREATE TABLE IF NOT EXISTS safe_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  zone_type text NOT NULL, -- 'clinic', 'security_point', 'shelter', 'emergency_exit'
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  description text,
  capacity integer,
  operating_hours text,
  contact_info text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for safe_zones
ALTER TABLE safe_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active safe zones" ON safe_zones
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage safe zones" ON safe_zones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create check-in timers table
CREATE TABLE IF NOT EXISTS check_in_timers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  timer_duration integer NOT NULL, -- in minutes
  start_time timestamp with time zone DEFAULT now(),
  expected_check_in timestamp with time zone NOT NULL,
  last_check_in timestamp with time zone,
  status text DEFAULT 'active', -- 'active', 'completed', 'missed', 'emergency_triggered'
  emergency_contacts text[], -- array of contact IDs/phone numbers
  location_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for check_in_timers
ALTER TABLE check_in_timers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their check-in timers" ON check_in_timers
  FOR ALL USING (auth.uid() = user_id);

-- Add update triggers
CREATE TRIGGER update_campus_alerts_updated_at
  BEFORE UPDATE ON campus_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safe_zones_updated_at
  BEFORE UPDATE ON safe_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_check_in_timers_updated_at
  BEFORE UPDATE ON check_in_timers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();