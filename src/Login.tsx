// src/Login.tsx
import React, { useEffect, useRef } from 'react';
import { GoogleAuthProvider, EmailAuthProvider, PhoneAuthProvider } from "firebase/auth";
import { auth } from './firebaseConfig';
import * as firebaseui from 'firebaseui'; 
import 'firebaseui/dist/firebaseui.css';  
import './Login.css'; 
import Card from './components/ui/Card';
import Button from './components/ui/Button'; 
import { useToast } from './context/ToastContext'; // Using your original context

// --- GHOST DATA ---
const GHOST_CARDS = [
  { category: "POLITICS", title: "Summit Talks: New Climate Agreements Signed", color: "linear-gradient(135deg, #FF6B6B 0%, #EE5D5D 100%)" },
  { category: "TECH", title: "Quantum Leap: Silicon Valley's New Bet", color: "linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)" },
  { category: "MARKETS", title: "Global Trade Shifts as Inflation Cools", color: "linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)" },
  { category: "OPINION", title: "Why the 4-Day Work Week is Inevitable", color: "linear-gradient(135deg, #FA709A 0%, #FEE140 100%)" },
  { category: "SCIENCE", title: "Mars Mission: Phase 2 Funding Secured", color: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)" },
  { category: "CULTURE", title: "Digital Art Renaissance: NFT 2.0", color: "linear-gradient(135deg, #FDA085 0%, #F6D365 100%)" },
  { category: "HEALTH", title: "Breakthrough in Gene Editing Therapy", color: "linear-gradient(135deg, #89F7FE 0%, #66A6FF 100%)" },
  { category: "AUTO", title: "Electric Fleets Take Over Major Cities", color: "linear-gradient(135deg, #0BA360 0%, #3CBA92 100%)" },
  { category: "MEDIA", title: "Streaming Wars: The Consolidation Era", color: "linear-gradient(135deg, #B721FF 0%, #21D4FD 100%)" },
  { category: "AI", title: "Generative Models: Friend or Foe?", color: "linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%)" }
];

// Configure FirebaseUI.
const uiConfig = {
  signInFlow: 'popup',
  credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
  credentialHelperUrl: `https://${import.meta.env.VITE_AUTH_DOMAIN}`,
  signInOptions: [
    // 1. Phone (Priority)
    {
      provider: PhoneAuthProvider.PROVIDER_ID,
      defaultCountry: 'US', 
      recaptchaParameters: {
        type: 'invisible', 
        badge: 'bottomright' 
      }
    },
    // 2. Magic Link (Passwordless Email)
    {
      provider: EmailAuthProvider.PROVIDER_ID,
      signInMethod: EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
      requireDisplayName: true 
    },
    // 3. Google (Backup)
    GoogleAuthProvider.PROVIDER_ID,
    // 4. Guest / Anonymous
    firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
  ],
  signInSuccessUrl: "/", 
  callbacks: {
    signInSuccessWithAuthResult: () => false, 
  },
  tosUrl: '/terms', 
  privacyPolicyUrl: '/privacy'
};

const Login: React.FC = () => {
  const elementRef = useRef<HTMLDivElement>(null); 
  // FIXED: Destructure 'addToast' instead of 'showToast'
  const { addToast } = useToast();

  useEffect(() => {
    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);
    if (elementRef.current) {
      ui.start(elementRef.current, uiConfig);
    }
  }, []);

  const handleAppleClick = () => {
    // FIXED: Use 'addToast' to match your Context API
    addToast('Apple Sign-In is coming soon.', 'info');
  };

  // Helper to render a scrolling column
  const renderGhostColumn = (speedClass: string, reverse: boolean = false) => (
    <div className={`ghost-column ${speedClass} ${reverse ? 'reverse' : ''}`}>
      {[...GHOST_CARDS, ...GHOST_CARDS, ...GHOST_CARDS, ...GHOST_CARDS].map((item, idx) => (
        <div key={`${speedClass}-${idx}`} className="ghost-card">
          <div className="ghost-image" style={{ background: item.color }}></div>
          <div className="ghost-content">
            <div className="ghost-category">{item.category}</div>
            <div className="ghost-title">{item.title}</div>
            <div className="ghost-meta">
               <span className="ghost-pill"></span>
               <span className="ghost-pill short"></span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="login-page-wrapper">
      
      {/* --- BACKGROUND STREAM --- */}
      <div className="narrative-stream-bg">
        <div className="stream-vignette"></div>
        <div className="stream-columns">
          {renderGhostColumn('slow')}
          {renderGhostColumn('medium', true)}
          {renderGhostColumn('slow')}
          {renderGhostColumn('fast', true)}
        </div>
      </div>

      {/* --- FOREGROUND LOGIN --- */}
      <div className="login-stage">
        <div className="login-sensor-glow"></div>

        <div className="login-container">
          {/* Using 'xl' padding - requires the Card update below */}
          <Card variant="glass" padding="xl">
            <div className="login-form-panel" style={{ padding: 0 }}> 
              <h1 style={{ marginBottom: '0.5rem' }}>The Gamut</h1> 
              <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
                Analyze the full spectrum of the narrative.
              </p>
              
              <div ref={elementRef} id="firebaseui-auth-container"></div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                margin: '1.5rem 0', 
                opacity: 0.3 
              }}>
                <div style={{ flex: 1, height: '1px', background: 'currentColor' }}></div>
                <span style={{ padding: '0 10px', fontSize: '0.8rem', letterSpacing: '1px' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'currentColor' }}></div>
              </div>

              <Button 
                variant="secondary" 
                onClick={handleAppleClick}
                style={{ 
                    width: '100%', 
                    maxWidth: '220px', 
                    margin: '0 auto', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'black',
                    color: 'white',
                    border: '1px solid #333'
                }}
              >
                <svg viewBox="0 0 384 512" width="16" height="16" fill="white">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 46.9 104.3 80.9 102.6 30.6-1.5 42.8-19.8 85.3-19.8 41.7 0 53.3 19.8 84.5 19.8 40 0 56.4-42.9 83.2-100.3-52.1-23.7-73.4-64-73.6-88.3zm-31.4-123c3.4-5.2 7.5-16.3 7.5-28.4 0-20.5-13-37-33.6-37-4.2 0-11.3 3.1-15.3 5.5-9.4 6-17.8 15.4-20 25-3.2 16.7 10.1 36 29.8 36 6.3 0 16.1-3.6 24.2-7.5 4.6-2.2 6.8-3 7.4-3.6z"/>
                </svg>
                Sign in with Apple
              </Button>

            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
