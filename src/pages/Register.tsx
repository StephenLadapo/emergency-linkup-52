import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '@/components/AuthForm';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";

import { supabase } from '@/integrations/supabase/client';

// Password requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REQUIREMENTS = [
  { check: (p: string) => p.length >= PASSWORD_MIN_LENGTH, text: "At least 8 characters" },
  { check: (p: string) => /[A-Z]/.test(p), text: "At least one uppercase letter" },
  { check: (p: string) => /[a-z]/.test(p), text: "At least one lowercase letter" },
  { check: (p: string) => /[0-9]/.test(p), text: "At least one number" },
  { check: (p: string) => /[^A-Za-z0-9]/.test(p), text: "At least one special character" }
];

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validatePassword = (password: string): boolean => {
    const failedRequirements = PASSWORD_REQUIREMENTS.filter(req => !req.check(password));
    
    if (failedRequirements.length > 0) {
      setPasswordError(`Password does not meet requirements: ${failedRequirements.map(r => r.text).join(', ')}`);
      return false;
    }
    
    setPasswordError(null);
    return true;
  };


  const handleRegister = async (email: string, password: string, fullName?: string, studentNumber?: string, confirmPassword?: string) => {
    setLoading(true);
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }
    
    if (!validatePassword(password)) {
      toast.error('Password does not meet security requirements');
      setLoading(false);
      return;
    }
    
    // Remove Gmail restriction to allow all email addresses
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard/profile`,
          data: {
            full_name: fullName,
            student_number: studentNumber,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Simplified success message - let Supabase handle email confirmation
        toast.success('Registration successful! You can now sign in.');
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
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
            <h1 className="text-3xl font-bold text-gradient-primary">Create an Account</h1>
            <p className="text-muted-foreground">
              Sign up to access the Emergency System
            </p>
          </div>
          
          <Alert className="mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30">
            <Shield className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm text-amber-700 dark:text-amber-300">
              For your security, we require a strong password with a mix of characters.
            </AlertDescription>
          </Alert>
          
          <AuthForm 
            mode="register" 
            onSubmit={handleRegister} 
            showConfirmPassword={true} 
            passwordRequirements={PASSWORD_REQUIREMENTS} 
            loading={loading}
          />
          
          {passwordError && (
            <p className="mt-2 text-sm text-red-600">{passwordError}</p>
          )}
          
          <div className="mt-6 text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="underline text-primary">
              Login here
            </Link>
          </div>
          
          <div className="mt-8 text-center">
            <Button variant="outline" asChild className="border-amber-500 text-amber-700 hover:bg-amber-50">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
