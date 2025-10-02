import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();

  const logout = async () => {
    await supabase.auth.signOut();
    toast.error('Session expired due to inactivity');
    navigate('/login');
  };

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    // Show warning 1 minute before logout
    warningTimeoutRef.current = setTimeout(() => {
      toast.warning('You will be logged out in 1 minute due to inactivity');
    }, INACTIVITY_TIMEOUT - 60000);

    // Set logout timer
    timeoutRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    // Events that indicate user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Start the timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, []);
};
