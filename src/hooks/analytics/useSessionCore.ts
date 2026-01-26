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
    sessionRef.current.maxScroll = 0;
  }, []); // Run once on mount

  // 2. Link Anonymous Session to User
  useEffect(() => {
    if (user && sessionRef.current.sessionId && !sessionRef.current.hasStitchedSession) {
        fetch(\`\${ANALYTICS_CONFIG.API_URL}/analytics/link-session\`, {
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
};
