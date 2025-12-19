// src/hooks/useNativeFeatures.ts
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation } from '@capacitor/geolocation';
import * as api from '../services/api';
import { useNavigate } from 'react-router-dom';

const useNativeFeatures = (user: any) => {
  const navigate = useNavigate();
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative || !user) return;

    const initNativeFeatures = async () => {
      // 1. PUSH NOTIFICATIONS
      try {
        const permStatus = await PushNotifications.checkPermissions();
        
        if (permStatus.receive === 'prompt') {
          await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
        }

        PushNotifications.addListener('registration', (token) => {
          console.log('Push Registration Token:', token.value);
          api.saveNotificationToken(token.value).catch(err => console.error("Token Save Error", err));
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
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
        const geoPerm = await Geolocation.checkPermissions();
        // Just checking, not forcing yet
      } catch (e) {
        // Ignore
      }
    };

    initNativeFeatures();

    return () => {
      if (isNative) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [isNative, user, navigate]);

  return { isNative };
};

export default useNativeFeatures;
