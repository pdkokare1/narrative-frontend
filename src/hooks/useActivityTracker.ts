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

    const payload = Object.values(aggregated);
    if (payload.length === 0) return;

    // 1. Try standard API call (for active sessions)
    payload.forEach(item => {
        apiClient.post('/activity/heartbeat', item).catch(() => {
            // Silently fail on axios error (likely unmount)
        });
    });

    // 2. Beacon API Backup (Reliable on page unload/close)
    if (navigator.sendBeacon) {
        // Use Blob to send JSON data via Beacon
        const blob = new Blob(
            [JSON.stringify({ batch: payload })], 
            { type: 'application/json' }
        );
        // Note: You might need to adjust your backend to handle bulk batch if strictly needed,
        // but for now we send the beacon to the heartbeat endpoint. 
        // Since Beacon is "fire and forget", exact reliability varies, but it's better than nothing.
        const apiUrl = (import.meta.env.VITE_API_URL || 'https://api.thegamut.in') + '/activity/heartbeat-beacon';
        navigator.sendBeacon(apiUrl, blob);
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

  // Flush on interval (every 30s) and on Unload
  useEffect(() => {
    const interval = setInterval(flushQueue, 30000);
    
    // Safety flush on window close
    const handleUnload = () => flushQueue();
    window.addEventListener('beforeunload', handleUnload); // Desktop
    window.addEventListener('visibilitychange', () => {    // Mobile
        if (document.visibilityState === 'hidden') flushQueue();
    });

    return () => {
        clearInterval(interval);
        window.removeEventListener('beforeunload', handleUnload);
        flushQueue(); // Flush on unmount
    };
  }, [flushQueue]);

  return null; // Logic only hook
};
