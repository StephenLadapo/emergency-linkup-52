import { useEffect, useState, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ScreenshotProtectionProps {
  children: ReactNode;
}

const ScreenshotProtection = ({ children }: ScreenshotProtectionProps) => {
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsBlurred(document.hidden);
    };

    const handleBlur = () => {
      setIsBlurred(true);
    };

    const handleFocus = () => {
      setIsBlurred(false);
    };

    // Add screenshot warning
    const preventScreenshot = (e: KeyboardEvent) => {
      // Detect common screenshot shortcuts
      if (
        (e.key === 'PrintScreen') ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4')) || // Mac
        (e.metaKey && e.shiftKey && e.key === 's') // Mac screenshot
      ) {
        e.preventDefault();
        // We can't actually prevent screenshots on web, but we can warn
        console.warn('Screenshot attempt detected - sensitive content');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('keydown', preventScreenshot);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('keydown', preventScreenshot);
    };
  }, []);

  return (
    <div className="relative select-none">
      {/* Watermark overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center opacity-5">
        <div className="rotate-[-45deg] text-6xl font-bold text-foreground whitespace-nowrap">
          CONFIDENTIAL • EMERGENCY SYSTEM • CONFIDENTIAL
        </div>
      </div>

      {/* Content with blur when inactive */}
      <div className={isBlurred ? 'filter blur-lg transition-all duration-300' : 'transition-all duration-300'}>
        {children}
      </div>

      {/* Blur overlay message */}
      {isBlurred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center space-y-4 p-8 bg-card rounded-lg border shadow-lg">
            <AlertTriangle className="w-16 h-16 mx-auto text-amber-500" />
            <h2 className="text-2xl font-bold">Protected Content</h2>
            <p className="text-muted-foreground">
              Click to return to the application
            </p>
          </div>
        </div>
      )}

      {/* Screenshot warning indicator */}
      <div className="fixed bottom-4 right-4 z-40 opacity-30 pointer-events-none">
        <div className="flex items-center gap-2 bg-amber-500/20 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full text-xs">
          <AlertTriangle className="w-3 h-3" />
          <span>Protected Content</span>
        </div>
      </div>
    </div>
  );
};

export default ScreenshotProtection;
