import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const TwoFactorSetup = () => {
  const { user } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggle2FA = async (enabled: boolean) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ two_factor_enabled: enabled })
        .eq('id', user.id);

      if (error) throw error;

      setTwoFactorEnabled(enabled);
      toast.success(
        enabled 
          ? '2FA enabled! You\'ll receive a code via email on next login.' 
          : '2FA disabled successfully.'
      );
    } catch (error: any) {
      console.error('Error updating 2FA:', error);
      toast.error('Failed to update 2FA settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="2fa-toggle" className="text-base">Enable 2FA</Label>
            <p className="text-sm text-muted-foreground">
              Receive a verification code via email when logging in
            </p>
          </div>
          <Switch
            id="2fa-toggle"
            checked={twoFactorEnabled}
            onCheckedChange={handleToggle2FA}
            disabled={loading}
          />
        </div>

        {twoFactorEnabled && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4" />
              <span>Email Verification</span>
            </div>
            <p className="text-sm text-muted-foreground">
              A 6-digit code will be sent to <strong>{user?.email}</strong> each time you log in.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;
