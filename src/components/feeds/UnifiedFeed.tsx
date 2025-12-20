// src/components/feeds/UnifiedFeed.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'; 
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../../services/api'; 
import ArticleCard from '../ArticleCard';
import NarrativeCard from '../NarrativeCard'; 
import SkeletonCard from '../ui/SkeletonCard';
import CategoryPills from '../ui/CategoryPills';
import { useToast } from '../../context/ToastContext';
import { useRadio } from '../../context/RadioContext';
import useShare from '../../hooks/useShare'; 
import useIsMobile from '../../hooks/useIsMobile'; 
import useHaptic from '../../hooks/useHaptic'; 
import { IArticle, INarrative, IFilters, FeedItem } from '../../types';
import './UnifiedFeed.css'; 

// --- Custom Hook for Infinite Scroll ---
function useIntersectionObserver(
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

interface UnifiedFeedProps {
  mode: 'latest' | 'foryou' | 'personalized';
  filters?: IFilters; 
  onFilterChange?: (filters: IFilters) => void;
  onAnalyze: (article: IArticle) => void;
  onCompare: (article: IArticle) => void;
  onOpenNarrative: (narrative: INarrative) => void; 
  savedArticleIds: Set<string>;
  onToggleSave: (article: IArticle) => void;
  showTooltip: (text: string, e: React.MouseEvent) => void;
  scrollToTopRef?: React.RefObject<HTMLDivElement>;
}

// --- STABLE COMPONENTS ---

// Manual Refresh Icon (Simple SVG)
const RefreshIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 4v6h-6"></path>
        <path d="M1 20v-6h6"></path>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
);

