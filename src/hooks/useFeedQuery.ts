// src/hooks/useFeedQuery.ts
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';
import { IFilters, FeedItem } from '../types';

export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = { threshold: 0.1, rootMargin: '100px' }
) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) callback();
    }, options);
    const curr = targetRef.current;
    if (curr) observer.observe(curr);
    return () => { if (curr) observer.unobserve(curr); };
  }, [callback, options]);
  return targetRef;
}

const BATCH_SIZE = 20;

// FIX: Explicitly defined all valid modes including 'balanced'
type FeedQueryMode = 'latest' | 'infocus' | 'balanced' | 'personalized';

export const useFeedQuery = (mode: FeedQueryMode, filters: IFilters) => {
  const queryClient = useQueryClient();
  const [showNewPill, setShowNewPill] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 1. Latest Feed (Weighted Merge - Infinite)
  const latestQuery = useInfiniteQuery({
    queryKey: ['latestFeed', JSON.stringify(filters)],
    queryFn: async ({ pageParam = 0 }) => {
        const { data } = await api.fetchArticles({ ...filters, limit: BATCH_SIZE, offset: pageParam as number });
        return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, allPages) => {
      const items = lastPage?.articles || [];
      if (items.length < BATCH_SIZE) return undefined;
      return allPages.length * BATCH_SIZE;
    },
    enabled: mode === 'latest',
    staleTime: 1000 * 60 * 2, // 2 mins (Fresher for breaking news)
  });

  // 2. In Focus (Narratives - Single Page)
  const inFocusQuery = useQuery({
    queryKey: ['inFocusFeed', JSON.stringify(filters)],
    queryFn: async () => { const { data } = await api.fetchInFocusArticles(filters); return data; },
    enabled: mode === 'infocus',
    staleTime: 1000 * 60 * 15,
  });

  // 3. Balanced (User Stats - Single Page)
  const balancedQuery = useQuery({
    queryKey: ['balancedFeed'],
    queryFn: async () => { const { data } = await api.fetchBalancedArticles(); return data; },
    enabled: mode === 'balanced',
    staleTime: 1000 * 60 * 5, // 5 mins (Refresh as user bias stats update)
  });

  // 4. Personalized (Legacy/Fallback)
  const personalizedQuery = useQuery({
    queryKey: ['personalizedFeed'],
    queryFn: async () => { const { data } = await api.fetchPersonalizedArticles(); return data; },
    enabled: mode === 'personalized',
    staleTime: 1000 * 60 * 10,
  });

  const activeQuery = mode === 'latest' ? latestQuery : (mode === 'infocus' ? inFocusQuery : (mode === 'balanced' ? balancedQuery : personalizedQuery));
  const { status, error } = activeQuery;

  const feedItems = useMemo(() => {
    if (!activeQuery.data) return [];
    let raw: FeedItem[] = [];

    if (mode === 'latest') {
      raw = latestQuery.data?.pages.flatMap((p: any) => p.articles || []) || [];
    } else {
      raw = (activeQuery.data as any)?.articles || [];
    }
    
    // Dedup
    const seen = new Set<string>();
    return raw.filter(i => {
        if (!i?._id || seen.has(i._id)) return false;
        seen.add(i._id);
        return true;
    });
  }, [mode, activeQuery.data, latestQuery.data]);

  // --- SMART POLLING (Latest Only) ---
  const { data: latestHeadItem } = useQuery({
    queryKey: ['latestHeadCheck', JSON.stringify(filters)],
    queryFn: async () => {
        const { data } = await api.fetchArticles({ 
            ...filters, limit: 1, offset: 0, _t: Date.now() 
        });
        return data?.articles?.[0] || null;
    },
    enabled: mode === 'latest' && feedItems.length > 0 && !isRefreshing,
    refetchInterval: 30000, // 30s
  });

  useEffect(() => {
    if (latestHeadItem && feedItems[0] && mode === 'latest') {
        const remoteTime = new Date(latestHeadItem.publishedAt).getTime();
        const localTime = new Date(feedItems[0].publishedAt).getTime();
        if (remoteTime > localTime) setShowNewPill(true);
    }
  }, [latestHeadItem, feedItems, mode]);

  // Actions
  const handleLoadMore = useCallback(() => {
      if (mode === 'latest' && latestQuery.hasNextPage && !latestQuery.isFetchingNextPage) {
          latestQuery.fetchNextPage();
      }
  }, [mode, latestQuery]);

  const loadMoreRef = useIntersectionObserver(handleLoadMore);

  const refresh = async () => {
      setIsRefreshing(true);
      setShowNewPill(false);
      await activeQuery.refetch();
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
    metaData: (activeQuery.data as any)?.meta,
    isFetchingNextPage: latestQuery.isFetchingNextPage,
    hasNextPage: latestQuery.hasNextPage
  };
};
