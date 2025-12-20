import { useState, useEffect } from 'react';

// This hook tracks the window size and returns true if the device is mobile.
const useIsMobile = (breakpoint: number = 768): boolean => {
  // Initialize state with current window width
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      // Clear existing timeout if resize is still happening
      if (timeoutId) clearTimeout(timeoutId);

      // Set a new timeout (debounce)
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth <= breakpoint);
      }, 150);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup listener and timeout on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;
