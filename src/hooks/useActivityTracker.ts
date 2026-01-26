// src/hooks/useActivityTracker.ts
import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { SessionData, ANALYTICS_CONFIG } from '../config/analyticsConfig';

// Modular Hooks
import { useSessionCore } from './analytics/useSessionCore';
import { useScrollTracking } from './analytics/useScrollTracking';
import { useElementTracking } from './analytics/useElementTracking';

export const useActivityTracker = (rawId?: any, rawType?: any) => {
  const location = useLocation();
  const { isPlaying: isRadioPlaying } = useAudio();
  const { user } = useAuth();

  // 1. Sanitization
  const contentId = (typeof rawId === 'string') ? rawId : undefined;
  const contentType = (typeof rawType === 'string' && ['article', 'narrative', 'feed'].includes(rawType)) 
    ? rawType as 'article' | 'narrative' | 'feed' 
    : undefined;
  
  // 2. Central Session State (Mutable Ref)
  const sessionRef = useRef<SessionData>({
    sessionId: '',
    accumulatedTime: { total: 0, article: 0, radio: 0, narrative: 0, feed: 0 },
    quarters: [0, 0, 0, 0], 
    lastPingTime: Date.now(),
    isActive: true,
    lastActiveInteraction: Date.now(),
    idleTimer: null,
    maxScroll: 0,
    cachedWordCount: 0,
    hasStitchedSession: false,
    pendingInteractions: [],
    
    // Velocity & Scroll
    lastScrollTop: 0,
    lastScrollTime: Date.now(),
    scrollVelocity: 0,

    // Focus & Presence
    tabSwitchCount: 0,
    isTabActive: true,
    lastCursorMove: Date.now(),

    // Heatmap
    heatmap: {}
  });

  // 3. User Activity Signal (The Pulse)
  const handleUserActivity = useCallback(() => {
    sessionRef.current.lastActiveInteraction = Date.now();
    sessionRef.current.lastCursorMove = Date.now();

    if (!sessionRef.current.isActive) {
        sessionRef.current.isActive = true;
        sessionRef.current.lastPingTime = Date.now(); 
    }
    
    // Reset Idle Timer
    if (sessionRef.current.idleTimer) clearTimeout(sessionRef.current.idleTimer);
    
    // Determine Dynamic Timeout
    let timeoutDuration = ANALYTICS_CONFIG.TIMEOUTS.READING_MODE; // Default 60s
    if (isRadioPlaying) timeoutDuration = ANALYTICS_CONFIG.TIMEOUTS.AUDIO_MODE; // 20m
    else if (contentType === 'feed') timeoutDuration = ANALYTICS_CONFIG.TIMEOUTS.FEED_MODE; // 15s

    sessionRef.current.idleTimer = setTimeout(() => {
        sessionRef.current.isActive = false;
    }, timeoutDuration);
  }, [isRadioPlaying, contentType]);

  // --- PLUG IN MODULAR HOOKS ---

  // A. Session Lifecycle & Stitching
  useSessionCore(sessionRef, user);

  // B. Scroll Intelligence & Velocity
  useScrollTracking(sessionRef, handleUserActivity);

  // C. Element Visibility (Heatmaps)
  useElementTracking(sessionRef, contentId, location.pathname);

  // -----------------------------

  // 4. Calculate Word Count (Context Specific)
  useEffect(() => {
    if (contentId && (contentType === 'article' || contentType === 'narrative')) {
        // Delay slightly to allow render
        const timer = setTimeout(() => {
            const text = document.body.innerText || "";
            sessionRef.current.cachedWordCount = text.split(/\s+/).length;
        }, 1500);
        return () => clearTimeout(timer);
    } else {
        sessionRef.current.cachedWordCount = 0;
    }
    // Reset Context-Specific Metrics on change
    sessionRef.current.quarters = [0, 0, 0, 0];
    sessionRef.current.heatmap = {}; 
    sessionRef.current.lastScrollTop = window.scrollY; 
    sessionRef.current.tabSwitchCount = 0; 
  }, [contentId, contentType]);


  // 5. The Data Sender (Pipeline)
  const sendData = useCallback((isBeacon = false, forceFlush = false) => {
    const now = Date.now();
    const elapsedSeconds = Math.round((now - sessionRef.current.lastPingTime) / 1000);
    
    if (!forceFlush && (elapsedSeconds <= 0 || !sessionRef.current.isActive)) {
        sessionRef.current.lastPingTime = now;
        return; 
    }

    // Context Determination
    const path = window.location.pathname;
    const isArticle = contentType === 'article' || path.includes('/article/');
    const isNarrative = contentType === 'narrative' || path.includes('/narrative/');
    const isRadio = isRadioPlaying; 
    const isFeed = contentType === 'feed' || (!isArticle && !isNarrative);

    // Metrics Packet
    const metrics = {
        total: elapsedSeconds,
        article: isArticle ? elapsedSeconds : 0,
        narrative: isNarrative ? elapsedSeconds : 0,
        radio: isRadio ? elapsedSeconds : 0,
        feed: isFeed ? elapsedSeconds : 0
    };

    // Interaction Packet
    const interactions = [...sessionRef.current.pendingInteractions];
    sessionRef.current.pendingInteractions = []; 

    // Quarter Packet
    const currentQuarters = [...sessionRef.current.quarters];
    sessionRef.current.quarters = [0, 0, 0, 0];

    // Heatmap Packet
    const currentHeatmap = { ...sessionRef.current.heatmap };
    sessionRef.current.heatmap = {}; 

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Snapshot Interaction (if viewing content)
    if (contentId) {
        // Calculate Focus Score (100 - (switches * 10))
        const rawScore = 100 - (sessionRef.current.tabSwitchCount * 10);
        const focusScore = Math.max(0, rawScore);

        interactions.push({
            contentType: contentType || (isArticle ? 'article' : 'narrative'),
            contentId: contentId,
            duration: elapsedSeconds,
            scrollDepth: sessionRef.current.maxScroll,
            wordCount: sessionRef.current.cachedWordCount, 
            quarters: currentQuarters,
            scrollPosition: Math.round(sessionRef.current.lastScrollTop),
            focusScore: focusScore,
            heatmap: currentHeatmap,
            timestamp: new Date()
        });
    }

    const payload = {
        sessionId: sessionRef.current.sessionId,
        userId: user?.uid, 
        metrics,
        interactions, 
        meta: {
            platform: 'web',
            userAgent: navigator.userAgent,
            referrer: document.referrer || 'direct',
            timezone: userTimezone
        }
    };

    const endpoint = `${ANALYTICS_CONFIG.API_URL}/analytics/track`;

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

    sessionRef.current.lastPingTime = now;
  }, [contentId, contentType, isRadioPlaying, user?.uid]);


  // 6. High-Res Sampling (The Heartbeat)
  useEffect(() => {
    // A. 1-Second Sampling for Quarters & Focus
    const sampler = setInterval(() => {
        if (!sessionRef.current.isActive) return;
        if (document.hidden) return; 
        
        // Ghost Check: If cursor hasn't moved for 60s, stop counting "Reading"
        // even if tab is active
        const timeSinceCursor = Date.now() - sessionRef.current.lastCursorMove;
        if (timeSinceCursor > ANALYTICS_CONFIG.TIMEOUTS.CURSOR_IDLE && !isRadioPlaying) return;

        // Velocity Check: Don't count "Reading" if they are speed scrolling
        const isReading = sessionRef.current.scrollVelocity < ANALYTICS_CONFIG.VELOCITY.READING_MAX;
        
        // Calculate Quarters
        if (isReading) {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (docHeight > 0) {
                const pct = scrollTop / docHeight;
                const quarter = Math.min(Math.floor(pct * 4), 3);
                sessionRef.current.quarters[quarter]++;
            } else {
                sessionRef.current.quarters[0]++;
            }
        }
    }, ANALYTICS_CONFIG.SAMPLING_INTERVAL);

    // B. 30-Second Data Flush
    const heartbeat = setInterval(() => {
        sendData(false);
    }, ANALYTICS_CONFIG.HEARTBEAT_INTERVAL);

    return () => {
        clearInterval(sampler);
        clearInterval(heartbeat);
    };
  }, [sendData, isRadioPlaying]);


  // 7. Global Event Listeners
  useEffect(() => {
    // Copy Tracking
    const handleCopy = () => {
        const selection = window.getSelection()?.toString();
        if (selection && selection.length > 10) {
             const cleanText = selection.substring(0, 200); 
             sessionRef.current.pendingInteractions.push({
                 contentType: 'copy',
                 contentId: contentId || 'unknown',
                 text: cleanText,
                 timestamp: new Date()
             });
             sendData(false, true); // Flush immediately
        }
    };

    // Click Tracking (Data-Attributes)
    const handleClick = (e: MouseEvent) => {
        handleUserActivity();
        const target = e.target as HTMLElement;
        const trackable = target.closest('[data-track-click]');
        
        if (trackable) {
            const actionName = trackable.getAttribute('data-track-click');
            sessionRef.current.pendingInteractions.push({
                contentType: 'ui_interaction',
                contentId: contentId || 'global',
                text: actionName || 'unknown_click', 
                timestamp: new Date()
            });
        }
    };

    // Audio Events
    const handleAudioEvent = (e: any) => {
        const { action, articleId } = e.detail;
        sessionRef.current.pendingInteractions.push({
            contentType: 'audio_action',
            contentId: articleId,
            audioAction: action,
            timestamp: new Date()
        });
    };

    // Impression Events
    const handleImpression = (e: any) => {
        const { itemId, itemType, category } = e.detail;
        sessionRef.current.pendingInteractions.push({
            contentType: 'impression', 
            contentId: itemId,
            text: `${itemType}:${category}`, 
            timestamp: new Date()
        });
    };

    // Tab Visibility
    const handleVisibilityChange = () => {
        if (document.hidden) {
            sessionRef.current.isTabActive = false;
            sessionRef.current.tabSwitchCount++; 
            sendData(true); // Flush on hide
        } else {
            sessionRef.current.isTabActive = true;
            sessionRef.current.lastActiveInteraction = Date.now();
        }
    };

    const events = ['mousedown', 'keydown', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, handleUserActivity, { passive: true }));
    
    window.addEventListener('copy', handleCopy); 
    window.addEventListener('click', handleClick); 
    window.addEventListener('narrative-audio-event', handleAudioEvent as EventListener); 
    window.addEventListener('narrative-impression', handleImpression as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => sendData(true));

    return () => {
        events.forEach(ev => window.removeEventListener(ev, handleUserActivity));
        window.removeEventListener('copy', handleCopy);
        window.removeEventListener('click', handleClick);
        window.removeEventListener('narrative-audio-event', handleAudioEvent as EventListener);
        window.removeEventListener('narrative-impression', handleImpression as EventListener);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', () => sendData(true));
        
        if (sessionRef.current.idleTimer) clearTimeout(sessionRef.current.idleTimer);
    };
  }, [contentId, sendData, handleUserActivity]);

  return null; 
};
