import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PinSetup from './PinSetup';
import PinEntry from './PinEntry';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const [pinStatus, setPinStatus] = useState<'loading' | 'setup' | 'verify' | 'verified'>('loading');

  useEffect(() => {
    const checkPinStatus = async () => {
      if (!user) {
        // Clear PIN verification when user logs out
        sessionStorage.removeItem('pin_verified');
        setPinStatus('loading');
        return;
      }

      const pinVerified = sessionStorage.getItem('pin_verified');
      if (pinVerified === 'true') {
        setPinStatus('verified');
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('pin_code')
          .eq('id', user.id)
          .single();

        if (profile?.pin_code) {
          setPinStatus('verify');
        } else {
          setPinStatus('setup');
        }
      } catch (error) {
        console.error('Error checking PIN status:', error);
        setPinStatus('setup');
      }
    };

    if (user && !loading) {
      checkPinStatus();
    } else if (!user) {
      checkPinStatus();
    }
  }, [user, loading]);

  const handleLogout = async () => {
    sessionStorage.removeItem('pin_verified');
    await signOut();
  };

  if (loading || pinStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (pinStatus === 'setup') {
    return <PinSetup onComplete={() => setPinStatus('verified')} />;
  }

  if (pinStatus === 'verify') {
    return <PinEntry onSuccess={() => setPinStatus('verified')} onLogout={handleLogout} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;