// src/Login.tsx
import React, { useEffect, useRef } from 'react';
import { GoogleAuthProvider } from "firebase/auth";
import { auth } from './firebaseConfig';
import * as firebaseui from 'firebaseui'; 
import 'firebaseui/dist/firebaseui.css';  
import './Login.css'; 
import Card from './components/ui/Card'; // New Component

// Configure FirebaseUI.
const uiConfig = {
  signInFlow: 'popup',
  credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
  credentialHelperUrl: `https://${process.env.REACT_APP_AUTH_DOMAIN}`,
  signInOptions: [
    GoogleAuthProvider.PROVIDER_ID
  ],
  signInSuccessUrl: "/", 
  callbacks: {
    signInSuccessWithAuthResult: () => false, 
  },
};

const Login: React.FC = () => {
  const elementRef = useRef<HTMLDivElement>(null); 

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
        <Card variant="glass" padding="lg">
          <div className="login-form-panel" style={{ padding: 0 }}> 
            <h1>The Gamut</h1> 
            <p>Please sign in to analyze the full spectrum</p>
            <div ref={elementRef} id="firebaseui-auth-container"></div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
