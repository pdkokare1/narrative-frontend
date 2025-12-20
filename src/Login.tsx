// src/Login.tsx
import React, { useEffect, useRef } from 'react';
import { GoogleAuthProvider } from "firebase/auth";
import { auth } from './firebaseConfig';
import * as firebaseui from 'firebaseui'; 
import 'firebaseui/dist/firebaseui.css';  
import './Login.css'; 
import Card from './components/ui/Card';

// --- GHOST DATA FOR BACKGROUND ANIMATION ---
const GHOST_HEADLINES = [
  { category: "POLITICS", title: "Global Summit 2025: Leaders Address Climate Policy" },
  { category: "TECH", title: "Quantum Computing Breakthrough Shocks Silicon Valley" },
  { category: "FINANCE", title: "Market Rally Continues as Inflation Data Stabilizes" },
  { category: "HEALTH", title: "New Vaccine Protocols Approved by WHO" },
  { category: "SPACE", title: "Mars Colony Project: Phase 2 Funding Secured" },
  { category: "ENERGY", title: "Fusion Power: Commercial Viability by 2030?" },
  { category: "CULTURE", title: "Digital Art Sales Surpass Traditional Auction Houses" },
  { category: "SCIENCE", title: "Ocean Cleanup Project Announces 90% Efficiency" },
  { category: "AUTO", title: "EV Adoption Rates Hit All-Time High in Europe" },
  { category: "AI", title: "Generative Models: The Next Frontier in Education" },
  { category: "ECONOMY", title: "Central Banks Signal Interest Rate Cuts" },
  { category: "SPORT", title: "Unified League Championship Sets Viewership Record" }
];

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

  // Helper to render a scrolling column
  const renderGhostColumn = (speedClass: string, reverse: boolean = false) => (
    <div className={`ghost-column ${speedClass} ${reverse ? 'reverse' : ''}`}>
      {/* Triple the list to ensure smooth infinite scroll without gaps */}
      {[...GHOST_HEADLINES, ...GHOST_HEADLINES, ...GHOST_HEADLINES].map((item, idx) => (
        <div key={`${speedClass}-${idx}`} className="ghost-card">
          <div className="ghost-category">{item.category}</div>
          <div className="ghost-title">{item.title}</div>
          <div className="ghost-lines">
            <span style={{ width: '80%' }}></span>
            <span style={{ width: '60%' }}></span>
            <span style={{ width: '40%' }}></span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="login-page-wrapper">
      
      {/* --- BACKGROUND STREAM --- */}
      <div className="narrative-stream-bg">
        <div className="stream-overlay"></div> {/* Gradient Fade */}
        <div className="stream-columns">
          {renderGhostColumn('slow')}
          {renderGhostColumn('medium', true)} {/* Reverse direction */}
          {renderGhostColumn('slow')}
          {renderGhostColumn('fast', true)} {/* Visible on wide screens */}
        </div>
      </div>

      {/* --- FOREGROUND LOGIN CARD --- */}
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
