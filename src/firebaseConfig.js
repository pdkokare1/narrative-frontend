// In file: src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// --- 1. IMPORT APP CHECK ---
import { initializeAppCheck, ReCaptchaV3Provider, onTokenChanged } from "firebase/app-check"; // <-- ADD onTokenChanged

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

// Declare appCheck so it can be exported
let appCheck;

// --- *** THIS IS THE FIX (v3) *** ---
// Create a promise that resolves when App Check has its first token.
// This is the "signal" we will wait for in App.js.
const appCheckReady = new Promise((resolve) => {
  if (typeof window !== 'undefined') {
    const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
    if (siteKey) {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true 
      });
      
      // Listen for the first token
      const unsubscribe = onTokenChanged(appCheck, (token) => {
        if (token) {
          console.log("App Check token received, signaling ready.");
          resolve(); // The signal is "go"!
          unsubscribe(); // Stop listening, we only needed the first one.
        }
      });
    } else {
      console.error("App Check: REACT_APP_RECAPTCHA_SITE_KEY is not set.");
      resolve(); // Resolve anyway so the app doesn't hang
    }
  } else {
    resolve(); // Resolve for non-browser environments
  }
});
// --- *** END OF FIX *** ---


// Initialize Analytics (your existing code)
getAnalytics(app); 

// Export the auth service for use in other files
export const auth = getAuth(app);

// Export the appCheck service AND our new "ready" signal
export { appCheck, appCheckReady };
