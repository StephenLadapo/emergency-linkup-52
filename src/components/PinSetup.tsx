import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Lock } from 'lucide-react';

interface PinSetupProps {
  onComplete: () => void;
}

const PinSetup = ({ onComplete }: PinSetupProps) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'setup' | 'confirm'>('setup');
  const [loading, setLoading] = useState(false);

  const handlePinComplete = async () => {
    if (step === 'setup') {
      setStep('confirm');
      setConfirmPin('');
    } else {
      if (pin !== confirmPin) {
        toast.error('PINs do not match. Please try again.');
        setStep('setup');
        setPin('');
        setConfirmPin('');
        return;
      }

      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        const { error } = await supabase.functions.invoke('setup-pin', {
          body: { pin, userId: user.id }
        });

        if (error) throw error;

        toast.success('PIN set up successfully!');
        localStorage.setItem('pin_verified', 'true');
        onComplete();
      } catch (error: any) {
        console.error('PIN setup error:', error);
        toast.error('Failed to set up PIN. Please try again.');
        setStep('setup');
        setPin('');
        setConfirmPin('');
      } finally {
        setLoading(false);
      }
    }
  };

  const currentPin = step === 'setup' ? pin : confirmPin;
  const setCurrentPin = step === 'setup' ? setPin : setConfirmPin;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {step === 'setup' ? 'Set Up Your PIN' : 'Confirm Your PIN'}
          </CardTitle>
          <CardDescription>
            {step === 'setup' 
              ? 'Create a 4-digit PIN for additional security' 
              : 'Re-enter your PIN to confirm'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={4}
              value={currentPin}
              onChange={setCurrentPin}
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

          {step === 'confirm' && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setStep('setup');
                setPin('');
                setConfirmPin('');
              }}
              disabled={loading}
            >
              Back
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PinSetup;
