import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Shield } from 'lucide-react';

interface TwoFactorSetupProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const TwoFactorSetup = ({ isEnabled, onToggle }: TwoFactorSetupProps) => {
  const [loading, setLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({ two_factor_enabled: checked } as any)
        .eq('id', user.id);

      if (error) throw error;

      onToggle(checked);
      toast.success(checked ? '2FA enabled successfully' : '2FA disabled successfully');
    } catch (error: any) {
      console.error('2FA toggle error:', error);
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
          <div className="space-y-0.5">
            <Label htmlFor="2fa-toggle">Enable 2FA</Label>
            <p className="text-sm text-muted-foreground">
              Require a verification code when signing in
            </p>
          </div>
          <Switch
            id="2fa-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>
        
        {isEnabled && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              A verification code will be sent to your email each time you sign in.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;
