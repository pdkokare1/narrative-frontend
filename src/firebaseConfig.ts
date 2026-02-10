// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth, Auth, indexedDBLocalPersistence, initializeAuth } from "firebase/auth";
import { getAnalytics, Analytics } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider, onTokenChanged, AppCheck } from "firebase/app-check";
import { getMessaging, Messaging } from "firebase/messaging";
import { Capacitor } from "@capacitor/core";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID 
};

// Explicitly define types to allow export even if init fails
let app: any;
let auth: Auth;
let analytics: Analytics | undefined;
let messaging: Messaging | undefined;
let appCheck: AppCheck | undefined;

// --- SAFE INITIALIZATION ---
try {
    // Check for critical keys to avoid hard crashes inside SDK
    if (!firebaseConfig.apiKey) {
        throw new Error("Missing VITE_API_KEY. Check your .env file or build configuration.");
    }

    app = initializeApp(firebaseConfig);

    // FIX: Use IndexedDB persistence on Mobile to prevent session loss
    if (Capacitor.isNativePlatform()) {
        auth = initializeAuth(app, {
            persistence: indexedDBLocalPersistence
        });
    } else {
        auth = getAuth(app);
    }

    // Initialize Analytics
    if (typeof window !== 'undefined') {
        analytics = getAnalytics(app);
    }

    // Initialize Messaging
    try {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            messaging = getMessaging(app);
        }
    } catch (err) {
        console.warn("Firebase Messaging failed to initialize:", err);
    }

} catch (error) {
    console.error("🔥 CRITICAL: Firebase Initialization Failed.", error);
}

// App Check Logic
export const appCheckReady = new Promise<void>((resolve) => {
  if (typeof window !== 'undefined' && app) {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (siteKey) {
      try {
        console.log("Initializing App Check...");
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true 
        });
        
        const unsubscribe = onTokenChanged(appCheck, (token: any) => {
          if (token) {
            console.log("App Check token received.");
            resolve(); 
            unsubscribe(); 
          }
        });
      } catch (e) {
        console.warn("App Check initialization failed:", e);
        resolve();
      }
    } else {
      console.warn("App Check: VITE_RECAPTCHA_SITE_KEY is missing in .env");
      resolve(); 
    }
  } else {
    resolve(); 
  }
});

// Export 'auth' (might be undefined if crash occurred, handled in consumers)
export { auth, app, appCheck, messaging, analytics };
