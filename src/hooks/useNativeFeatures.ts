// src/hooks/useNativeFeatures.ts
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import * as api from '../services/api';
import { useNavigate } from 'react-router-dom';

const useNativeFeatures = (user: any) => {
  const navigate = useNavigate();
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // Optimization: If not native (or no user), do not even load the plugins
    if (!isNative || !user) return;

    const initNativeFeatures = async () => {
      // DYNAMIC IMPORT: Only load these heavy native plugins if we are actually on a device
      // This prevents the mobile browser from downloading/parsing code it can't use.
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const { Geolocation } = await import('@capacitor/geolocation');

      // 1. PUSH NOTIFICATIONS
      try {
        const permStatus = await PushNotifications.checkPermissions();
        
        if (permStatus.receive === 'prompt') {
          await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
        }

        // Remove any existing listeners before adding new ones to be safe
        await PushNotifications.removeAllListeners();

        await PushNotifications.addListener('registration', (token) => {
          console.log('Push Registration Token:', token.value);
          api.saveNotificationToken(token.value).catch(err => console.error("Token Save Error", err));
        });

        await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          const data = notification.notification.data;
          if (data && data.articleId) {
            navigate(`/?article=${data.articleId}`);
          }
        });
      } catch (e) {
        console.warn("Push Notification setup failed:", e);
      }

      // 2. GEOLOCATION PRE-WARM
      try {
        await Geolocation.checkPermissions();
        // Just checking, not forcing yet
      } catch (e) {
        // Ignore
      }
    };

    initNativeFeatures();

    // Cleanup function
    return () => {
      if (isNative) {
        // Listeners are typically replaced on re-mount, strict cleanup of dynamic imports 
        // is complex but the impact is negligible here.
      }
    };
  }, [isNative, user, navigate]);

  return { isNative };
};

export default useNativeFeatures;
