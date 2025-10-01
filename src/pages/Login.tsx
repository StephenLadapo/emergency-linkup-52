
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '@/components/AuthForm';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'login' | '2fa'>('login');
  const [tempUserId, setTempUserId] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      console.log('Attempting login with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (data.user) {
        console.log('Login successful for:', data.user.email);
        
        // Check if user has 2FA enabled
        const { data: profileData } = await supabase
          .from('profiles')
          .select('two_factor_enabled')
          .eq('id', data.user.id)
          .single();

        if (profileData?.two_factor_enabled) {
          // Send 2FA code
          const { error: codeError } = await supabase.functions.invoke('send-2fa-code', {
            body: { 
              email: data.user.email,
              userId: data.user.id 
            }
          });

          if (codeError) throw codeError;

          // Sign out temporarily
          await supabase.auth.signOut();
          
          setTempUserId(data.user.id);
          setTempEmail(email);
          setTempPassword(password);
          setStep('2fa');
          toast.success('Verification code sent to your email');
        } else {
          toast.success('Login successful!');
          navigate('/dashboard/profile');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please check your credentials.');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please check your email and click the confirmation link before signing in.');
      } else {
        toast.error(error.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (twoFactorCode.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      // Verify code
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-2fa-code', {
        body: { 
          userId: tempUserId,
          code: twoFactorCode 
        }
      });

      if (verifyError || !verifyData?.valid) {
        throw new Error('Invalid or expired verification code');
      }

      // Re-authenticate user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: tempEmail,
        password: tempPassword,
      });

      if (error) throw error;

      toast.success('Login successful!');
      navigate('/dashboard/profile');
    } catch (error: any) {
      console.error('2FA verification error:', error);
      toast.error(error.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 to-amber-700/70 mix-blend-multiply"></div>
        <img 
          src="/lovable-uploads/4b755f41-3d7d-4087-8826-24bfe295eccc.png" 
          alt="University of Limpopo Campus" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="z-10 w-full max-w-md">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-xl p-8 shadow-2xl border border-amber-200 dark:border-amber-900/30">
          <div className="flex flex-col items-center space-y-2 text-center mb-8">
            <Logo className="mb-4" />
            <h1 className="text-3xl font-bold text-gradient-primary">Welcome Back</h1>
            <p className="text-muted-foreground">
              Sign in to access the Emergency System
            </p>
          </div>
          
          {step === 'login' ? (
            <>
              <AuthForm mode="login" onSubmit={handleLogin} loading={loading} />
              
              <div className="mt-2 text-center">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot your password?
                </Link>
              </div>
              
              <div className="mt-6 text-center text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="underline text-primary">
                  Register here
                </Link>
              </div>
              
              <div className="mt-8 text-center">
                <Button variant="outline" asChild className="border-amber-500 text-amber-700 hover:bg-amber-50">
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-center block">Enter 6-Digit Verification Code</Label>
                <div className="flex justify-center">
                  <InputOTP 
                    maxLength={6} 
                    value={twoFactorCode} 
                    onChange={(value) => setTwoFactorCode(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Check your email for the verification code
                </p>
              </div>
              
              <Button 
                onClick={handleVerify2FA}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700" 
                disabled={loading || twoFactorCode.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>

              <Button 
                variant="outline"
                onClick={() => {
                  setStep('login');
                  setTwoFactorCode('');
                }}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
