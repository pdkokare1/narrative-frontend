// src/hooks/useFeedQuery.ts
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, useCallback } from 'react';
import apiClient from '../services/axiosInstance';
import { IArticle, INarrative, IFilters } from '../types';

type FeedMode = 'latest' | 'infocus' | 'balanced' | 'personalized';

interface FeedData {
  items: (IArticle | INarrative)[];
  meta?: any;
  total?: number;
}

export const useFeedQuery = (mode: FeedMode, filters: IFilters) => {
  const queryClient = useQueryClient();
  const [showNewPill, setShowNewPill] = useState(false);
  
  // Track the last refresh time to show "New Articles" pill
  const lastFetchTime = useRef(Date.now());

  // --- 1. Fetch Function ---
  const fetchFeed = async ({ pageParam = 0 }): Promise<FeedData> => {
    let endpoint = '/articles';
    const params: any = { 
      limit: 20, 
      offset: pageParam 
    };

    // Endpoint & Param Mapping
    if (mode === 'balanced') {
        endpoint = '/articles/balanced';
        // Balanced feed is curated by backend, standard sorts don't apply
    } else if (mode === 'infocus') {
        endpoint = '/articles/infocus';
        if (filters.category && !filters.category.startsWith('All')) {
            params.category = filters.category;
        }
    } else {
        // Mode: 'latest'
        endpoint = '/articles';
        
        // Apply all filters (Updated to handle "All ..." strings correctly)
        if (filters.category && !filters.category.startsWith('All')) {
            params.category = filters.category;
        }
        
        if (filters.sort) {
            params.sort = filters.sort;
        }
        
        if (filters.sentiment) {
            params.sentiment = filters.sentiment;
        }
        
        // Fixed: Check politicalLean and ignore "All Leans"
        if (filters.politicalLean && !filters.politicalLean.startsWith('All')) {
            params.politicalLean = filters.politicalLean;
        }
        
        if (filters.source) {
            params.source = filters.source;
        }

        // NEW: Topic Filter
        if (filters.topic) {
            params.topic = filters.topic;
        }
    }

    const { data } = await apiClient.get(endpoint, { params });

    return {
      items: data.data || [],
      meta: data.meta || {},
      total: data.total || 0
    };
  };

  // --- 2. Query Hook ---
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
    isRefetching
  } = useInfiniteQuery({
    queryKey: ['feed', mode, filters], // Unique key per mode/filter combo
    queryFn: fetchFeed,
    initialPageParam: 0, // <--- FIXED: Required in TanStack Query v5
    getNextPageParam: (lastPage, allPages) => {
      // Logic for infinite scroll
      const currentCount = allPages.flatMap(p => p.items).length;
      if (lastPage.items.length < 20) return undefined; // No more data
      return currentCount; // Use current count as offset
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnWindowFocus: false,
  });

  // --- 3. "New Content" Polling Logic ---
  // Only poll if we are at the top of the feed and in 'latest' mode
  useEffect(() => {
    if (mode !== 'latest') return;

    const interval = setInterval(async () => {
        // Simple check: Is there a newer article than our first one?
        try {
            const firstItem = data?.pages[0]?.items[0];
            if (!firstItem || !('publishedAt' in firstItem)) return;

            const latestRes = await apiClient.get('/articles', { params: { limit: 1, ...filters } });
            const serverLatest = latestRes.data.data[0];

            if (serverLatest && serverLatest._id !== firstItem._id) {
                setShowNewPill(true);
            }
        } catch (err) {
            // Silent fail
        }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [mode, filters, data]);

  // --- 4. Load More Observer (Callback Ref) ---
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (isFetchingNextPage) return; // Don't observe if already loading
    if (observerRef.current) observerRef.current.disconnect();

    if (node && hasNextPage) {
        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                fetchNextPage();
            }
        }, { threshold: 0.1 });
        
        observerRef.current.observe(node);
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // --- 5. Helper: Flatten Data ---
  const feedItems = data?.pages.flatMap(page => page.items) || [];
  const metaData = data?.pages[0]?.meta || {};

  const refresh = () => {
      setShowNewPill(false);
      lastFetchTime.current = Date.now();
      refetch();
  };

  return {
    feedItems,
    metaData,
    status,
    isRefreshing: isRefetching,
    refresh,
    loadMoreRef,
    showNewPill,
    isFetchingNextPage,
    hasNextPage
  };
};
