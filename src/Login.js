import React from 'react';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import { EmailAuthProvider, GoogleAuthProvider } from "firebase/auth";
import { auth } from './firebaseConfig'; // Import our configured auth

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
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      // Use CSS variables from your App.css for background
      backgroundColor: 'var(--bg-primary)' 
    }}>
      <div style={{
        padding: '40px',
        // Use CSS variables for card styling
        backgroundColor: 'var(--bg-secondary)', 
        borderRadius: '12px',
        boxShadow: 'var(--shadow-md)',
        textAlign: 'center',
        maxWidth: '400px', // Optional: constrain width
        width: '90%'
      }}>
        {/* Use CSS variables for text */}
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>The Gamut</h1> 
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Please sign in to continue</p>

        {/* The pre-built FirebaseUI login component */}
        <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
      </div>
    </div>
  );
}

export default Login;
