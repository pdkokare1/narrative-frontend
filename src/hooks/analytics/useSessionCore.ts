// src/hooks/analytics/useSessionCore.ts
import { useEffect, MutableRefObject } from 'react';
import { SessionData, ANALYTICS_CONFIG } from '../../config/analyticsConfig';

export const useSessionCore = (
  sessionRef: MutableRefObject<SessionData>,
  user: any
) => {
  // 1. Initialize Session ID
  useEffect(() => {
    if (!sessionRef.current.sessionId) {
      // Check storage first to persist across refreshes
      const existing = sessionStorage.getItem('current_analytics_session_id');
      
      if (existing) {
        sessionRef.current.sessionId = existing;
      } else {
        const newId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        sessionRef.current.sessionId = newId;
        sessionStorage.setItem('current_analytics_session_id', newId);
      }
    }
    // Reset / Init defaults
    sessionRef.current.maxScroll = 0;
    sessionRef.current.confusionCount = 0;
    sessionRef.current.tempUpScroll = 0;
    sessionRef.current.scrollDirection = 'steady';
    
  }, []); // Run once on mount

  // 2. Link Anonymous Session to User
  useEffect(() => {
    if (user && sessionRef.current.sessionId && !sessionRef.current.hasStitchedSession) {
        fetch(`${ANALYTICS_CONFIG.API_URL}/analytics/link-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: sessionRef.current.sessionId,
                userId: user.uid
            }),
            keepalive: true
        }).catch(err => console.warn('Session Stitching Failed', err));
        
        sessionRef.current.hasStitchedSession = true;
    }
  }, [user]);

  // 3. NEW: Flow State Tracker
  // Monitors deep focus. If user reads consistently for > 5 mins, we count "Flow Minutes".
  useEffect(() => {
    const flowInterval = setInterval(() => {
        const sess = sessionRef.current;

        // Criteria for Flow:
        // 1. Tab must be active
        // 2. User must be active (not idle)
        // 3. Scroll velocity must be low (Reading, not scanning)
        // 4. No recent tab switches
        if (
            sess.isTabActive && 
            sess.isActive && 
            sess.scrollVelocity < ANALYTICS_CONFIG.FLOW.VELOCITY_MAX
        ) {
            sess.currentFlowDuration += 1000; // Add 1 second

            // If they have sustained focus for enough time, count it as "True Flow"
            if (sess.currentFlowDuration >= ANALYTICS_CONFIG.FLOW.THRESHOLD_MS) {
                sess.isFlowing = true;
                sess.totalFlowDuration += 1; // Add to global counter (seconds)
            }
        } else {
            // Disruption! Reset current flow accumulator.
            // Note: We do not reset totalFlowDuration, that is cumulative.
            sess.currentFlowDuration = 0;
            sess.isFlowing = false;
        }
    }, 1000);

    return () => clearInterval(flowInterval);
  }, []);
};
