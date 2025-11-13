// In file: src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// --- 1. IMPORT APP CHECK ---
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

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

// --- *** THIS IS THE FIX *** ---
// 1. Declare appCheck so it can be exported
let appCheck;
// --- *** END OF FIX *** ---

// --- 2. INITIALIZE APP CHECK (THE NEW CODE) ---
// This code only runs in the browser
if (typeof window !== 'undefined') {
  
  // Get the Site Key from your Environment Variable
  // IMPORTANT: You must create this variable in Vercel
  const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

  if (siteKey) {
    // --- *** THIS IS THE FIX *** ---
    // 2. Assign the initialized service to the appCheck variable
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true // Keep this true
    });
    // --- *** END OF FIX *** ---
  } else {
    console.error("App Check: REACT_APP_RECAPTCHA_SITE_KEY is not set.");
  }
}
// --- END OF APP CHECK CODE ---

// Initialize Analytics (your existing code)
getAnalytics(app); 

// Export the auth service for use in other files
export const auth = getAuth(app);

// --- *** THIS IS THE FIX *** ---
// 3. Export the appCheck service
export { appCheck };
// --- *** END OF FIX *** ---
