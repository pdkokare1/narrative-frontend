// src/hooks/useActivityTracker.ts
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';

// Constants
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const ACTIVITY_TIMEOUT = 60000;   // 1 minute idle = inactive
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useActivityTracker = () => {
  const location = useLocation();
  const { isPlaying: isRadioPlaying } = useAudio();
  const { user } = useAuth();
  
  // Refs to hold mutable state without triggering re-renders
  const sessionData = useRef({
    sessionId: '',
    accumulatedTime: { total: 0, article: 0, radio: 0, narrative: 0, feed: 0 },
    lastPingTime: Date.now(),
    isActive: true,
    idleTimer: null as any
  });

  // 1. Initialize Session ID (Once per page load)
  useEffect(() => {
    if (!sessionData.current.sessionId) {
      // Simple random ID generation (sufficient for analytics)
      sessionData.current.sessionId = 
        Date.now().toString(36) + Math.random().toString(36).substring(2);
      
      console.log('Analytics Session Started:', sessionData.current.sessionId);
    }
  }, []);

  // 2. Helper: The Data Sender
  const sendData = (isBeacon = false) => {
    const now = Date.now();
    const elapsedSeconds = Math.round((now - sessionData.current.lastPingTime) / 1000);
    
    // Only send if active and time has passed
    if (elapsedSeconds <= 0 || !sessionData.current.isActive) {
        sessionData.current.lastPingTime = now;
        return; 
    }

    // Determine context
    const path = window.location.pathname;
    const isArticle = path.includes('/article/');
    const isNarrative = path.includes('/narrative/');
    const isRadio = isRadioPlaying; // Can be true even if on other pages

    // Prepare Metrics
    const metrics = {
        total: elapsedSeconds,
        article: isArticle ? elapsedSeconds : 0,
        narrative: isNarrative ? elapsedSeconds : 0,
        radio: isRadio ? elapsedSeconds : 0,
        feed: (!isArticle && !isNarrative) ? elapsedSeconds : 0
    };

    const payload = {
        sessionId: sessionData.current.sessionId,
        userId: user?.uid,
        metrics,
        meta: {
            platform: 'web',
            userAgent: navigator.userAgent
        }
    };

    if (isBeacon) {
        // Beacon requires Blob for JSON
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(`${API_URL}/analytics/track`, blob);
    } else {
        // Standard Heartbeat
        fetch(`${API_URL}/analytics/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true // Crucial for reliable background sending
        }).catch(err => console.warn('Analytics Error', err));
    }

    // Reset clock
    sessionData.current.lastPingTime = now;
  };

  // 3. User Activity Listeners (Mouse/Scroll/Touch)
  useEffect(() => {
    const handleUserActivity = () => {
        if (!sessionData.current.isActive) {
            sessionData.current.isActive = true;
            sessionData.current.lastPingTime = Date.now(); // Reset clock on resume
        }
        
        // Reset Idle Timer
        if (sessionData.current.idleTimer) clearTimeout(sessionData.current.idleTimer);
        
        sessionData.current.idleTimer = setTimeout(() => {
            sessionData.current.isActive = false;
        }, ACTIVITY_TIMEOUT);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, handleUserActivity, { passive: true }));

    // Cleanup
    return () => {
        events.forEach(ev => window.removeEventListener(ev, handleUserActivity));
        if (sessionData.current.idleTimer) clearTimeout(sessionData.current.idleTimer);
    };
  }, []);

  // 4. The Heartbeat Interval (Every 30s)
  useEffect(() => {
    const interval = setInterval(() => {
        sendData(false);
    }, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [isRadioPlaying, location.pathname]); // Re-create if context changes to capture new state

  // 5. The "Exit Beacon" (Tab Close / Hide)
  useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            sendData(true); // Send beacon immediately when hiding
        }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    // 'beforeunload' is less reliable on mobile, but good fallback
    window.addEventListener('beforeunload', () => sendData(true));

    return () => {
        window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null; // This hook renders nothing
};
