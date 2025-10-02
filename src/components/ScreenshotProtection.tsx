import { useEffect } from 'react';

interface ScreenshotProtectionProps {
  children: React.ReactNode;
}

const ScreenshotProtection = ({ children }: ScreenshotProtectionProps) => {
  useEffect(() => {
    // Add CSS to prevent screenshots
    const style = document.createElement('style');
    style.innerHTML = `
      body {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      @media print {
        body {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Add meta tag to prevent screenshots on mobile
    const meta = document.createElement('meta');
    meta.name = 'screenshot';
    meta.content = 'disabled';
    document.head.appendChild(meta);

    // Detect screenshot attempts (keyboard shortcuts)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common screenshot shortcuts
      if (
        (e.key === 'PrintScreen') ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4')) || // Mac
        (e.key === 'F12') // Some screenshot tools
      ) {
        e.preventDefault();
        console.log('Screenshot attempt detected and blocked');
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.head.removeChild(style);
      document.head.removeChild(meta);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return <>{children}</>;
};

export default ScreenshotProtection;
