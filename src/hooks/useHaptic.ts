// src/hooks/useHaptic.ts
import { useCallback } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const useHaptic = () => {
  const trigger = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(10);
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }, []);

  return trigger;
};

export default useHaptic;
}
