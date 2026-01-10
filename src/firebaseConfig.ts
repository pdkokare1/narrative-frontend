// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// import { initializeAppCheck, ReCaptchaV3Provider, onTokenChanged } from "firebase/app-check"; // DISABLED FOR DEBUGGING
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics
if (typeof window !== 'undefined') {
  getAnalytics(app);
}

// Initialize Messaging
let messaging: any;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (err) {
  console.warn("Firebase Messaging failed to initialize:", err);
}

// App Check Logic - TEMPORARILY DISABLED
// We are disabling this to isolate if App Check is blocking the SMS verification.
let appCheck: any;
export const appCheckReady = new Promise<void>((resolve) => {
    // RESOLVE IMMEDIATELY WITHOUT LOADING APP CHECK
    console.log("App Check temporarily disabled for debugging.");
    resolve();

  /* // ORIGINAL CODE - KEEPING FOR RESTORATION LATER
  if (typeof window !== 'undefined') {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (siteKey) {
      try {
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
        console.warn("App Check failed:", e);
        resolve();
      }
    } else {
      console.warn("App Check: Site Key missing.");
      resolve(); 
    }
  } else {
    resolve(); 
  }
  */
});

export const auth = getAuth(app);
export { appCheck, messaging };
