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

const BATCH_SIZE = 24;

export const useFeedQuery = (mode: 'latest' | 'foryou' | 'personalized', filters: IFilters) => {
  const queryClient = useQueryClient();
  const [showNewPill, setShowNewPill] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Track visibility to pause polling when tab/app is backgrounded
  const isPageVisible = useRef(true);

  useEffect(() => {
      const handleVisibilityChange = () => {
          isPageVisible.current = document.visibilityState === 'visible';
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // --- QUERIES ---
  const latestQuery = useInfiniteQuery({
    queryKey: ['latestFeed', JSON.stringify(filters)],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const { data } = await api.fetchArticles({ ...filters, limit: BATCH_SIZE, offset: pageParam as number });
        return data;
      } catch (error) {
        console.error('[FeedQuery] Fetch Error:', error);
        throw error;
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, allPages) => {
      const lastPageItems = Array.isArray(lastPage) ? lastPage : (lastPage?.articles || lastPage?.data || []);
      
      if (!lastPageItems || lastPageItems.length === 0) return undefined;
      if (lastPageItems.length < BATCH_SIZE) return undefined;

      const loadedCount = allPages.reduce((acc, page: any) => {
          const items = Array.isArray(page) ? page : (page?.articles || page?.data || []);
          return acc + items.length;
      }, 0);
      
      const totalAvailable = lastPage?.pagination?.total || lastPage?.total;
      if (typeof totalAvailable === 'number' && loadedCount >= totalAvailable) {
          return undefined;
      }
      
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
        if (Array.isArray(page)) return page;
        if (page?.articles && Array.isArray(page.articles)) return page.articles;
        if (page?.data && Array.isArray(page.data)) return page.data;
        return [];
      }) || [];
    } else {
      const data = activeQuery.data as any;
      if (Array.isArray(data)) rawList = data;
      else if (data?.articles && Array.isArray(data.articles)) rawList = data.articles;
      else if (data?.data && Array.isArray(data.data)) rawList = data.data;
    }
    
    // Deduplicate
    const seen = new Set<string>();
    return rawList.filter(item => {
        if (!item || typeof item !== 'object') return false;
        if (!item._id) return false;
        if (seen.has(item._id)) return false;
        seen.add(item._id);
        return true;
    });
  }, [mode, latestQuery.data, activeQuery.data]);

  // --- LIVE UPDATES CHECK (Smart Polling) ---
  useEffect(() => {
      if (mode !== 'latest') return;

      const checkForUpdates = async () => {
          // Optimization: Skip check if page is hidden to save battery/data
          if (!isPageVisible.current) return;

          try {
              const { data } = await api.fetchArticles({ ...filters, limit: 1, offset: 0 });
              let latestItem: FeedItem | null = null;
              
              if (data?.articles && data.articles.length > 0) latestItem = data.articles[0];
              // @ts-ignore
              else if (Array.isArray(data) && data.length > 0) latestItem = data[0];

              if (latestItem) {
                  const latestRemote = new Date(latestItem.publishedAt).getTime();
                  const currentPages = latestQuery.data?.pages;
                  const firstPage = currentPages?.[0] as any;
                  const currentTop = (Array.isArray(firstPage) ? firstPage[0] : firstPage?.articles?.[0]);
                  
                  if (currentTop && latestRemote > new Date(currentTop.publishedAt).getTime()) {
                      setShowNewPill(true);
                  }
              }
          } catch (e) { /* Ignore */ }
      };
      
      const interval = setInterval(checkForUpdates, 60000); 
      return () => clearInterval(interval);
  }, [mode, filters, latestQuery.data]);

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
