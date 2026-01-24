// src/hooks/useActivityTracker.ts
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';

// Constants
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const ACTIVITY_TIMEOUT = 60000;   // 1 minute idle = inactive
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// FIX: We accept 'any' here to prevent build errors from legacy components (like UnifiedFeed)
// passing objects/maps. We then sanitize them inside.
export const useActivityTracker = (rawId?: any, rawType?: any) => {
  const location = useLocation();
  const { isPlaying: isRadioPlaying } = useAudio();
  const { user } = useAuth();

  // SANITIZATION: Only accept strings. Ignore Maps/Objects from legacy calls.
  const contentId = (typeof rawId === 'string') ? rawId : undefined;
  const contentType = (typeof rawType === 'string' && ['article', 'narrative', 'feed'].includes(rawType)) 
    ? rawType as 'article' | 'narrative' | 'feed' 
    : undefined;
  
  // Refs to hold mutable state without triggering re-renders
  const sessionData = useRef({
    sessionId: '',
    accumulatedTime: { total: 0, article: 0, radio: 0, narrative: 0, feed: 0 },
    lastPingTime: Date.now(),
    isActive: true,
    idleTimer: null as any,
    maxScroll: 0,
    // NEW: Interaction Queue for "one-off" events like Copies or Audio Skips
    pendingInteractions: [] as any[]
  });

  // 1. Initialize Session ID (Once per page load)
  useEffect(() => {
    if (!sessionData.current.sessionId) {
      sessionData.current.sessionId = 
        Date.now().toString(36) + Math.random().toString(36).substring(2);
      
      console.log('Analytics Session Started:', sessionData.current.sessionId);
    }
    sessionData.current.maxScroll = 0;
  }, []);

  // 2. Helper: The Data Sender
  const sendData = (isBeacon = false, forceFlush = false) => {
    const now = Date.now();
    const elapsedSeconds = Math.round((now - sessionData.current.lastPingTime) / 1000);
    
    // Only send if active and time has passed (unless forcing a flush of interactions)
    if (!forceFlush && (elapsedSeconds <= 0 || !sessionData.current.isActive)) {
        sessionData.current.lastPingTime = now;
        return; 
    }

    // Determine context
    const path = window.location.pathname;
    const isArticle = contentType === 'article' || path.includes('/article/');
    const isNarrative = contentType === 'narrative' || path.includes('/narrative/');
    const isRadio = isRadioPlaying; 
    const isFeed = contentType === 'feed' || (!isArticle && !isNarrative);

    // Prepare Metrics
    const metrics = {
        total: elapsedSeconds,
        article: isArticle ? elapsedSeconds : 0,
        narrative: isNarrative ? elapsedSeconds : 0,
        radio: isRadio ? elapsedSeconds : 0,
        feed: isFeed ? elapsedSeconds : 0
    };

    // Prepare Interactions: Combine the "Time" interaction with any "Pending" events
    const interactions = [...sessionData.current.pendingInteractions];
    
    // Clear pending queue immediately after grabbing them
    sessionData.current.pendingInteractions = [];

    // Add current view duration interaction
    if (contentId) {
        interactions.push({
            contentType: contentType || (isArticle ? 'article' : 'narrative'),
            contentId: contentId,
            duration: elapsedSeconds,
            scrollDepth: sessionData.current.maxScroll,
            timestamp: new Date()
        });
    }

    const payload = {
        sessionId: sessionData.current.sessionId,
        userId: user?.uid,
        metrics,
        interactions, 
        meta: {
            platform: 'web',
            userAgent: navigator.userAgent
        }
    };

    if (isBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(`${API_URL}/analytics/track`, blob);
    } else {
        fetch(`${API_URL}/analytics/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true 
        }).catch(err => console.warn('Analytics Error', err));
    }

    // Reset clock
    sessionData.current.lastPingTime = now;
  };

  // 3. Listeners
  useEffect(() => {
    const handleUserActivity = () => {
        if (!sessionData.current.isActive) {
            sessionData.current.isActive = true;
            sessionData.current.lastPingTime = Date.now(); 
        }
        if (sessionData.current.idleTimer) clearTimeout(sessionData.current.idleTimer);
        sessionData.current.idleTimer = setTimeout(() => {
            sessionData.current.isActive = false;
        }, ACTIVITY_TIMEOUT);
    };

    const handleScroll = () => {
        handleUserActivity();
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
        if (scrollPercent > sessionData.current.maxScroll) {
            sessionData.current.maxScroll = scrollPercent;
        }
    };

    // NEW: Handle Copy Event
    const handleCopy = () => {
        const selection = window.getSelection()?.toString();
        if (selection && selection.length > 10) {
             const cleanText = selection.substring(0, 200); // Truncate
             sessionData.current.pendingInteractions.push({
                 contentType: 'copy',
                 contentId: contentId || 'unknown',
                 text: cleanText,
                 timestamp: new Date()
             });
             // Force flush for immediate capture
             sendData(false, true); 
        }
    };

    // NEW: Handle Audio Events (Dispatched from AudioPlayer)
    const handleAudioEvent = (e: any) => {
        const { action, articleId } = e.detail;
        sessionData.current.pendingInteractions.push({
            contentType: 'audio_action',
            contentId: articleId,
            audioAction: action,
            timestamp: new Date()
        });
        // We don't force flush for audio, let it ride the next heartbeat
    };

    const events = ['mousedown', 'keydown', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, handleUserActivity, { passive: true }));
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('copy', handleCopy); 
    window.addEventListener('narrative-audio-event', handleAudioEvent as EventListener); 

    return () => {
        events.forEach(ev => window.removeEventListener(ev, handleUserActivity));
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('copy', handleCopy);
        window.removeEventListener('narrative-audio-event', handleAudioEvent as EventListener);
        if (sessionData.current.idleTimer) clearTimeout(sessionData.current.idleTimer);
    };
  }, [contentId]); // Re-bind if contentId changes

  // 4. Heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
        sendData(false);
    }, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [isRadioPlaying, location.pathname, contentId]); 

  // 5. Exit Beacon
  useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            sendData(true); 
        }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => sendData(true));
    return () => {
        window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null; 
};
