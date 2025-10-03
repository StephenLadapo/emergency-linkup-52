import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, CheckCircle } from 'lucide-react';
import Logo from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setEmailSent(true);
      toast.success('Password reset link sent to your email');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 to-amber-700/70 mix-blend-multiply"></div>
        <img 
          src="/lovable-uploads/5035b3d6-0fe7-4ccd-b109-16bb678bdc51.png" 
          alt="University of Limpopo Campus" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="z-10 w-full max-w-md">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-xl p-8 shadow-2xl border border-amber-200 dark:border-amber-900/30">
          <div className="flex flex-col items-center space-y-2 text-center mb-8">
            <Logo className="mb-4" />
            <h1 className="text-3xl font-bold text-gradient-primary">
              Forgot Password
            </h1>
            <p className="text-muted-foreground">
              {emailSent 
                ? 'Check your email for the reset link' 
                : 'Enter your email to receive a password reset link'}
            </p>
          </div>

          {!emailSent ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-amber-200 dark:border-amber-900/30"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit"
                className="w-full mt-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700" 
                disabled={loading}
              >
                {loading ? 'Sending Link...' : 'Send Reset Link'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Reset link sent!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    Click the link in the email to reset your password. The link will expire in 1 hour.
                  </p>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setEmailSent(false)}
              >
                Use a different email
              </Button>
            </div>
          )}
          
          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="underline text-primary">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
