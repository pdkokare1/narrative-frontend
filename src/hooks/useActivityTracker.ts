// src/hooks/useActivityTracker.ts
import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext'; 
import { SessionData, ANALYTICS_CONFIG } from '../config/analyticsConfig';

// Modular Hooks
import { useSessionCore } from './analytics/useSessionCore';
import { useScrollTracking } from './analytics/useScrollTracking';
import { useElementTracking } from './analytics/useElementTracking';

const QUEUE_KEY = 'analytics_offline_queue';

// UPDATED: Added onFlowChange callback for Zen Mode support
export const useActivityTracker = (
  rawId?: any, 
  rawType?: any, 
  onTrigger?: (command: string) => void,
  onFlowChange?: (isFlowing: boolean) => void // NEW ARGUMENT
) => {
  const location = useLocation();
  const { isPlaying: isRadioPlaying } = useAudio();
  const { user } = useAuth();
  const { addToast } = useToast(); 

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
    scrollDirection: 'steady', 
    confusionCount: 0,         
    tempUpScroll: 0,           

    // NEW: Init Average Velocity
    avgVelocity: 0,
    velocitySamples: 0,

    // Focus & Presence
    tabSwitchCount: 0,
    isTabActive: true,
    lastCursorMove: Date.now(),

    // NEW: Flow State Init
    currentFlowDuration: 0,
    totalFlowDuration: 0,
    isFlowing: false,
    flowGraceCounter: 0, // NEW: Init Grace Counter
    lastVisibleElementId: undefined,

    // Heatmap
    heatmap: {}
  });

  // Rage Click Tracking Ref
  const clickTracker = useRef<{ target: EventTarget | null, count: number, timestamp: number }>({
    target: null,
    count: 0,
    timestamp: 0
  });

  // Throttle Ref
  const throttleRef = useRef<number>(0);
  
  // NEW: Frustration Cooldown to prevent spamming the Toast
  const frustrationCooldown = useRef<number>(0);

  // NEW: Track last emitted cognitive state to avoid event spam
  const lastEmittedState = useRef<string>('standard');

  // 3. User Activity Signal (The Pulse)
  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    
    // OPTIMIZATION: Throttle activity checks to once every 500ms
    if (now - throttleRef.current < 500) {
        return;
    }
    throttleRef.current = now;

    sessionRef.current.lastActiveInteraction = now;
    sessionRef.current.lastCursorMove = now;

    if (!sessionRef.current.isActive) {
        sessionRef.current.isActive = true;
        sessionRef.current.lastPingTime = now; 
    }
    
    // Reset Idle Timer
    if (sessionRef.current.idleTimer) clearTimeout(sessionRef.current.idleTimer);
    
    // Determine Dynamic Timeout
    let timeoutDuration = ANALYTICS_CONFIG.TIMEOUTS.READING_MODE; // Default 60s
    
    if (isRadioPlaying) {
        timeoutDuration = ANALYTICS_CONFIG.TIMEOUTS.AUDIO_MODE; // 20m
    } else if (contentType === 'feed') {
        timeoutDuration = ANALYTICS_CONFIG.TIMEOUTS.FEED_MODE; // 15s
    } else if (contentType === 'narrative') {
        timeoutDuration = ANALYTICS_CONFIG.TIMEOUTS.NARRATIVE_MODE; // NEW: 120s
    }

    sessionRef.current.idleTimer = setTimeout(() => {
        sessionRef.current.isActive = false;
    }, timeoutDuration);
  }, [isRadioPlaying, contentType]);

  // --- IMPROVEMENT: Mobile Micro-Interaction Tracking ---
  // Fixes "Ghost Reading" issues on mobile where users hold the screen without scrolling.
  useEffect(() => {
    // Only run on touch-enabled devices
    if (!('ontouchstart' in window)) return;

    let lastTouchY = 0;

    const handleTouchStart = (e: TouchEvent) => {
        lastTouchY = e.touches[0].clientY;
        handleUserActivity();
    };

    const handleTouchMove = (e: TouchEvent) => {
        const currentY = e.touches[0].clientY;
        const diff = Math.abs(currentY - lastTouchY);
        
        // If the user is holding their thumb on the screen but moving slightly
        // (Micro-movements indicate reading flow on mobile, even if not scrolling)
        if (diff < 10 && diff > 0) {
            // We manually trigger "Presence" here without triggering full activity logic
            // to avoid resetting idle timers too aggressively, but enough to stay "Active"
            sessionRef.current.lastCursorMove = Date.now(); 
        }
        lastTouchY = currentY;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    return () => {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleUserActivity]);
  // -----------------------------------------------------

  // --- PLUG IN MODULAR HOOKS ---
  // UPDATED: Pass onFlowChange to Core
  useSessionCore(sessionRef, user, onFlowChange);
  
  useScrollTracking(sessionRef, handleUserActivity);
  useElementTracking(sessionRef, contentId, location.pathname);

  // --- NEW: Helper to dispatch cognitive state events ---
  const dispatchStateChange = (newState: 'standard' | 'flow' | 'fatigue' | 'confusion') => {
      if (lastEmittedState.current !== newState) {
          lastEmittedState.current = newState;
          // Dispatch custom event for the Context to pick up
          const event = new CustomEvent('narrative-cognitive-change', { 
              detail: { state: newState } 
          });
          window.dispatchEvent(event);
      }
  };

  // --- NEW: Strategy A - Predictive Abandonment / Frustration Monitor ---
  useEffect(() => {
     if (!contentId || !contentType) return;

     const monitor = setInterval(() => {
         const now = Date.now();
         const sess = sessionRef.current;
         
         // Priority 1: Confusion (High Urgency)
         // If "Confusion Count" (rapid up-scrolls) exceeds threshold
         if (sess.confusionCount >= ANALYTICS_CONFIG.CONFUSION.ABANDONMENT_THRESHOLD) {
             
             dispatchStateChange('confusion');

             // Check Cooldown (Don't spam user every 10 seconds)
             if (now - frustrationCooldown.current > 300000) { // 5 minute cooldown
                 
                 // Trigger Intervention
                 addToast("Short on time? You can save this to your Smart Brief for later.", 'info');
                 
                 // Log Intervention
                 sess.pendingInteractions.push({
                     contentType: 'ui_interaction',
                     contentId: contentId,
                     text: 'INTERVENTION:SAVED_SUGGESTION',
                     timestamp: new Date()
                 });

                 // Reset score and set cooldown
                 sess.confusionCount = 0;
                 frustrationCooldown.current = now;
             }
         }
         // Priority 2: Fatigue / Zombie Scroll Monitor
         // If they have been scrolling for > 5 mins (accumulated) and velocity drops to near-zero
         // but they are still "active", they are likely fatigued.
         else if (sess.accumulatedTime.total > 300 && sess.avgVelocity > 0 && sess.avgVelocity < 0.01) {
             
             dispatchStateChange('fatigue');

             if (now - frustrationCooldown.current > 600000) { // 10 minute cooldown for this one
                  if (onTrigger) {
                      onTrigger('trigger_palate_cleanser'); // Open the modal
                      
                      sess.pendingInteractions.push({
                        contentType: 'ui_interaction',
                        contentId: contentId,
                        text: 'INTERVENTION:FATIGUE_DETECTED',
                        timestamp: new Date()
                      });
                      
                      frustrationCooldown.current = now;
                  }
             }
         }
         // Priority 3: Flow State (Positive)
         else if (sess.isFlowing) {
             dispatchStateChange('flow');
         }
         // Priority 4: Standard
         else {
             dispatchStateChange('standard');
         }
         // ---------------------------------------------

     }, 2000); // Check every 2 seconds

     return () => clearInterval(monitor);
  }, [contentId, contentType, addToast, onTrigger]);
  // ----------------------------------------------------------------------


  // 4. Calculate Word Count (Context Specific)
  useEffect(() => {
    if (contentId && (contentType === 'article' || contentType === 'narrative')) {
        const timer = setTimeout(() => {
            const target = document.getElementById('narrative-content') 
                        || document.getElementById('article-content') 
                        || document.body;

            const text = target.innerText || "";
            sessionRef.current.cachedWordCount = text.split(/\s+/).length;
        }, 1500);
        return () => clearTimeout(timer);
    } else {
        sessionRef.current.cachedWordCount = 0;
    }
    // Reset Context Specific Data
    sessionRef.current.quarters = [0, 0, 0, 0];
    sessionRef.current.heatmap = {}; 
    sessionRef.current.lastScrollTop = window.scrollY; 
    sessionRef.current.tabSwitchCount = 0; 
    
    // Reset Flow
    sessionRef.current.currentFlowDuration = 0;
    sessionRef.current.totalFlowDuration = 0;
    sessionRef.current.flowGraceCounter = 0;
    
    // Reset Accumulators for new content
    sessionRef.current.accumulatedTime.article = 0;
    sessionRef.current.accumulatedTime.narrative = 0;

    // NEW: Reset Velocity Tracking
    sessionRef.current.avgVelocity = 0;
    sessionRef.current.velocitySamples = 0;
    
    // NEW: Reset Frustration
    sessionRef.current.confusionCount = 0;
    frustrationCooldown.current = 0;
    
    // Reset Cognitive State
    dispatchStateChange('standard');

  }, [contentId, contentType]);


  // 5. The Data Sender (Pipeline with Offline Support)
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

    // --- NEW: Accumulate Total Time Locally (For Skim Detection) ---
    if (isArticle) sessionRef.current.accumulatedTime.article += elapsedSeconds;
    if (isNarrative) sessionRef.current.accumulatedTime.narrative += elapsedSeconds;
    if (isRadio) sessionRef.current.accumulatedTime.radio += elapsedSeconds;
    sessionRef.current.accumulatedTime.total += elapsedSeconds;

    // Metrics Packet (Delta)
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

    // NEW: Flow Packet
    const currentFlow = sessionRef.current.totalFlowDuration;
    // Reset flow accumulator for this ping (we send the delta)
    sessionRef.current.totalFlowDuration = 0;

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (contentId) {
        const rawScore = 100 - (sessionRef.current.tabSwitchCount * 10);
        const focusScore = Math.max(0, rawScore);

        // --- NEW: Skim Detector Logic ---
        let readConfidence = 'unknown';
        const totalTimeOnContent = isArticle ? sessionRef.current.accumulatedTime.article : sessionRef.current.accumulatedTime.narrative;
        const wordCount = sessionRef.current.cachedWordCount;
        
        if (wordCount > 100 && totalTimeOnContent > 0) {
            // Calculate Words Per Minute
            const wpm = (wordCount / totalTimeOnContent) * 60;
            const maxScroll = sessionRef.current.maxScroll;

            if (maxScroll < 50) {
                readConfidence = 'partial'; // Haven't finished it
            } else if (wpm > ANALYTICS_CONFIG.SKIMMING.MAX_WPM) {
                readConfidence = 'skimmed'; // Impossible speed
            } else {
                readConfidence = 'read'; // Normal speed
            }
        }
        // --------------------------------

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
            // NEW METRICS
            flowDuration: currentFlow,
            dropOffElement: sessionRef.current.lastVisibleElementId,
            avgVelocity: sessionRef.current.avgVelocity,
            readConfidence: readConfidence, // NEW FIELD
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

    // --- NEW: Offline Queue Logic ---
    const sendPayload = (data: any) => {
        if (isBeacon) {
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            navigator.sendBeacon(endpoint, blob);
        } else {
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                keepalive: true 
            })
            .then(res => res.json()) // NEW: Parse response for triggers
            .then(response => {
                // NEW: Handle Backend Commands (Feedback Loop)
                if (response?.command) {
                    // 1. Toast Notification
                    if (response.command === 'trigger_palate_cleanser') {
                        addToast("Take a breath. You've been reading a lot of heavy content lately.", 'info');
                    }
                    // 2. Execute Callback (e.g. Open Modal)
                    if (onTrigger) {
                        onTrigger(response.command);
                    }
                }
            })
            .catch(err => {
                console.warn('Analytics Error, queueing:', err);
                try {
                    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
                    queue.push(data);
                    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
                } catch (e) { /* Storage full */ }
            });
        }
    };

    if (navigator.onLine) {
        sendPayload(payload);
    } else {
        // Store directly if we know we are offline
        try {
            const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
            queue.push(payload);
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        } catch (e) { /* Storage full */ }
    }

    sessionRef.current.lastPingTime = now;
  }, [contentId, contentType, isRadioPlaying, user?.uid, addToast, onTrigger]);


  // 6. High-Res Sampling & Flush Queue
  useEffect(() => {
    // Flush Offline Queue when coming online
    const flushQueue = () => {
        if (!navigator.onLine) return;
        const queueStr = localStorage.getItem(QUEUE_KEY);
        if (queueStr) {
            const queue = JSON.parse(queueStr);
            if (queue.length > 0) {
                // Send individually to avoid massive payloads
                queue.forEach((payload: any) => {
                    fetch(`${ANALYTICS_CONFIG.API_URL}/analytics/track`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }).catch(console.error);
                });
                localStorage.removeItem(QUEUE_KEY);
            }
        }
    };
    
    window.addEventListener('online', flushQueue);
    // Try flush on mount just in case
    flushQueue();

    const sampler = setInterval(() => {
        if (!sessionRef.current.isActive) return;
        if (document.hidden) return; 
        
        const timeSinceCursor = Date.now() - sessionRef.current.lastCursorMove;
        if (timeSinceCursor > ANALYTICS_CONFIG.TIMEOUTS.CURSOR_IDLE && !isRadioPlaying) return;

        const isReading = sessionRef.current.scrollVelocity < ANALYTICS_CONFIG.VELOCITY.READING_MAX;
        
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

    const heartbeat = setInterval(() => {
        sendData(false);
    }, ANALYTICS_CONFIG.HEARTBEAT_INTERVAL);

    return () => {
        clearInterval(sampler);
        clearInterval(heartbeat);
        window.removeEventListener('online', flushQueue);
    };
  }, [sendData, isRadioPlaying]);


  // 7. Global Event Listeners & Batch Logic
  useEffect(() => {
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
             sendData(false, true); 
        }
    };

    // Click & Rage Click Tracking
    const handleClick = (e: MouseEvent) => {
        handleUserActivity();
        const target = e.target as HTMLElement;

        // --- NEW: Rage Click Detection ---
        const now = Date.now();
        if (clickTracker.current.target === target && (now - clickTracker.current.timestamp) < 1000) {
            clickTracker.current.count++;
            if (clickTracker.current.count === 3) {
                 sessionRef.current.pendingInteractions.push({
                    contentType: 'ui_interaction',
                    contentId: contentId || 'global',
                    text: 'RAGE_CLICK',
                    timestamp: new Date()
                });
            }
        } else {
            clickTracker.current = { target, count: 1, timestamp: now };
        }
        // ---------------------------------

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

    const handleAudioEvent = (e: any) => {
        const { action, articleId } = e.detail;
        sessionRef.current.pendingInteractions.push({
            contentType: 'audio_action',
            contentId: articleId,
            audioAction: action,
            timestamp: new Date()
        });
    };

    const handleImpression = (e: any) => {
        const { itemId, itemType, category } = e.detail;
        sessionRef.current.pendingInteractions.push({
            contentType: 'impression', 
            contentId: itemId,
            text: `${itemType}:${category}`, 
            timestamp: new Date()
        });
    };

    // --- NEW: Standard Log Listener (Batching Support) ---
    const handleStandardLog = (e: any) => {
        const { eventType, data } = e.detail;
        
        sessionRef.current.pendingInteractions.push({
             contentType: eventType, // 'view_analysis', 'share_article', etc.
             contentId: data.articleId || data.contentId || 'unknown',
             query: data.query, // For search logs
             ...data,
             timestamp: new Date()
        });

        // OPTIMIZATION: Flush Immediately if Buffer is Full
        // This prevents memory bloat and ensures data isn't lost if the user leaves
        if (sessionRef.current.pendingInteractions.length >= ANALYTICS_CONFIG.BATCH_THRESHOLD) {
             sendData(false, true); // Force flush
        }
    };
    // ---------------------------------------------------

    const handleVisibilityChange = () => {
        if (document.hidden) {
            sessionRef.current.isTabActive = false;
            sessionRef.current.tabSwitchCount++; 
            sendData(true); 
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
    // NEW Listener
    window.addEventListener('narrative-standard-log', handleStandardLog as EventListener);
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => sendData(true));

    return () => {
        events.forEach(ev => window.removeEventListener(ev, handleUserActivity));
        window.removeEventListener('copy', handleCopy);
        window.removeEventListener('click', handleClick);
        window.removeEventListener('narrative-audio-event', handleAudioEvent as EventListener);
        window.removeEventListener('narrative-impression', handleImpression as EventListener);
        window.removeEventListener('narrative-standard-log', handleStandardLog as EventListener);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', () => sendData(true));
        
        if (sessionRef.current.idleTimer) clearTimeout(sessionRef.current.idleTimer);
    };
  }, [contentId, sendData, handleUserActivity]);

  return null; 
};
