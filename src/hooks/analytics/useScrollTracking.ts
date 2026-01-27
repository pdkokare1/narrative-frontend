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
        const dy = scrollTop - sessionRef.current.lastScrollTop; // Signed difference
        const absDy = Math.abs(dy);
        
        // 1. Calculate Velocity
        sessionRef.current.scrollVelocity = absDy / dt; 

        // 2. Determine Direction
        const currentDirection = dy > 0 ? 'down' : (dy < 0 ? 'up' : 'steady');

        // 3. Detect "Confusion" / Re-reading
        // If they were scrolling down, and now scroll UP significantly
        if (
            sessionRef.current.scrollDirection === 'down' && 
            currentDirection === 'up'
        ) {
             // We just switched direction. 
             // Ideally we'd track *how far* they go up, but for now, 
             // let's count significant upward movements.
        }
        
        // Simpler approach for Confusion: 
        // If current direction is UP and they move more than threshold
        if (currentDirection === 'up' && absDy > 10) {
            // We accumulate "upward pixels" in a temporary var if we wanted, 
            // but for this MVP, let's just count sustained upward scrolls.
             // Actually, let's just track major scroll-ups (> 300px) as discrete events?
             // No, let's stick to the plan: simple direction tracking first.
        }

        // REVISED CONFUSION LOGIC:
        // If user scrolls UP more than threshold (e.g. 300px) within a short window, count it.
        // For now, let's just update the direction state so other components can use it.
        sessionRef.current.scrollDirection = currentDirection;
        
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
