// src/hooks/useFeedQuery.ts
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';
import { IFilters, FeedItem } from '../types';

// Helper hook for scroll detection
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = { threshold: 0.1, rootMargin: '100px' }
) {
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
      }
    }, options);

    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [callback, options]);

  return targetRef;
}

// MATCHED WITH BACKEND CONTROLLER
const BATCH_SIZE = 24;

export const useFeedQuery = (mode: 'latest' | 'foryou' | 'personalized', filters: IFilters) => {
  const queryClient = useQueryClient();
  const [showNewPill, setShowNewPill] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // --- MAIN FEED QUERY ---
  const latestQuery = useInfiniteQuery({
    queryKey: ['latestFeed', JSON.stringify(filters)],
    queryFn: async ({ pageParam = 0 }) => {
        // Backend now accepts limit=24 for caching optimization
        const { data } = await api.fetchArticles({ ...filters, limit: BATCH_SIZE, offset: pageParam as number });
        return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, allPages) => {
      const lastPageItems = Array.isArray(lastPage) ? lastPage : (lastPage?.articles || lastPage?.data || []);
      if (!lastPageItems || lastPageItems.length < BATCH_SIZE) return undefined;

      const loadedCount = allPages.reduce((acc, page: any) => {
          const items = Array.isArray(page) ? page : (page?.articles || page?.data || []);
          return acc + items.length;
      }, 0);
      
      const totalAvailable = lastPage?.pagination?.total || lastPage?.total;
      
      if (typeof totalAvailable === 'number' && loadedCount >= totalAvailable) return undefined;
      
      return loadedCount;
    },
    enabled: mode === 'latest',
    staleTime: 1000 * 60 * 5, 
  });

  const forYouQuery = useQuery({
    queryKey: ['forYouFeed'],
    queryFn: async () => { const { data } = await api.fetchForYouArticles(); return data; },
    enabled: mode === 'foryou',
    staleTime: 1000 * 60 * 15,
  });

  const personalizedQuery = useQuery({
    queryKey: ['personalizedFeed'],
    queryFn: async () => { const { data } = await api.fetchPersonalizedArticles(); return data; },
    enabled: mode === 'personalized',
    staleTime: 1000 * 60 * 10,
  });

  // --- AGGREGATION ---
  const activeQuery = mode === 'latest' ? latestQuery : (mode === 'foryou' ? forYouQuery : personalizedQuery);
  const { status, error } = activeQuery;

  const feedItems = useMemo(() => {
    let rawList: FeedItem[] = [];
    if (!activeQuery.data) return [];

    if (mode === 'latest') {
      rawList = latestQuery.data?.pages.flatMap((page: any) => {
        const p = page;
        return Array.isArray(p) ? p : (p?.articles || p?.data || []);
      }) || [];
    } else {
      const data = activeQuery.data as any;
      rawList = Array.isArray(data) ? data : (data?.articles || data?.data || []);
    }
    
    // Deduplicate & Filter Safety Check
    const seen = new Set<string>();
    return rawList.filter(item => {
        if (!item?._id) return false;
        if (seen.has(item._id)) return false;
        
        // SAFETY: Filter out pending analysis
        if (item.type === 'Article' && item.analysisVersion === 'pending') return false;

        seen.add(item._id);
        return true;
    });
  }, [mode, latestQuery.data, activeQuery.data]);


  // --- SMART POLLING ---
  const { data: latestHeadItem } = useQuery({
    queryKey: ['latestHeadCheck', JSON.stringify(filters)],
    queryFn: async () => {
        // FETCH 1 ITEM TO CHECK UPDATES
        // FIX: Added _t (Timestamp) to force network fetch (Bypasses Browser/CDN Cache)
        const { data } = await api.fetchArticles({ 
            ...filters, 
            limit: 1, 
            offset: 0,
            // @ts-ignore - Explicitly injecting cache buster that API might not natively type, but will serialize
            _t: Date.now() 
        });
        return data?.articles?.[0] || null;
    },
    enabled: mode === 'latest' && feedItems.length > 0 && !isRefreshing,
    refetchInterval: 30000, // 30s polling
  });

  useEffect(() => {
    if (latestHeadItem && feedItems[0]) {
        const remoteTime = new Date(latestHeadItem.publishedAt).getTime();
        const localTime = new Date(feedItems[0].publishedAt).getTime();
        
        if (remoteTime > localTime) {
            setShowNewPill(true);
        }
    }
  }, [latestHeadItem, feedItems]);

  // --- ACTIONS ---
  const handleLoadMore = useCallback(() => {
      if (latestQuery.hasNextPage && !latestQuery.isFetchingNextPage) {
          latestQuery.fetchNextPage();
      }
  }, [latestQuery.hasNextPage, latestQuery.isFetchingNextPage, latestQuery.fetchNextPage]);

  const loadMoreRef = useIntersectionObserver(handleLoadMore);

  const refresh = async () => {
      setIsRefreshing(true);
      setShowNewPill(false);
      
      if (mode === 'latest') {
          queryClient.resetQueries({ queryKey: ['latestFeed'] });
          await latestQuery.refetch();
          queryClient.invalidateQueries({ queryKey: ['latestHeadCheck'] });
      } else if (mode === 'foryou') {
          await forYouQuery.refetch();
      } else {
          await personalizedQuery.refetch();
      }
      setIsRefreshing(false);
  };

  return {
    feedItems,
    status,
    error,
    isRefreshing,
    refresh,
    loadMoreRef,
    showNewPill,
    metaData: mode !== 'latest' ? (activeQuery.data as any)?.meta : null,
    isFetchingNextPage: latestQuery.isFetchingNextPage,
    hasNextPage: latestQuery.hasNextPage
  };
};
