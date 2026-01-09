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
  const flushQueue = useCallback(async () => {
    if (queue.current.length === 0) return;

    const batch = [...queue.current];
    queue.current = []; // Clear immediately

    // Aggregate by article to reduce payload
    const aggregated = batch.reduce((acc, item) => {
        if (!acc[item.articleId]) acc[item.articleId] = { ...item };
        else acc[item.articleId].seconds += item.seconds;
        return acc;
    }, {} as Record<string, ActivityQueueItem>);

    // Send individual heartbeats (or batch endpoint if backend supported it)
    // For now we loop, assuming low volume (1-2 items per flush)
    Object.values(aggregated).forEach(item => {
        apiClient.post('/activity/heartbeat', item).catch(console.error);
    });
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
    return () => {
        clearInterval(interval);
        flushQueue(); // Flush on unmount
    };
  }, [flushQueue]);

  return null; // Logic only hook
};
