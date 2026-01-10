// src/Login.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  signInWithPopup, 
  GoogleAuthProvider, 
  ConfirmationResult 
} from "firebase/auth";
import { auth } from './firebaseConfig';
import { useNavigate } from 'react-router-dom';

// UI Components
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import { useToast } from './context/ToastContext';
import './Login.css';

// --- CONSTANTS ---
const GHOST_CARDS = [
  { category: "POLITICS", title: "Summit Talks: New Climate Agreements Signed", color: "linear-gradient(135deg, #FF6B6B 0%, #EE5D5D 100%)" },
  { category: "TECH", title: "Quantum Leap: Silicon Valley's New Bet", color: "linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)" },
  { category: "MARKETS", title: "Global Trade Shifts as Inflation Cools", color: "linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)" },
  { category: "OPINION", title: "Why the 4-Day Work Week is Inevitable", color: "linear-gradient(135deg, #FA709A 0%, #FEE140 100%)" },
  { category: "SCIENCE", title: "Mars Mission: Phase 2 Funding Secured", color: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)" },
];

const COUNTRY_CODES = [
  { code: '+1', label: 'US/CA (+1)' },
  { code: '+91', label: 'India (+91)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+61', label: 'Aus (+61)' },
  { code: '+81', label: 'Japan (+81)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+86', label: 'China (+86)' },
];

