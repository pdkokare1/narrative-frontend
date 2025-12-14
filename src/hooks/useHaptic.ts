// src/hooks/useHaptic.ts
import { useCallback } from 'react';

const useHaptic = () => {
  const trigger = useCallback(() => {
    // Check if the browser supports vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      // 10ms is a sharp, subtle "click" feeling
      navigator.vibrate(10);
    }
  }, []);

  return trigger;
};

export default useHaptic;
