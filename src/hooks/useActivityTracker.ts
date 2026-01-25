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
    quarters: [0, 0, 0, 0], 
    lastPingTime: Date.now(),
    isActive: true,
    lastActiveInteraction: Date.now(),
    idleTimer: null as any,
    maxScroll: 0,
    cachedWordCount: 0,
    hasStitchedSession: false,
    pendingInteractions: [] as any[],
    
    // NEW: Velocity Tracking
    lastScrollTop: 0,
    lastScrollTime: Date.now(),
    scrollVelocity: 0 // pixels per ms
  });

  // 1. Initialize Session ID
  useEffect(() => {
    if (!sessionData.current.sessionId) {
      sessionData.current.sessionId = 
        Date.now().toString(36) + Math.random().toString(36).substring(2);
      
      sessionStorage.setItem('current_analytics_session_id', sessionData.current.sessionId);
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
    sessionData.current.lastScrollTop = window.scrollY; 
  }, [contentId, contentType]);

  // 4. NEW: High-Resolution Sampling with Dynamic Attention
  useEffect(() => {
    const sampler = setInterval(() => {
        // Broad check: Is the session active? (60s timeout)
        if (!sessionData.current.isActive) return;

        // OPTIMIZATION: Instant fail if tab is hidden (User tabbed away)
        if (document.hidden) return; 
        
        const timeSinceInteraction = Date.now() - sessionData.current.lastActiveInteraction;
        
        // NEW: Dynamic Attention Threshold
        // If velocity is low (< 0.05 px/ms), they are likely "Reading" -> Allow 20s pause
        // If velocity is high (Scrolling), they are "Scanning" -> Strict 5s pause
        const isReading = sessionData.current.scrollVelocity < 0.05;
        const dynamicThreshold = isReading ? 20000 : 5000;

        if (timeSinceInteraction > dynamicThreshold) return;

        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        if (docHeight > 0) {
            const pct = scrollTop / docHeight;
            const quarter = Math.min(Math.floor(pct * 4), 3);
            sessionData.current.quarters[quarter]++;
        } else {
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

    const currentQuarters = [...sessionData.current.quarters];
    sessionData.current.quarters = [0, 0, 0, 0];

    // Determine Timezone for Streak Accuracy
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (contentId) {
        interactions.push({
            contentType: contentType || (isArticle ? 'article' : 'narrative'),
            contentId: contentId,
            duration: elapsedSeconds,
            scrollDepth: sessionData.current.maxScroll,
            wordCount: sessionData.current.cachedWordCount, 
            quarters: currentQuarters,
            // NEW: Add exact scroll position for "Resume Reading"
            scrollPosition: Math.round(sessionData.current.lastScrollTop),
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
            referrer: document.referrer || 'direct',
            // NEW: Send Timezone
            timezone: userTimezone
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

  // 6. Listeners
  useEffect(() => {
    const handleUserActivity = () => {
        sessionData.current.lastActiveInteraction = Date.now();

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
        
        // NEW: Calculate Velocity
        const now = Date.now();
        const dt = now - sessionData.current.lastScrollTime;
        if (dt > 50) { // Only calc every 50ms to avoid noise
            const dy = Math.abs(scrollTop - sessionData.current.lastScrollTop);
            sessionData.current.scrollVelocity = dy / dt; // px per ms
            
            sessionData.current.lastScrollTop = scrollTop;
            sessionData.current.lastScrollTime = now;
        }

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

    const handleImpression = (e: any) => {
        const { itemId, itemType, category } = e.detail;
        sessionData.current.pendingInteractions.push({
            contentType: 'impression', 
            contentId: itemId,
            text: `${itemType}:${category}`, 
            timestamp: new Date()
        });
    };

    const events = ['mousedown', 'keydown', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, handleUserActivity, { passive: true }));
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('copy', handleCopy); 
    window.addEventListener('click', handleClick); 
    window.addEventListener('narrative-audio-event', handleAudioEvent as EventListener); 
    window.addEventListener('narrative-impression', handleImpression as EventListener);

    return () => {
        events.forEach(ev => window.removeEventListener(ev, handleUserActivity));
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('copy', handleCopy);
        window.removeEventListener('click', handleClick);
        window.removeEventListener('narrative-audio-event', handleAudioEvent as EventListener);
        window.removeEventListener('narrative-impression', handleImpression as EventListener);
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
