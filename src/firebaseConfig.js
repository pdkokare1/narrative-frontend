// In file: src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider, onTokenChanged } from "firebase/app-check"; 
// --- NEW: Import Messaging ---
import { getMessaging } from "firebase/messaging"; 

// Your web app's Firebase configuration using Environment Variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics
getAnalytics(app); 

// --- Initialize Messaging ---
let messaging;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (err) {
  console.warn("Firebase Messaging failed to initialize:", err);
}

// App Check Logic
let appCheck;
const appCheckReady = new Promise((resolve) => {
  if (typeof window !== 'undefined') {
    const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
    if (siteKey) {
      try {
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true 
        });
        
        const unsubscribe = onTokenChanged(appCheck, (token) => {
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
});

// Export services
export const auth = getAuth(app);
export { appCheck, appCheckReady, messaging };
