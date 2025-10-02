import { useState, useEffect } from 'react';
import NotificationPreferences from "@/components/NotificationPreferences";
import TwoFactorSetup from "@/components/TwoFactorSetup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const SettingsPage = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('two_factor_enabled')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setTwoFactorEnabled((profile as any).two_factor_enabled || false);
        }
      }
    };
    
    fetchProfile();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Settings</h2>
      <p className="text-muted-foreground">
        Customize app settings, notification preferences, and security options.
      </p>
      
      <TwoFactorSetup 
        isEnabled={twoFactorEnabled} 
        onToggle={setTwoFactorEnabled} 
      />
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationPreferences />
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
