// src/hooks/useActivityTracker.ts
import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';

// Constants
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const SAMPLING_INTERVAL = 1000;   // 1 second (High res sampling)
const ACTIVITY_TIMEOUT = 60000;   // 1 minute idle = inactive
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useActivityTracker = (rawId?: any, rawType?: any) => {
  const location = useLocation();
  const { isPlaying: isRadioPlaying } = useAudio();
  const { user } = useAuth();

  // SANITIZATION
  const contentId = (typeof rawId === 'string') ? rawId : undefined;
  const contentType = (typeof rawType === 'string' && ['article', 'narrative', 'feed'].includes(rawType)) 
    ? rawType as 'article' | 'narrative' | 'feed' 
    : undefined;
  
  // Refs to hold mutable state
  const sessionData = useRef({
    sessionId: '',
    accumulatedTime: { total: 0, article: 0, radio: 0, narrative: 0, feed: 0 },
    // NEW: Track seconds spent in each quarter of the page [Q1, Q2, Q3, Q4]
    quarters: [0, 0, 0, 0], 
    lastPingTime: Date.now(),
    isActive: true,
    idleTimer: null as any,
    maxScroll: 0,
    cachedWordCount: 0,
    hasStitchedSession: false,
    pendingInteractions: [] as any[]
  });

  // 1. Initialize Session ID
  useEffect(() => {
    if (!sessionData.current.sessionId) {
      sessionData.current.sessionId = 
        Date.now().toString(36) + Math.random().toString(36).substring(2);
      
      sessionStorage.setItem('current_analytics_session_id', sessionData.current.sessionId);
      console.log('Analytics Session Started:', sessionData.current.sessionId);
    }
    sessionData.current.maxScroll = 0;
  }, []);

  // 2. Link Anonymous Session
  useEffect(() => {
    if (user && sessionData.current.sessionId && !sessionData.current.hasStitchedSession) {
        fetch(`${API_URL}/analytics/link-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: sessionData.current.sessionId,
                userId: user.uid
            }),
            keepalive: true
        }).catch(err => console.warn('Session Stitching Failed', err));
        
        sessionData.current.hasStitchedSession = true;
    }
  }, [user]);

  // 3. Calculate Word Count
  useEffect(() => {
    if (contentId && (contentType === 'article' || contentType === 'narrative')) {
        setTimeout(() => {
            const text = document.body.innerText || "";
            sessionData.current.cachedWordCount = text.split(/\s+/).length;
        }, 1000);
    } else {
        sessionData.current.cachedWordCount = 0;
    }
    // Reset quarters on new content
    sessionData.current.quarters = [0, 0, 0, 0];
  }, [contentId, contentType]);

  // 4. NEW: High-Resolution Sampling (1s Interval)
  // This tracks *where* they are every second to build the Quarter distribution
  useEffect(() => {
    const sampler = setInterval(() => {
        if (!sessionData.current.isActive) return;
        
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        if (docHeight > 0) {
            const pct = scrollTop / docHeight;
            // Map 0.0-1.0 to 0-3 (Q1-Q4)
            const quarter = Math.min(Math.floor(pct * 4), 3);
            sessionData.current.quarters[quarter]++;
        } else {
            // If page is short, attribute to Q1
            sessionData.current.quarters[0]++;
        }
    }, SAMPLING_INTERVAL);

    return () => clearInterval(sampler);
  }, []);

  // 5. The Data Sender
  const sendData = useCallback((isBeacon = false, forceFlush = false) => {
    const now = Date.now();
    const elapsedSeconds = Math.round((now - sessionData.current.lastPingTime) / 1000);
    
    if (!forceFlush && (elapsedSeconds <= 0 || !sessionData.current.isActive)) {
        sessionData.current.lastPingTime = now;
        return; 
    }

    const path = window.location.pathname;
    const isArticle = contentType === 'article' || path.includes('/article/');
    const isNarrative = contentType === 'narrative' || path.includes('/narrative/');
    const isRadio = isRadioPlaying; 
    const isFeed = contentType === 'feed' || (!isArticle && !isNarrative);

    const metrics = {
        total: elapsedSeconds,
        article: isArticle ? elapsedSeconds : 0,
        narrative: isNarrative ? elapsedSeconds : 0,
        radio: isRadio ? elapsedSeconds : 0,
        feed: isFeed ? elapsedSeconds : 0
    };

    const interactions = [...sessionData.current.pendingInteractions];
    sessionData.current.pendingInteractions = []; 

    // Snapshot the accumulated quarters
    const currentQuarters = [...sessionData.current.quarters];
    // Reset quarters after sending so we don't double count
    sessionData.current.quarters = [0, 0, 0, 0];

    if (contentId) {
        interactions.push({
            contentType: contentType || (isArticle ? 'article' : 'narrative'),
            contentId: contentId,
            duration: elapsedSeconds,
            scrollDepth: sessionData.current.maxScroll,
            wordCount: sessionData.current.cachedWordCount, 
            // NEW: Send the quarterly breakdown
            quarters: currentQuarters,
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

    sessionData.current.lastPingTime = now;
  }, [contentId, contentType, isRadioPlaying, user?.uid]);

  // 6. Listeners (Same as before)
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

    const handleClick = (e: MouseEvent) => {
        handleUserActivity();
        const target = e.target as HTMLElement;
        const trackable = target.closest('[data-track-click]');
        
        if (trackable) {
            const actionName = trackable.getAttribute('data-track-click');
            sessionData.current.pendingInteractions.push({
                contentType: 'ui_interaction',
                contentId: contentId || 'global',
                text: actionName || 'unknown_click', 
                timestamp: new Date()
            });
        }
    };

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
    window.addEventListener('click', handleClick); 
    window.addEventListener('narrative-audio-event', handleAudioEvent as EventListener); 

    return () => {
        events.forEach(ev => window.removeEventListener(ev, handleUserActivity));
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('copy', handleCopy);
        window.removeEventListener('click', handleClick);
        window.removeEventListener('narrative-audio-event', handleAudioEvent as EventListener);
        if (sessionData.current.idleTimer) clearTimeout(sessionData.current.idleTimer);
    };
  }, [contentId, sendData]);

  // 7. Heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
        sendData(false);
    }, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [sendData]); 

  // 8. Exit Beacon
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
