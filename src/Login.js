// In file: src/Login.js
import React, { useEffect, useRef } from 'react';
import { EmailAuthProvider, GoogleAuthProvider } from "firebase/auth";
import { auth } from './firebaseConfig';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import './Login.css';

// Configure FirebaseUI.
const uiConfig = {
  signInFlow: 'popup',
  
  // *** THIS IS THE FIX ***
  // We are hard-coding the auth domain to match firebaseConfig.js
  credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
  credentialHelperUrl: "https://www.thegamut.in", // <-- HARD-CODED THE "WWW" DOMAIN
  // *** END OF FIX ***

  signInOptions: [
    GoogleAuthProvider.PROVIDER_ID,
    EmailAuthProvider.PROVIDER_ID
  ],
  signInSuccessUrl: "/", 
  callbacks: {
    signInSuccessWithAuthResult: () => false, 
  },
};

function Login() {
  const elementRef = useRef(null);

  useEffect(() => {
    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);
    
    if (elementRef.current) {
      ui.start(elementRef.current, uiConfig);
    }

    return () => {
      ui.delete();
    };
  }, []);

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        
        <div className="login-image-panel"></div>

        <div className="login-form-panel">
          <h1>The Gamut</h1> 
          <p>Please sign in to analyze the full spectrum</p>
          <div ref={elementRef} id="firebaseui-auth-container"></div>
        </div>
      </div>
    </div>
  );
}

export default Login;
