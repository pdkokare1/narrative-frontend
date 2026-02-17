// src/Login.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  signInWithPopup, 
  GoogleAuthProvider, 
  ConfirmationResult, 
  signInWithCredential 
} from "firebase/auth";
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'; // Native Plugin
import { Capacitor } from '@capacitor/core';
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

const Login: React.FC = () => {
  // 1. Fixed Default to India (+91)
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode] = useState('+91'); 
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null); 
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const recaptchaRendered = useRef(false);

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
    if (window.recaptchaVerifier) return window.recaptchaVerifier;

    try {
      console.log("Initializing Recaptcha...");
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal',
        'callback': (response: any) => {
          console.log("ReCAPTCHA Solved");
          setErrorMsg(null); 
        },
        'expired-callback': () => {
          setErrorMsg("Security check expired. Please check the box again.");
        }
      });
      
      await verifier.render();
      window.recaptchaVerifier = verifier;
      recaptchaRendered.current = true;
      return verifier;

    } catch (err: any) {
      console.error("Recaptcha Setup Error:", err);
      setErrorMsg("Could not load security check. Please refresh.");
      return null;
    }
  };

  const handleSendCode = async () => {
    setErrorMsg(null);

    if (!phoneNumber || phoneNumber.length < 4) {
        setErrorMsg('Please enter a valid phone number.');
        return;
    }

    setLoading(true);

    try {
      const cleanNumber = phoneNumber.replace(/\D/g, ''); 
      const formattedNumber = `${countryCode}${cleanNumber}`;
      console.log("Sending to:", formattedNumber);

      const verifier = await setupRecaptcha();
      if (!verifier) throw new Error("Security check failed to load.");

      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, window.recaptchaVerifier);
      
      setConfirmationResult(confirmation);
      setStep('OTP');
      addToast(`Code sent to ${formattedNumber}`, 'success');

    } catch (error: any) {
      console.error("SMS Error:", error);
      
      let msg = 'Failed to send code.';
      if (error.code === 'auth/invalid-phone-number') msg = 'Invalid phone number format.';
      if (error.code === 'auth/quota-exceeded') msg = 'SMS quota exceeded for this project.';
      if (error.code === 'auth/billing-not-enabled') msg = 'Billing is not enabled in Firebase Console.';
      if (error.code === 'auth/network-request-failed') msg = 'Network error. Check connection.';
      if (error.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
      if (error.code === 'auth/app-not-authorized' || (error.message && error.message.includes('domain'))) {
        msg = 'Domain not authorized in Firebase Console.';
      }
      
      const debugMsg = `${msg} (${error.code || 'Unknown Error'})`;
      setErrorMsg(debugMsg);
      addToast(debugMsg, 'error');

      if (error.code === 'auth/internal-error') {
         if (window.recaptchaVerifier) {
             window.recaptchaVerifier.clear();
             window.recaptchaVerifier = undefined;
         }
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
      setErrorMsg('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log("👉 Google Login Clicked!"); 
    setErrorMsg(null);
    setLoading(true);
    
    try {
      // 1. NATIVE MODE (Capacitor)
      if (Capacitor.isNativePlatform()) {
          console.log("📱 Native Platform detected. Using Capacitor Plugin.");
          
          // A. Perform Native Sign-In (No Redirects)
          const result = await FirebaseAuthentication.signInWithGoogle();
          
          // B. Create Credential from ID Token
          const credential = GoogleAuthProvider.credential(result.credential?.idToken);
          
          // C. Sign In to Firebase JS SDK (Updates AuthContext)
          await signInWithCredential(auth, credential);
          
      } else {
          // 2. WEB/PWA MODE
          console.log("💻 Web Platform detected. Using Popup.");
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await signInWithPopup(auth, provider);
      }
      
      console.log("✅ Google Sign-In Success");
      addToast('Successfully signed in with Google.', 'success');
      navigate('/');

    } catch (error: any) {
      console.error("❌ Google Auth Error:", error);
      
      let msg = 'Google sign-in failed.';
      const errorCode = error.code || 'unknown';
      
      if (errorCode === 'auth/popup-blocked') msg = 'Popup blocked.';
      if (errorCode === 'auth/popup-closed-by-user') msg = 'Sign-in cancelled.';
      if (errorCode === 'auth/unauthorized-domain') msg = 'Domain not authorized (Add localhost to Firebase).';
      if (errorCode === 'auth/operation-not-supported-in-this-environment') msg = 'Popup not supported on Android.';
      
      // CRITICAL UPDATE: We removed the "SHA-1 Missing" hint here.
      // Now we display the RAW error so we can debug.
      const fullError = `NATIVE ERROR: ${error.message} (Code: ${errorCode})`;
      
      setErrorMsg(fullError);
      addToast(`Login Failed: ${errorCode}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplePlaceholder = () => {
    addToast('Apple Sign-In is coming soon.', 'info');
  };

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
      
      <div className="narrative-stream-bg">
        <div className="stream-vignette"></div>
        <div className="stream-columns">
          {renderGhostColumn('slow')}
          {renderGhostColumn('medium', true)}
          {renderGhostColumn('slow')}
        </div>
      </div>

      <div className="login-stage">
        <div className="login-sensor-glow"></div>

        <div className="login-container">
          <Card variant="glass" padding="xl" className="login-card-custom">
            
            <div className="login-header">
                <h1>The Gamut</h1>
                <p>Analyze the full spectrum of the narrative.</p>
            </div>
            
            {errorMsg && (
                <div style={{ 
                    background: 'rgba(255, 50, 50, 0.15)', 
                    border: '1px solid #ff6b6b', 
                    borderRadius: '8px', 
                    padding: '10px', 
                    marginBottom: '16px',
                    color: '#ff9b9b', 
                    fontSize: '0.85rem', 
                    textAlign: 'center',
                    wordBreak: 'break-word' // Ensure long error codes don't break layout
                }}>
                    {errorMsg}
                </div>
            )}

            {step === 'PHONE' && (
                <div className="login-step fade-in">
                    <div className="input-group" style={{ display: 'flex', gap: '8px' }}>
                        
                        {/* UPDATED: Input takes full width with placeholder centered by CSS */}
                        {/* Removed flex: 1 as wrapper is now 100% width via CSS */}
                        <Input 
                            type="tel" 
                            placeholder="Phone Number (+91)" 
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="login-input-large"
                        />
                    </div>

                    <Button 
                        variant="primary" 
                        onClick={handleSendCode} 
                        disabled={loading}
                        className="login-btn-wide"
                        style={{ marginTop: '16px' }}
                    >
                        {/* UPDATED: Changed Button Text */}
                        {loading ? 'Processing...' : 'Get One Time Password'}
                    </Button>
                </div>
            )}

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
                        onClick={() => {
                            setStep('PHONE');
                            setErrorMsg(null);
                        }}
                    >
                        Wrong number?
                    </button>
                </div>
            )}

            <div className="login-divider">
                <span>OR CONTINUE WITH</span>
            </div>

            <div className="social-row">
                <button className="social-btn google" onClick={handleGoogleLogin} disabled={loading}>
                    <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#fff" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                </button>
                
                <button className="social-btn apple" onClick={handleApplePlaceholder}>
                    {/* UPDATED: New Apple SVG Icon */}
                    <svg viewBox="0 0 50 50" width="24" height="24" fill="white">
                      <path d="M 44.527344 34.75 C 43.449219 37.144531 42.929688 38.214844 41.542969 40.328125 C 39.601563 43.28125 36.863281 46.96875 33.480469 46.992188 C 30.46875 47.019531 29.691406 45.027344 25.601563 45.0625 C 21.515625 45.082031 20.664063 47.03125 17.648438 47 C 14.261719 46.96875 11.671875 43.648438 9.730469 40.699219 C 4.300781 32.429688 3.726563 22.734375 7.082031 17.578125 C 9.457031 13.921875 13.210938 11.773438 16.738281 11.773438 C 20.332031 11.773438 22.589844 13.746094 25.558594 13.746094 C 28.441406 13.746094 30.195313 11.769531 34.351563 11.769531 C 37.492188 11.769531 40.8125 13.480469 43.1875 16.433594 C 35.421875 20.691406 36.683594 31.78125 44.527344 34.75 Z M 31.195313 8.46875 C 32.707031 6.527344 33.855469 3.789063 33.4375 1 C 30.972656 1.167969 28.089844 2.742188 26.40625 4.78125 C 24.878906 6.640625 23.613281 9.398438 24.105469 12.066406 C 26.796875 12.152344 29.582031 10.546875 31.195313 8.46875 Z"/>
                    </svg>
                </button>
            </div>

            <div 
              id="recaptcha-container" 
              style={{ 
                  margin: '16px auto', 
                  display: step === 'PHONE' ? 'flex' : 'none', 
                  justifyContent: 'center',
                  minHeight: '78px'
              }}
            ></div>

          </Card>
        </div>
      </div>
    </div>
  );
};

declare global {
  interface Window {
    recaptchaVerifier: any;
    grecaptcha: any;
  }
}

export default Login;
