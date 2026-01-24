// src/hooks/useActivityTracker.ts
import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';

// Constants
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const ACTIVITY_TIMEOUT = 60000;   // 1 minute idle = inactive
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// FIX: We accept 'any' here to prevent build errors from legacy components
export const useActivityTracker = (rawId?: any, rawType?: any) => {
  const location = useLocation();
  const { isPlaying: isRadioPlaying } = useAudio();
  const { user } = useAuth();

  // SANITIZATION: Only accept strings.
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
    // OPTIMIZATION: Calculate word count once per content load
    cachedWordCount: 0,
    // Interaction Queue for "one-off" events like Copies or Audio Skips
    pendingInteractions: [] as any[]
  });

  // 1. Initialize Session ID (Once per page load)
  useEffect(() => {
    if (!sessionData.current.sessionId) {
      sessionData.current.sessionId = 
        Date.now().toString(36) + Math.random().toString(36).substring(2);
      
      sessionStorage.setItem('current_analytics_session_id', sessionData.current.sessionId);
      console.log('Analytics Session Started:', sessionData.current.sessionId);
    }
    // Reset scroll on mount
    sessionData.current.maxScroll = 0;
  }, []);

  // 2. OPTIMIZATION: Calculate Word Count on Content Change
  useEffect(() => {
    if (contentId && (contentType === 'article' || contentType === 'narrative')) {
        // Run this in a timeout to allow DOM to settle
        setTimeout(() => {
            const text = document.body.innerText || "";
            // Rough estimation: Split by spaces
            sessionData.current.cachedWordCount = text.split(/\s+/).length;
        }, 1000);
    } else {
        sessionData.current.cachedWordCount = 0;
    }
  }, [contentId, contentType]);

  // 3. Helper: The Data Sender
  const sendData = useCallback((isBeacon = false, forceFlush = false) => {
    const now = Date.now();
    const elapsedSeconds = Math.round((now - sessionData.current.lastPingTime) / 1000);
    
    // Only send if active and time has passed (unless forcing a flush)
    if (!forceFlush && (elapsedSeconds <= 0 || !sessionData.current.isActive)) {
        sessionData.current.lastPingTime = now;
        return; 
    }

    // Determine context based on validated arguments first, then URL (Fallback)
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

    // Prepare Interactions
    const interactions = [...sessionData.current.pendingInteractions];
    sessionData.current.pendingInteractions = []; // Clear queue

    // Add current view duration interaction (if valid content)
    if (contentId) {
        interactions.push({
            contentType: contentType || (isArticle ? 'article' : 'narrative'),
            contentId: contentId,
            duration: elapsedSeconds,
            scrollDepth: sessionData.current.maxScroll,
            // USE CACHED VALUE
            wordCount: sessionData.current.cachedWordCount, 
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
            userAgent: navigator.userAgent,
            referrer: document.referrer || 'direct' 
        }
    };

    const endpoint = `${API_URL}/analytics/track`;

    if (isBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
    } else {
        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true 
        }).catch(err => console.warn('Analytics Error', err));
    }

    // Reset clock
    sessionData.current.lastPingTime = now;
  }, [contentId, contentType, isRadioPlaying, user?.uid]);

  // 4. Listeners
  useEffect(() => {
    const handleUserActivity = () => {
        if (!sessionData.current.isActive) {
            sessionData.current.isActive = true;
            sessionData.current.lastPingTime = Date.now(); // Reset clock on resume
        }
        
        if (sessionData.current.idleTimer) clearTimeout(sessionData.current.idleTimer);
        
        sessionData.current.idleTimer = setTimeout(() => {
            sessionData.current.isActive = false;
        }, ACTIVITY_TIMEOUT);
    };

    // Scroll Handler
    const handleScroll = () => {
        handleUserActivity(); 
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
        
        if (scrollPercent > sessionData.current.maxScroll) {
            sessionData.current.maxScroll = scrollPercent;
        }
    };

    // Copy Event Handler
    const handleCopy = () => {
        const selection = window.getSelection()?.toString();
        if (selection && selection.length > 10) {
             const cleanText = selection.substring(0, 200); 
             sessionData.current.pendingInteractions.push({
                 contentType: 'copy',
                 contentId: contentId || 'unknown',
                 text: cleanText,
                 timestamp: new Date()
             });
             sendData(false, true); 
        }
    };

    // Audio Event Handler
    const handleAudioEvent = (e: any) => {
        const { action, articleId } = e.detail;
        sessionData.current.pendingInteractions.push({
            contentType: 'audio_action',
            contentId: articleId,
            audioAction: action,
            timestamp: new Date()
        });
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
  }, [contentId, sendData]);

  // 5. The Heartbeat Interval
  useEffect(() => {
    const interval = setInterval(() => {
        sendData(false);
    }, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [sendData]); 

  // 6. The "Exit Beacon"
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
  }, [sendData]);

  return null; 
};
