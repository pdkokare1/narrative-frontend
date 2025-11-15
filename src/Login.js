// In file: src/Login.js
import React, { useEffect, useRef } from 'react';
// --- FIX: Removed EmailAuthProvider ---
import { GoogleAuthProvider } from "firebase/auth";
import { auth } from './firebaseConfig';
import * as firebaseui from 'firebaseui'; // Import the official firebaseui library
import 'firebaseui/dist/firebaseui.css';  // Import the required CSS
import './Login.css'; // Your existing login styles

// Configure FirebaseUI.
const uiConfig = {
  // Popup signin flow rather than redirect flow.
  signInFlow: 'popup',
  
  // *** THIS IS THE FIX ***
  // We are now *explicitly* telling FirebaseUI what our main auth domain is.
  // This forces it to use "thegamut.in" and prevents the mismatch loop.
  credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
  credentialHelperUrl: `https://${process.env.REACT_APP_AUTH_DOMAIN}`,
  // *** END OF FIX ***

  // --- FIX: We will display Google as the *only* login option. ---
  signInOptions: [
    GoogleAuthProvider.PROVIDER_ID
    // --- EmailAuthProvider.PROVIDER_ID has been REMOVED ---
  ],
  // Redirect to / after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
  signInSuccessUrl: "/", 
  callbacks: {
    // Avoid redirects after sign-in success. Return false to handle manually.
    signInSuccessWithAuthResult: () => false, 
  },
};

function Login() {
  const elementRef = useRef(null); // This will hold the div for FirebaseUI

  useEffect(() => {
    // Get or create a FirebaseUI instance.
    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);
    
    // Start the FirebaseUI Auth interface if the div is available.
    if (elementRef.current) {
      ui.start(elementRef.current, uiConfig);
    }

    // Cleanup function to run when the component unmounts
    return () => {
      ui.delete();
    };
  }, []); // The empty array means this effect runs only once

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        
        {/* --- Image Panel (visible on desktop) --- */}
        <div className="login-image-panel"></div>

        {/* --- Form Panel (contains original content) --- */}
        <div className="login-form-panel">
          <h1>The Gamut</h1> 
          <p>Please sign in to analyze the full spectrum</p>

          {/* This div is where FirebaseUI will render its login buttons */}
          <div ref={elementRef} id="firebaseui-auth-container"></div>
        </div>
      </div>
    </div>
  );
}

export default Login;
