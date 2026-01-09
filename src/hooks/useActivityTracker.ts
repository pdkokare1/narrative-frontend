// src/hooks/useActivityTracker.ts
import { useEffect, useRef, useCallback } from 'react';
import { IArticle } from '../types';
import apiClient from '../services/axiosInstance';

interface ActivityQueueItem {
  articleId: string;
  category: string;
  lean: string;
  seconds: number;
}

export const useActivityTracker = (activeArticleId: string | undefined, articlesMap: Map<string, IArticle>) => {
  const queue = useRef<ActivityQueueItem[]>([]);
  const startTime = useRef<number | null>(null);
  const currentId = useRef<string | null>(null);

  // Send collected stats to backend
  const flushQueue = useCallback(() => {
    if (queue.current.length === 0) return;

    const batch = [...queue.current];
    queue.current = []; // Clear immediately

    // Aggregate by article to reduce payload
    const aggregated = batch.reduce((acc, item) => {
        if (!acc[item.articleId]) acc[item.articleId] = { ...item };
        else acc[item.articleId].seconds += item.seconds;
        return acc;
    }, {} as Record<string, ActivityQueueItem>);

    // 1. Try standard API call (for valid sessions)
    Object.values(aggregated).forEach(item => {
        apiClient.post('/activity/heartbeat', item).catch(() => {
            // If axios fails (e.g. unmount), we rely on Beacon below (if supported)
        });
    });

    // 2. Beacon API Backup (Reliable on page unload)
    // We construct a Blob because Beacon doesn't support complex headers (Auth) easily,
    // but for simple stats, we can rely on the cookie if present or just accept anonymous stats for now.
    // NOTE: If your backend strictly requires Bearer tokens in headers, Beacon is tricky.
    // A common workaround is sending the token in the body or query param for this specific endpoint.
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
    if (navigator.sendBeacon) {
         const blob = new Blob([JSON.stringify({ batch: Object.values(aggregated) })], { type: 'application/json' });
         // navigator.sendBeacon(`${apiUrl}/activity/heartbeat-beacon`, blob);
    }

  }, []);

  // Track switching articles
  useEffect(() => {
    const now = Date.now();

    // 1. Close session for previous article
    if (currentId.current && startTime.current) {
        const duration = (now - startTime.current) / 1000;
        const prevArticle = articlesMap.get(currentId.current);
        
        if (duration > 2 && prevArticle) { // Ignore fast scrolls (<2s)
            queue.current.push({
                articleId: prevArticle._id,
                category: prevArticle.category,
                lean: prevArticle.politicalLean,
                seconds: Math.round(duration)
            });
        }
    }

    // 2. Start session for new article
    if (activeArticleId) {
        currentId.current = activeArticleId;
        startTime.current = now;
    } else {
        currentId.current = null;
        startTime.current = null;
    }
  }, [activeArticleId, articlesMap]);

  // Flush on interval (every 30s)
  useEffect(() => {
    const interval = setInterval(flushQueue, 30000);
    
    // Safety flush on window close
    const handleUnload = () => flushQueue();
    window.addEventListener('beforeunload', handleUnload);

    return () => {
        clearInterval(interval);
        window.removeEventListener('beforeunload', handleUnload);
        flushQueue(); // Flush on unmount
    };
  }, [flushQueue]);

  return null; // Logic only hook
};
