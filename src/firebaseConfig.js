// In file: src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// --- ADD THIS LINE FOR ANALYTICS ---
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration using Environment Variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  // --- ADD THIS LINE FOR ANALYTICS ---
  measurementId: process.env.REACT_APP_MEASUREMENT_ID 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// --- ADD THIS LINE FOR ANALYTICS ---
// Initialize Analytics (optional, but you wanted it)
getAnalytics(app); 

// Export the auth service for use in other files
export const auth = getAuth(app);
