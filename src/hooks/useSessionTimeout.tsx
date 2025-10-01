import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes
const WARNING_DURATION = 60 * 1000; // 1 minute warning

export const useSessionTimeout = () => {
  const { signOut, user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();

  const logout = useCallback(async () => {
    try {
      await signOut();
      toast.error('Session expired due to inactivity');
    } catch (error) {
      console.error('Error during auto-logout:', error);
    }
  }, [signOut]);

  const showWarning = useCallback(() => {
    toast.warning('Your session will expire in 1 minute due to inactivity', {
      duration: 10000,
    });
  }, []);

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Set warning timer (1 minute before logout)
    warningRef.current = setTimeout(() => {
      showWarning();
    }, TIMEOUT_DURATION - WARNING_DURATION);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      logout();
    }, TIMEOUT_DURATION);
  }, [logout, showWarning]);

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimer();
    };

    // Start timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      // Cleanup
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [user, resetTimer]);
};
