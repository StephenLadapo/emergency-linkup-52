import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Lock } from 'lucide-react';

interface PinEntryProps {
  onSuccess: () => void;
  onLogout: () => void;
}

const PinEntry = ({ onSuccess, onLogout }: PinEntryProps) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const navigate = useNavigate();

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }

    if (attempts >= 3) {
      toast.error('Too many failed attempts. Please log in again.');
      await onLogout();
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase.functions.invoke('verify-pin', {
        body: { pin, userId: user.id }
      });

      if (error) {
        setAttempts(prev => prev + 1);
        throw error;
      }

      if (data?.success) {
        localStorage.setItem('pin_verified', 'true');
        toast.success('PIN verified successfully!');
        navigate('/');
      } else {
        setAttempts(prev => prev + 1);
        throw new Error('Invalid PIN');
      }
    } catch (error: any) {
      console.error('PIN verification error:', error);
      toast.error('Incorrect PIN');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Enter PIN</CardTitle>
          <CardDescription>
            Enter your 4-digit PIN to access the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyPin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN (4 digits)</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                placeholder="Enter PIN"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || pin.length !== 4}
            >
              {loading ? 'Verifying...' : 'Verify PIN'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onLogout}
              disabled={loading}
            >
              Logout
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PinEntry;
