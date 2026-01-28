// src/hooks/analytics/useScrollTracking.ts
import { useEffect, useCallback, MutableRefObject, useRef } from 'react';
import { SessionData, ANALYTICS_CONFIG } from '../../config/analyticsConfig';

export const useScrollTracking = (
  sessionRef: MutableRefObject<SessionData>,
  handleUserActivity: () => void
) => {
  
  // OPTIMIZATION: We use a ref to track the animation frame ID so we can cancel it on unmount
  const rAFRef = useRef<number | null>(null);
  
  // OPTIMIZATION: Local ref to track frame-by-frame changes to avoid redundant checks
  const prevFrameScrollTop = useRef(window.scrollY);

  // 1. Lightweight Activity Listener
  // We keep this separate from the math loop to ensure we catch "Human Presence"
  // instantly, keeping the session alive without doing heavy math on the main thread.
  const onScrollActivity = useCallback(() => {
    handleUserActivity(); 
  }, [handleUserActivity]);

  useEffect(() => {
    // 2. The Math Loop (Runs at 60fps / Screen Refresh Rate)
    const loop = () => {
      const scrollTop = window.scrollY;
      
      // Only run calculation logic if the scroll position has actually changed
      if (scrollTop !== prevFrameScrollTop.current) {
          
          const now = Date.now();
          const dt = now - sessionRef.current.lastScrollTime;
          
          // Logic Preservation: The original code had a throttle of 50ms.
          // We keep this check to ensure velocity is calculated over a meaningful delta.
          if (dt > 50) { 
              const dy = scrollTop - sessionRef.current.lastScrollTop; // Signed diff
              const absDy = Math.abs(dy);
              
              // A. Calculate Velocity
              const currentVelocity = absDy / dt; 
              sessionRef.current.scrollVelocity = currentVelocity;

              // NEW: Update Running Average (Cognitive Load Input)
              // Only count velocities that are "Reading speed" or "Scanning speed", 
              // ignoring near-zero jitter or massive jumps (page up/down keys).
              // We filter out super-fast jumps (>5 px/ms) which are usually navigation/Find-in-page
              if (currentVelocity > 0 && currentVelocity < 5.0) {
                 const n = sessionRef.current.velocitySamples || 0;
                 const avg = sessionRef.current.avgVelocity || 0;
                 
                 // Cumulative Moving Average
                 sessionRef.current.avgVelocity = (avg * n + currentVelocity) / (n + 1);
                 sessionRef.current.velocitySamples = n + 1;
              }

              // B. Determine Direction & Confusion
              const docHeight = document.documentElement.scrollHeight - window.innerHeight;
              const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

              if (dy < 0) {
                  // SCROLLING UP (Reading back / Confusion)
                  sessionRef.current.scrollDirection = 'up';
                  
                  // NEW: "Reference vs Confusion" Logic
                  // If user is deep in the article (>30%), scrolling up is likely checking a reference.
                  // If user is near the top (<30%), scrolling up is likely "Bailing" or confusion.
                  if (scrollPercent < ANALYTICS_CONFIG.CONFUSION.REFERENCE_DEPTH_THRESHOLD) {
                      sessionRef.current.tempUpScroll += absDy;

                      // Threshold Check
                      if (sessionRef.current.tempUpScroll > ANALYTICS_CONFIG.CONFUSION.SCROLL_UP_THRESHOLD) {
                          sessionRef.current.confusionCount += 1;
                          sessionRef.current.tempUpScroll = 0; // Reset after counting one event
                      }
                  } else {
                      // Reset tempUpScroll if they are deep in the article (valid referencing)
                      sessionRef.current.tempUpScroll = 0;
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
              
              // C. Max Scroll Depth 
              // (Moved here to use the scrollPercent calculated above)
              if (scrollPercent > sessionRef.current.maxScroll) {
                  sessionRef.current.maxScroll = scrollPercent;
              }
          }

          // Update local tracker for the loop
          prevFrameScrollTop.current = scrollTop;
      }

      // Schedule next frame
      rAFRef.current = requestAnimationFrame(loop);
    };

    // Start the loop
    rAFRef.current = requestAnimationFrame(loop);

    // Attach the lightweight listener for activity tracking
    window.addEventListener('scroll', onScrollActivity, { passive: true });

    return () => {
        if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
        window.removeEventListener('scroll', onScrollActivity);
    };
  }, [onScrollActivity]); 
};
