// src/hooks/analytics/useScrollTracking.ts
import { useEffect, useCallback, MutableRefObject } from 'react';
import { SessionData, ANALYTICS_CONFIG } from '../../config/analyticsConfig';

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
        const dy = scrollTop - sessionRef.current.lastScrollTop; // Signed diff
        const absDy = Math.abs(dy);
        
        // 1. Calculate Velocity
        sessionRef.current.scrollVelocity = absDy / dt; 

        // 2. Determine Direction & Confusion
        if (dy < 0) {
            // SCROLLING UP (Reading back / Confusion)
            sessionRef.current.scrollDirection = 'up';
            sessionRef.current.tempUpScroll += absDy;

            // Threshold Check
            if (sessionRef.current.tempUpScroll > ANALYTICS_CONFIG.CONFUSION.SCROLL_UP_THRESHOLD) {
                sessionRef.current.confusionCount += 1;
                sessionRef.current.tempUpScroll = 0; // Reset after counting one event
                // Optional: Log this event to analytics queue here if granular precision is needed
            }

        } else if (dy > 0) {
            // SCROLLING DOWN (Progressing)
            sessionRef.current.scrollDirection = 'down';
            sessionRef.current.tempUpScroll = 0; // Reset confusion tracker on progress
        } else {
            sessionRef.current.scrollDirection = 'steady';
        }
        
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