const FeedHeader: React.FC<{ 
  mode: string; 
  filters: IFilters; 
  onFilterChange?: (f: IFilters) => void; 
  vibrate: () => void; 
  metaData: any;
  onRefresh: () => void;
  isRefreshing: boolean;
}> = React.memo(({ mode, filters, onFilterChange, vibrate, metaData, onRefresh, isRefreshing }) => {
  return (
    <div className="feed-header-sticky">
        <div style={{ flex: 1, overflow: 'hidden' }}>
            {mode === 'latest' && onFilterChange && (
                <CategoryPills 
                  categories={["All", "Technology", "Business", "Science", "Health", "Entertainment", "Sports", "World", "Politics"]}
                  selectedCategory={filters.category || 'All'} 
                  onSelectCategory={(cat) => { vibrate(); onFilterChange({ ...filters, category: cat }); }} 
                />
            )}
            
            {mode === 'foryou' && metaData && (
                 <div style={{ paddingBottom: '5px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    <p>Based on interest in <strong>{metaData.basedOnCategory || 'various topics'}</strong>.</p>
                 </div>
            )}
            {mode === 'personalized' && metaData && (
                 <div style={{ paddingBottom: '5px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    <p>Curated from <strong>{metaData.topCategories?.join(', ') || 'your history'}</strong>.</p>
                 </div>
            )}
        </div>

        {/* MANUAL REFRESH BUTTON */}
        <button 
            className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`} 
            onClick={onRefresh}
            aria-label="Refresh Feed"
        >
            <RefreshIcon />
        </button>
    </div>
  );
});

const UnifiedFeed: React.FC<UnifiedFeedProps> = ({ 
  mode,
  filters = {}, 
  onFilterChange, 
  onAnalyze, 
  onCompare, 
  onOpenNarrative,
  savedArticleIds, 
  onToggleSave, 
  showTooltip, 
  scrollToTopRef 
}) => {
  const { addToast } = useToast();
  const { startRadio, playSingle, stop, currentArticle, isPlaying, updateContextQueue } = useRadio();
  const { handleShare } = useShare(); 
  const isMobile = useIsMobile(); 
  const vibrate = useHaptic(); 
  const queryClient = useQueryClient();
  
  const [showNewPill, setShowNewPill] = useState(false); 
  const [isRefreshing, setIsRefreshing] = useState(false);

  // CONSTANTS
  const BATCH_SIZE = 24; 

  // --- DATA FETCHING ---
  const latestQuery = useInfiniteQuery({
    queryKey: ['latestFeed', JSON.stringify(filters)],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const { data } = await api.fetchArticles({ ...filters, limit: BATCH_SIZE, offset: pageParam as number });
        return data;
      } catch (error) {
        console.error('[UnifiedFeed] Fetch Error:', error);
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

  // --- INFINITE SCROLL TRIGGER (OPTIMIZED) ---
  const handleLoadMore = useCallback(() => {
      if (latestQuery.hasNextPage && !latestQuery.isFetchingNextPage) {
          latestQuery.fetchNextPage();
      }
  }, [latestQuery.hasNextPage, latestQuery.isFetchingNextPage, latestQuery.fetchNextPage]);

  const loadMoreRef = useIntersectionObserver(handleLoadMore);

  // --- DATA EXTRACTION ---
  const activeQuery = mode === 'latest' ? latestQuery : (mode === 'foryou' ? forYouQuery : personalizedQuery);
  const { status } = activeQuery;

  const feedItems = useMemo(() => {
    let rawList: FeedItem[] = [];
    
    // Safety check: only process if success/data exists
    if (!activeQuery.data) return [];

    if (mode === 'latest') {
      // FIX: Added optional chaining (?.) and fallback (|| []) to satisfy TypeScript
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

  // --- RADIO REGISTRATION ---
  useEffect(() => {
      const playableArticles = feedItems.filter(item => item.type !== 'Narrative') as IArticle[];
      
      if (playableArticles.length > 0) {
          let label = 'Latest News';
          if (mode === 'foryou') label = 'For You';
          if (mode === 'personalized') label = 'Your Feed';
          if (filters?.category && filters.category !== 'All Categories') label = filters.category;
          
          updateContextQueue(playableArticles, label);
      }
  }, [feedItems, mode, filters, updateContextQueue]);

  // --- LIVE UPDATES ---
  useEffect(() => {
      if (mode !== 'latest') return;
      const checkForUpdates = async () => {
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

  const handleRefresh = async () => {
      vibrate();
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
      if (scrollToTopRef?.current) {
          scrollToTopRef.current.scrollTop = 0;
      }
  };

  const metaData = mode !== 'latest' ? (activeQuery.data as any)?.meta : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* NEW CONTENT PILL */}
        <div className={`new-content-pill ${showNewPill ? 'visible' : ''}`} onClick={handleRefresh}>
            <span>↑ New Articles Available</span>
        </div>

        {/* HEADER */}
        <FeedHeader 
            mode={mode} 
            filters={filters} 
            onFilterChange={onFilterChange} 
            vibrate={vibrate} 
            metaData={metaData}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
        />

        {/* SCROLLABLE GRID */}
        <div 
            className={`articles-grid ${isMobile ? 'mobile-stack' : ''}`} 
            ref={scrollToTopRef}
        >
            {status === 'pending' && !isRefreshing ? (
                 <>
                   {[...Array(8)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> )) }
                 </>
            ) : status === 'error' ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
                    <p>Unable to load feed.</p>
                    <button onClick={() => window.location.reload()} className="btn-secondary" style={{ marginTop: '10px' }}>Retry</button>
                </div>
            ) : feedItems.length === 0 && !isRefreshing ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
                    <h3>No articles found</h3>
                    <p>Try refreshing or checking back later.</p>
                    <button onClick={handleRefresh} className="btn-secondary" style={{ marginTop: '15px' }}>Force Refresh</button>
                </div>
            ) : (
                <>
                    {feedItems.map((item) => {
                        // RENDER LOGIC: NARRATIVE VS ARTICLE
                        if (item.type === 'Narrative') {
                            return (
                                <div className="article-card-wrapper" key={item._id}>
                                    <NarrativeCard 
                                        data={item as INarrative}
                                        onClick={() => onOpenNarrative(item as INarrative)}
                                    />
                                </div>
                            );
                        } else {
                            const article = item as IArticle;
                            return (
                                <div className="article-card-wrapper" key={article._id}>
                                    <ArticleCard
                                        article={article}
                                        onCompare={() => onCompare(article)}
                                        onAnalyze={onAnalyze}
                                        onShare={() => handleShare(article)} 
                                        onRead={() => {
                                            api.logRead(article._id).catch(err => console.error("Log Read Error:", err));
                                            window.open(article.url, '_blank', 'noopener,noreferrer');
                                        }}
                                        showTooltip={showTooltip}
                                        isSaved={savedArticleIds.has(article._id)}
                                        onToggleSave={() => onToggleSave(article)}
                                        isPlaying={currentArticle?._id === article._id}
                                        onPlay={() => playSingle(article)}
                                        onStop={stop}
                                    />
                                </div>
                            );
                        }
                    })}

                    {/* AUTOMATIC LOAD MORE SENSOR */}
                    {mode === 'latest' && (
                        <div className="load-more-container" ref={loadMoreRef}>
                            {latestQuery.isFetchingNextPage ? (
                                <div className="spinner-small" />
                            ) : latestQuery.hasNextPage ? (
                                <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Loading more...</span>
                            ) : (
                                <div className="end-message">You're all caught up</div>
                            )}
                        </div>
                    )}
                    
                    {/* SPACER */}
                    <div style={{ height: '80px', flexShrink: 0, scrollSnapAlign: 'none' }} />
                </>
            )}
        </div>
    </div>
  );
};

export default UnifiedFeed;
