// src/hooks/useIsMobile.js
import { useState, useEffect } from 'react';

// This hook tracks the window size and returns true if the device is mobile.
// Default breakpoint is 768px (standard tablet/mobile cutoff).
const useIsMobile = (breakpoint = 768) => {
  // Initialize state with current window width
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    // Handler to call on window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup listener on unmount
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;
