// src/hooks/useIsMobile.js
import { useState, useEffect } from 'react';

// This hook tracks the window size and returns true if the device is mobile.
// UPDATED: Added debounce to prevent rapid-fire re-renders during resize.
const useIsMobile = (breakpoint = 768) => {
  // Initialize state with current window width
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    let timeoutId;

    const handleResize = () => {
      // Clear existing timeout if resize is still happening
      if (timeoutId) clearTimeout(timeoutId);

      // Set a new timeout. We wait 150ms after the user STOPS resizing 
      // before we actually update the state. This prevents glitching.
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
