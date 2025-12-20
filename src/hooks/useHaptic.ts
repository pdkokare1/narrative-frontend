// src/hooks/useHaptic.ts
import { useCallback } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// IMPROVEMENT: Define distinct feedback types
type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const useHaptic = () => {
  // New "trigger" accepts a type (defaulting to 'light')
  const trigger = useCallback(async (type: HapticType = 'light') => {
    // Safety check: only run on mobile/native
    if (!Capacitor.isNativePlatform()) {
        // Optional: Web Vibration API fallback for testing on Android Chrome
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            if (type === 'error') navigator.vibrate([50, 50, 50]);
            else if (type === 'success') navigator.vibrate([30, 50]);
            else navigator.vibrate(10);
        }
        return;
    }

    try {
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
      }
    } catch (e) {
      // Fail silently if hardware doesn't support it
    }
  }, []);

  return trigger;
};

export default useHaptic;
