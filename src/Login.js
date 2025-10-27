import React from 'react';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import { EmailAuthProvider, GoogleAuthProvider } from "firebase/auth";
import { auth } from './firebaseConfig'; 
import './Login.css'; 

// --- 1. IMPORT THE IMAGES ---
import bgMobile from './login-bg-mobile.png';
import bgDesktop from './login-bg-desktop.png';


// Configure FirebaseUI.
const uiConfig = {
  // Popup signin flow rather than redirect flow.
  signInFlow: 'popup',
  // We will display Google and Email as login options.
  signInOptions: [
    GoogleAuthProvider.PROVIDER_ID,
    EmailAuthProvider.PROVIDER_ID
  ],
  // Redirect to / after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
  signInSuccessUrl: "/", 
  callbacks: {
    // Avoid redirects after sign-in success. Return false to handle manually.
    signInSuccessWithAuthResult: () => false, 
  },
};

function Login() {
  // --- 2. CREATE A STYLE OBJECT WITH CSS VARIABLES ---
  const wrapperStyle = {
    '--bg-image-mobile': `url(${bgMobile})`,
    '--bg-image-desktop': `url(${bgDesktop})`,
  };

  return (
    // --- 3. APPLY THE STYLE TO THE WRAPPER ---
    <div className="login-page-wrapper" style={wrapperStyle}>
      <div className="login-container">
        
        {/* --- NEW: Image Panel (visible on desktop) --- */}
        <div className="login-image-panel"></div>

        {/* --- NEW: Form Panel (contains original content) --- */}
        <div className="login-form-panel">
          <h1>The Gamut</h1> 
          <p>Please sign in to analyze the full spectrum</p>

          {/* The pre-built FirebaseUI login component */}
          <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
        </div>
      </div>
    </div>
  );
}

export default Login;
