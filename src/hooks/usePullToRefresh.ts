// src/hooks/usePullToRefresh.ts
import { useEffect, useState, useRef } from 'react';

export const usePullToRefresh = (onRefresh: () => Promise<any>) => {
  const [pullChange, setPullChange] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  
  // Threshold to trigger refresh (in pixels)
  const THRESHOLD = 120;
  // Max pull distance
  const MAX_PULL = 180;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only enable if we are at the VERY top of the page
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 0 || startY.current === 0) return;
      
      currentY.current = e.touches[0].clientY;
      const pullDistance = currentY.current - startY.current;

      if (pullDistance > 0) {
        // Resistance effect (logarithmic)
        const damped = Math.min(pullDistance * 0.5, MAX_PULL);
        setPullChange(damped);
        
        // Prevent browser's native reload
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (pullChange > THRESHOLD && !refreshing) {
        setRefreshing(true);
        setPullChange(60); // Snap to loading position
        
        try {
            // Trigger Haptic if available
            if (navigator.vibrate) navigator.vibrate(50);
            await onRefresh();
        } finally {
            setTimeout(() => {
                setRefreshing(false);
                setPullChange(0);
            }, 500);
        }
      } else {
        setPullChange(0); // Snap back
      }
      startY.current = 0;
      currentY.current = 0;
    };

    // Attach to window to catch pulls anywhere
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullChange, refreshing, onRefresh]);

  return { pullChange, refreshing };
};