const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const recaptchaRendered = useRef(false);

  // Helper to append logs to screen
  const log = (msg: string) => {
    console.log(`[LOGIN-DEBUG] ${msg}`);
    setDebugLog(prev => [...prev.slice(-4), msg]); // Keep last 5 logs
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch(e) {}
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  // --- HANDLERS ---

  const setupRecaptcha = async () => {
    // 1. Check if already exists
    if (window.recaptchaVerifier) {
       log("Verifier already exists, reusing...");
       return window.recaptchaVerifier;
    }

    log("Initializing NEW Verifier (Visible Mode)...");
    
    try {
      // 2. Create Verifier (Visible 'normal' size)
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal', // VISIBLE CHECKBOX
        'callback': (response: any) => {
          log("ReCAPTCHA Solved by User.");
        },
        'expired-callback': () => {
          log("ReCAPTCHA Expired.");
          addToast("Security check expired. Please check the box again.", 'error');
        }
      });
      
      // 3. Render it explicitly so user can see it
      log("Rendering ReCAPTCHA widget...");
      await verifier.render();
      
      window.recaptchaVerifier = verifier;
      recaptchaRendered.current = true;
      log("Widget Rendered Successfully.");
      
      return verifier;

    } catch (err: any) {
      log(`Setup Error: ${err.message}`);
      console.error("Recaptcha Setup Error:", err);
      throw new Error("Could not load security check.");
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 4) {
        addToast('Please enter a valid phone number.', 'error');
        return;
    }

    setLoading(true);
    setDebugLog([]); // Clear previous logs
    log("Starting Phone Auth Process...");

    try {
      // 1. Prepare Number
      const cleanNumber = phoneNumber.replace(/\D/g, ''); 
      const formattedNumber = `${countryCode}${cleanNumber}`;
      log(`Target Number: ${formattedNumber}`);

      // 2. Ensure Recaptcha is Ready (User might need to click it)
      await setupRecaptcha();

      // 3. Send SMS
      log("Requesting SMS from Firebase...");
      
      // We do NOT timeout here for visible recaptcha, because user needs time to click images
      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, window.recaptchaVerifier);
      
      log("SMS Sent! Confirmation received.");
      setConfirmationResult(confirmation);
      setStep('OTP');
      addToast(`Code sent to ${formattedNumber}`, 'success');

    } catch (error: any) {
      log(`ERROR: ${error.code || error.message}`);
      console.error("SMS Error Full Object:", error);
      
      let msg = 'Failed to send code.';
      if (error.code === 'auth/invalid-phone-number') msg = 'Invalid phone number format.';
      if (error.code === 'auth/quota-exceeded') msg = 'SMS quota exceeded.';
      if (error.code === 'auth/network-request-failed') msg = 'Network error. Check connection.';
      if (error.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
      if (error.message && error.message.includes('authorized domain')) {
        msg = 'Domain not authorized in Firebase Console.';
      }
      
      if (error.code === 'auth/internal-error' || error.message.includes('internal-error')) {
         msg = 'Security configuration error. Reloading page...';
         setTimeout(() => window.location.reload(), 3000);
      }

      addToast(msg, 'error');

      // Reset recaptcha if failed
      if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = undefined;
          recaptchaRendered.current = false;
      }

    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || !confirmationResult) return;
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      addToast('Welcome back.', 'success');
      navigate('/');
    } catch (error) {
      console.error("OTP Error:", error);
      addToast('Invalid code. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      addToast('Successfully signed in with Google.', 'success');
      navigate('/');
    } catch (error: any) {
      addToast(error.message || 'Google sign-in failed.', 'error');
    }
  };

  const handleApplePlaceholder = () => {
    addToast('Apple Sign-In is coming soon.', 'info');
  };

  // --- RENDER HELPERS ---

  const renderGhostColumn = (speedClass: string, reverse: boolean = false) => (
    <div className={`ghost-column ${speedClass} ${reverse ? 'reverse' : ''}`}>
      {[...GHOST_CARDS, ...GHOST_CARDS, ...GHOST_CARDS].map((item, idx) => (
        <div key={`${speedClass}-${idx}`} className="ghost-card">
          <div className="ghost-image" style={{ background: item.color }}></div>
          <div className="ghost-content">
            <div className="ghost-category">{item.category}</div>
            <div className="ghost-title">{item.title}</div>
            <div className="ghost-meta"><span className="ghost-pill"></span></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="login-page-wrapper">
      
      {/* Background Animation */}
      <div className="narrative-stream-bg">
        <div className="stream-vignette"></div>
        <div className="stream-columns">
          {renderGhostColumn('slow')}
          {renderGhostColumn('medium', true)}
          {renderGhostColumn('slow')}
        </div>
      </div>

      {/* Main Login Stage */}
      <div className="login-stage">
        <div className="login-sensor-glow"></div>

        <div className="login-container">
          <Card variant="glass" padding="xl" className="login-card-custom">
            
            <div className="login-header">
                <h1>The Gamut</h1>
                <p>Analyze the full spectrum of the narrative.</p>
            </div>

            {/* STEP 1: PHONE INPUT */}
            {step === 'PHONE' && (
                <div className="login-step fade-in">
                    <div className="input-group" style={{ display: 'flex', gap: '8px' }}>
                        
                        <select 
                          className="login-country-select"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            padding: '0 8px',
                            height: '50px',
                            cursor: 'pointer',
                            outline: 'none',
                            fontSize: '0.9rem'
                          }}
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code} style={{ color: 'black' }}>
                              {c.label}
                            </option>
                          ))}
                        </select>

                        <Input 
                            type="tel" 
                            placeholder="123 456 7890" 
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="login-input-large"
                            style={{ flex: 1 }}
                        />
                    </div>
                    
                    {/* VISIBLE RECAPTCHA CONTAINER */}
                    <div 
                      id="recaptcha-container" 
                      style={{ 
                          margin: '15px 0', 
                          minHeight: '78px', 
                          display: 'flex', 
                          justifyContent: 'center' 
                      }}
                    ></div>

                    <Button 
                        variant="primary" 
                        onClick={handleSendCode} 
                        disabled={loading}
                        className="login-btn-wide"
                    >
                        {loading ? 'Processing...' : 'Get Access Code'}
                    </Button>
                </div>
            )}

            {/* STEP 2: OTP INPUT */}
            {step === 'OTP' && (
                <div className="login-step fade-in">
                    <div className="input-group">
                         <Input 
                            type="text" 
                            placeholder="Enter 6-digit code" 
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="login-input-large text-center"
                            maxLength={6}
                        />
                    </div>
                    <Button 
                        variant="primary" 
                        onClick={handleVerifyOtp} 
                        disabled={loading}
                        className="login-btn-wide"
                    >
                        {loading ? 'Verifying...' : 'Unlock'}
                    </Button>
                    <button 
                        className="text-link-button" 
                        onClick={() => setStep('PHONE')}
                    >
                        Wrong number?
                    </button>
                </div>
            )}

            {/* DIVIDER */}
            <div className="login-divider">
                <span>OR CONTINUE WITH</span>
            </div>

            {/* SOCIAL BUTTONS */}
            <div className="social-row">
                <button className="social-btn google" onClick={handleGoogleLogin}>
                    <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#fff" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                </button>
                
                <button className="social-btn apple" onClick={handleApplePlaceholder}>
                    <svg viewBox="0 0 384 512" width="22" height="22" fill="white">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 46.9 104.3 80.9 102.6 30.6-1.5 42.8-19.8 85.3-19.8 41.7 0 53.3 19.8 84.5 19.8 40 0 56.4-42.9 83.2-100.3-52.1-23.7-73.4-64-73.6-88.3zm-31.4-123c3.4-5.2 7.5-16.3 7.5-28.4 0-20.5-13-37-33.6-37-4.2 0-11.3 3.1-15.3 5.5-9.4 6-17.8 15.4-20 25-3.2 16.7 10.1 36 29.8 36 6.3 0 16.1-3.6 24.2-7.5 4.6-2.2 6.8-3 7.4-3.6z"/>
                    </svg>
                </button>
            </div>

            {/* TEMPORARY DEBUG LOG */}
            <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                background: 'rgba(0,0,0,0.5)', 
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#aaa',
                fontFamily: 'monospace',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ borderBottom: '1px solid #333', marginBottom: '5px' }}>DEBUG LOG:</div>
                {debugLog.length === 0 ? <span>Waiting for input...</span> : debugLog.map((l, i) => <div key={i}>{l}</div>)}
            </div>

          </Card>
        </div>
      </div>
    </div>
  );
};

// Global definition for Recaptcha
declare global {
  interface Window {
    recaptchaVerifier: any;
    grecaptcha: any;
  }
}

export default Login;
