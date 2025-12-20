// src/Login.tsx
import React, { useEffect, useRef } from 'react';
import { GoogleAuthProvider } from "firebase/auth";
import { auth } from './firebaseConfig';
import * as firebaseui from 'firebaseui'; 
import 'firebaseui/dist/firebaseui.css';  
import './Login.css'; 
import Card from './components/ui/Card';

// --- VISUAL MOSAIC DATA ---
// We use gradients to simulate "News Images" without needing external assets.
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

  // Helper to render a scrolling column with gradient cards
  const renderMosaicColumn = (speedClass: string, reverse: boolean = false) => (
    <div className={`mosaic-column ${speedClass} ${reverse ? 'reverse' : ''}`}>
      {/* Quadruple the list for seamless infinite scroll */}
      {[...GHOST_CARDS, ...GHOST_CARDS, ...GHOST_CARDS, ...GHOST_CARDS].map((item, idx) => (
        <div key={`${speedClass}-${idx}`} className="mosaic-card">
          {/* The "Image" Area */}
          <div className="mosaic-image" style={{ background: item.color }}></div>
          
          {/* Content */}
          <div className="mosaic-content">
            <div className="mosaic-category">{item.category}</div>
            <div className="mosaic-title">{item.title}</div>
            <div className="mosaic-meta">
               <span className="mosaic-pill"></span>
               <span className="mosaic-pill short"></span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="login-page-wrapper">
      
      {/* --- BACKGROUND MOSAIC STREAM --- */}
      <div className="narrative-mosaic-bg">
        <div className="mosaic-overlay-vignette"></div>
        <div className="mosaic-columns">
          {renderMosaicColumn('slow')}
          {renderMosaicColumn('medium', true)} {/* Reverse */}
          {renderMosaicColumn('slow')}
          {renderMosaicColumn('fast', true)}   {/* Extra col for wide screens */}
        </div>
      </div>

      {/* --- FOREGROUND LOGIN CARD --- */}
      <div className="login-container-wrapper">
        {/* Glow Effect behind card */}
        <div className="login-glow"></div>
        
        <div className="login-container">
          <Card variant="glass" padding="lg">
            <div className="login-form-panel" style={{ padding: 0 }}> 
              <h1>The Gamut</h1> 
              <p>Analyze the full spectrum of the narrative.</p>
              <div ref={elementRef} id="firebaseui-auth-container"></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
