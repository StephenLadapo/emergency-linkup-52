import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
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

  const handlePinComplete = async () => {
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
        sessionStorage.setItem('pin_verified', 'true');
        toast.success('PIN verified successfully!');
        onSuccess();
      } else {
        setAttempts(prev => prev + 1);
        throw new Error('Invalid PIN');
      }
    } catch (error: any) {
      console.error('PIN verification error:', error);
      toast.error(`Incorrect PIN. ${3 - attempts - 1} attempts remaining.`);
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
          <CardTitle className="text-2xl">Enter Your PIN</CardTitle>
          <CardDescription>
            Please enter your 4-digit PIN to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={4}
              value={pin}
              onChange={setPin}
              onComplete={handlePinComplete}
              disabled={loading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={onLogout}
            disabled={loading}
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PinEntry;
