// src/hooks/analytics/useScrollTracking.ts
import { useEffect, useCallback, MutableRefObject } from 'react';
import { SessionData } from '../../config/analyticsConfig';

export const useScrollTracking = (
  sessionRef: MutableRefObject<SessionData>,
  handleUserActivity: () => void
) => {
  
  const handleScroll = useCallback(() => {
    handleUserActivity(); // Scroll counts as activity
    
    const scrollTop = window.scrollY;
    
    // Velocity Calculation
    const now = Date.now();
    const dt = now - sessionRef.current.lastScrollTime;
    
    // Only calculate if enough time has passed (50ms) to avoid noise
    if (dt > 50) { 
        const dy = Math.abs(scrollTop - sessionRef.current.lastScrollTop);
        sessionRef.current.scrollVelocity = dy / dt; 
        
        sessionRef.current.lastScrollTop = scrollTop;
        sessionRef.current.lastScrollTime = now;
    }

    // Max Scroll Depth
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    
    if (scrollPercent > sessionRef.current.maxScroll) {
        sessionRef.current.maxScroll = scrollPercent;
    }
  }, [handleUserActivity]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
};
