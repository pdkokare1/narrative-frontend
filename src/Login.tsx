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

// --- VISUAL ASSETS ---
const GHOST_CARDS = [
  { category: "POLITICS", title: "Summit Talks: New Climate Agreements Signed", color: "linear-gradient(135deg, #FF6B6B 0%, #EE5D5D 100%)" },
  { category: "TECH", title: "Quantum Leap: Silicon Valley's New Bet", color: "linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)" },
  { category: "MARKETS", title: "Global Trade Shifts as Inflation Cools", color: "linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)" },
  { category: "OPINION", title: "Why the 4-Day Work Week is Inevitable", color: "linear-gradient(135deg, #FA709A 0%, #FEE140 100%)" },
  { category: "SCIENCE", title: "Mars Mission: Phase 2 Funding Secured", color: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)" },
];

const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Initialize Invisible Recaptcha on Mount
  useEffect(() => {
    // 1. Cleanup any existing verifier to prevent "Already Rendered" error
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.warn("Cleanup warning:", e);
      }
      window.recaptchaVerifier = undefined;
    }

    // 2. Clear the DOM container manually
    const container = document.getElementById('recaptcha-container');
    if (container) container.innerHTML = '';

    // 3. Initialize new verifier
    try {
      console.log("Initializing RecaptchaVerifier...");
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          console.log("Recaptcha SOLVED automatically via invisible check.");
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          console.warn("Recaptcha Expired");
          addToast('Security check expired. Please try again.', 'error');
        }
      });
    } catch (error) {
      console.error("Recaptcha Init Failed:", error);
    }
    
    return () => {
        // Cleanup on unmount
        if (window.recaptchaVerifier) {
            try { window.recaptchaVerifier.clear(); } catch(e) {}
        }
    };
  }, []);

  // --- HANDLERS ---

  const handleSendCode = async () => {
    console.log("Attempting to send code to:", phoneNumber);

    if (!phoneNumber || phoneNumber.length < 8) {
        addToast('Please enter a valid phone number.', 'error');
        return;
    }

    if (!window.recaptchaVerifier) {
        console.error("Verifier is NULL. Reloading page...");
        addToast('Security check missing. Reloading...', 'error');
        window.location.reload();
        return;
    }

    setLoading(true);

    try {
      // FIX: Manually format to international standard if user forgot '+'
      // Assuming US (+1) default if no code provided, adjustable logic
      let formattedNumber = phoneNumber.trim();
      if (!formattedNumber.startsWith('+')) {
         // Default to +1 for US/Canada if missing, or prompt user.
         // You can change this to your target region.
         formattedNumber = `+1${formattedNumber.replace(/\D/g, '')}`; 
      }
      
      console.log("Formatted Number:", formattedNumber);
      
      // FIX: Force render to ensure widget is active
      try {
          await window.recaptchaVerifier.render();
      } catch (renderError) {
          // Ignore "already rendered" errors, that is good.
          console.log("Verifier render status:", renderError);
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, window.recaptchaVerifier);
      
      console.log("SMS Sent Successfully. Confirmation Obj:", confirmation);
      setConfirmationResult(confirmation);
      setStep('OTP');
      addToast('Secure access code sent.', 'success');

    } catch (error: any) {
      console.error("CRITICAL SMS ERROR:", error);
      
      let msg = 'Failed to send code.';
      if (error.code === 'auth/invalid-phone-number') msg = 'Invalid phone number format. Use +1 555-555-5555';
      if (error.code === 'auth/quota-exceeded') msg = 'SMS quota exceeded. Try again later.';
      if (error.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
      if (error.code === 'auth/network-request-failed') msg = 'Network error. Check connection.';
      // Catch App Check / Domain errors
      if (error.message && error.message.includes('authorized domain')) {
        msg = 'Domain not authorized in Firebase Console.';
      }

      addToast(msg, 'error');
      
      // Reset captcha so they can try again
      if (window.recaptchaVerifier) {
          // Use 'grecaptcha' global to reset if available
          try {
             const widgetId = await window.recaptchaVerifier.render();
             window.grecaptcha.reset(widgetId);
          } catch(e) {}
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

            {/* Hidden Recaptcha Container - VITAL for Phone Auth */}
            <div id="recaptcha-container"></div>

            {/* STEP 1: PHONE INPUT */}
            {step === 'PHONE' && (
                <div className="login-step fade-in">
                    <div className="input-group">
                        <Input 
                            type="tel" 
                            placeholder="(555) 123-4567" 
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
                    >
                        {loading ? 'Sending Security Code...' : 'Get Access Code'}
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
                {/* Google Button */}
                <button className="social-btn google" onClick={handleGoogleLogin}>
                    <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#fff" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                </button>
                
                {/* Apple Button */}
                <button className="social-btn apple" onClick={handleApplePlaceholder}>
                    <svg viewBox="0 0 512 512" width="22" height="22" fill="white">
                      <path d="M349.13 136.86c-40.32 0-57.36 19.24-85.44 19.24-35.96 0-57.92-19.1-92.86-19.1-34.2 0-70.67 20.88-93.83 56.45-32.52 50.16-27 144.63 25.67 225.11 18.84 28.81 44 61.12 77 61.47h.6c28.68 0 33.48-18.47 62.72-18.47 28.92 0 33.72 18.47 62.72 18.47h.48c33.24-.35 59-33.51 77-61.47 18.72-29.28 26.52-52.68 26.64-53.76-.24-.24-51.24-19.68-51.24-78 0-48.84 40.2-72.36 41.64-73.2-22.92-33.24-58.44-36.96-70.8-37.56z M314 105.86c18.36-22.32 30.6-53.16 27.24-84.12-26.28 1.08-57.96 17.52-76.8 39.72-16.92 19.56-31.56 50.88-27.6 81.36 29.28 2.28 58.8-14.76 77.16-36.96z"/>
                    </svg>
                </button>
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
