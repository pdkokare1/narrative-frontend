// src/components/feeds/UnifiedFeed.tsx
import React, { useState, useEffect, useMemo, useRef, forwardRef, useCallback } from 'react'; 
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { VirtuosoGrid, VirtuosoGridHandle, GridItemContent } from 'react-virtuoso'; 
import * as api from '../../services/api'; 
import ArticleCard from '../ArticleCard';
import SkeletonCard from '../ui/SkeletonCard';
import CategoryPills from '../ui/CategoryPills';
import { useToast } from '../../context/ToastContext';
import { useRadio } from '../../context/RadioContext';
import useShare from '../../hooks/useShare'; 
import useIsMobile from '../../hooks/useIsMobile'; 
import useHaptic from '../../hooks/useHaptic'; 
import { IArticle, IFilters } from '../../types';
import './UnifiedFeed.css'; 

interface UnifiedFeedProps {
  mode: 'latest' | 'foryou' | 'personalized';
  filters?: IFilters; 
  onFilterChange?: (filters: IFilters) => void;
  onAnalyze: (article: IArticle) => void;
  onCompare: (article: IArticle) => void;
  savedArticleIds: Set<string>;
  onToggleSave: (article: IArticle) => void;
  showTooltip: (text: string, e: React.MouseEvent) => void;
  scrollToTopRef?: React.RefObject<HTMLDivElement>;
}

// --- CONTEXT INTERFACE ---
interface FeedContext {
  mode: string;
  filters: IFilters;
  onFilterChange?: (filters: IFilters) => void;
  vibrate: () => void;
  metaData: any;
  isFetchingNextPage: boolean;
}

// --- STABLE COMPONENTS ---

const FeedHeader: React.FC<{ context?: FeedContext }> = React.memo(({ context }) => {
  if (!context) return null;
  const { mode, filters, onFilterChange, vibrate, metaData } = context;

  return (
    <div style={{ paddingBottom: '5px' }}>
        {mode === 'latest' && onFilterChange && (
            <CategoryPills 
              selectedCategory={filters.category || 'All Categories'} 
              onSelect={(cat) => { vibrate(); onFilterChange({ ...filters, category: cat }); }} 
            />
        )}
        
        {mode === 'foryou' && metaData && (
             <div style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                <p>Based on your interest in <strong>{metaData.basedOnCategory}</strong>. Including {metaData.usualLean} sources and opposing views.</p>
             </div>
        )}
        {mode === 'personalized' && metaData && (
             <div style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                <p>Curated for you based on <strong>{metaData.topCategories?.join(', ')}</strong>.</p>
             </div>
        )}
    </div>
  );
});

const FeedFooter: React.FC<{ context?: FeedContext }> = React.memo(({ context }) => {
  // Only show skeletons if strictly fetching next page
  if (!context || (context.mode === 'latest' && !context.isFetchingNextPage)) return <div style={{ height: '60px' }} />;
  if (context.mode !== 'latest') return <div style={{ height: '60px' }} />;
  
  return (
    <div className="articles-grid" style={{ marginTop: '20px', paddingBottom: '40px' }}>
       {[...Array(4)].map((_, i) => ( <div className="article-card-wrapper" key={`skel-${i}`}><SkeletonCard /></div> ))}
    </div>
  );
});

// FIX: Merge styles properly and disable overflow anchoring
const GridList = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ style, children, ...props }, ref) => (
  <div 
    ref={ref} 
    {...props} 
    style={{ ...style, overflowAnchor: 'none', paddingBottom: '20px' }} 
    className="articles-grid"
  >
    {children}
  </div>
));

const GridItem = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, style, ...props }, ref) => (
  <div 
    {...props} 
    ref={ref} 
    className="article-card-wrapper" 
    style={{ ...style, margin: 0, minHeight: '300px', height: '100%' }}
  >
    {children}
  </div>
));

const UnifiedFeed: React.FC<UnifiedFeedProps> = ({ 
  mode,
  filters = {}, 
  onFilterChange, 
  onAnalyze, 
  onCompare, 
  savedArticleIds, 
  onToggleSave, 
  showTooltip, 
  scrollToTopRef 
}) => {
  const { addToast } = useToast();
  const { startRadio, playSingle, stop, currentArticle, isPlaying } = useRadio();
  const { handleShare } = useShare(); 
  const isMobile = useIsMobile(); 
  const vibrate = useHaptic(); 
  const queryClient = useQueryClient();
  
  const virtuosoRef = useRef<VirtuosoGridHandle>(null);
  const [scrollParent, setScrollParent] = useState<HTMLElement | undefined>(undefined);
  const [showNewPill, setShowNewPill] = useState(false); 

  // --- PULL TO REFRESH STATE ---
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartRef = useRef(0);
  const isDraggingRef = useRef(false);

  // --- DATA FETCHING ---
  const latestQuery = useInfiniteQuery({
    queryKey: ['latestFeed', filters],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const { data } = await api.fetchArticles({ ...filters, limit: 12, offset: pageParam as number });
        return data;
      } catch (error) {
        console.error('[UnifiedFeed] Fetch Error:', error);
        throw error;
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, allPages) => {
      const loadedCount = allPages.reduce((acc, page: any) => {
          const items = Array.isArray(page) ? page : (page?.articles || page?.data || []);
          return acc + items.length;
      }, 0);
      
      const totalAvailable = lastPage?.pagination?.total || lastPage?.total || 10000;
      
      return loadedCount < totalAvailable ? loadedCount : undefined;
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

  // --- LIVE UPDATES ---
  useEffect(() => {
      if (mode !== 'latest') return;
      const checkForUpdates = async () => {
          try {
              const { data } = await api.fetchArticles({ ...filters, limit: 1, offset: 0 });
              let latestArticle: IArticle | null = null;
              
              if (data?.articles && data.articles.length > 0) latestArticle = data.articles[0];
              // @ts-ignore
              else if (Array.isArray(data) && data.length > 0) latestArticle = data[0];

              if (latestArticle) {
                  const latestRemote = new Date(latestArticle.publishedAt).getTime();
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
      
      await new Promise(r => setTimeout(r, 800));

      if (mode === 'latest') {
          queryClient.resetQueries({ queryKey: ['latestFeed'] });
          await latestQuery.refetch();
      } else if (mode === 'foryou') {
          await forYouQuery.refetch();
      } else {
          await personalizedQuery.refetch();
      }
      
      setIsRefreshing(false);
      setPullY(0);
      if (virtuosoRef.current) {
          virtuosoRef.current.scrollToIndex({ index: 0, align: 'start', behavior: 'smooth' });
      }
  };

  // --- PULL GESTURE HANDLERS ---
  useEffect(() => {
      if (!isMobile || !scrollToTopRef?.current) return;
      const container = scrollToTopRef.current;

      const handleTouchStart = (e: TouchEvent) => {
          if (container.scrollTop <= 0) {
              touchStartRef.current = e.touches[0].clientY;
              isDraggingRef.current = true;
          }
      };

      const handleTouchMove = (e: TouchEvent) => {
          if (!isDraggingRef.current) return;
          const y = e.touches[0].clientY;
          const diff = y - touchStartRef.current;
          
          if (diff > 0 && container.scrollTop <= 0) {
              setPullY(Math.min(diff * 0.4, 120)); 
              if (diff > 10 && e.cancelable) e.preventDefault(); 
          } else {
              setPullY(0);
          }
      };

      const handleTouchEnd = () => {
          isDraggingRef.current = false;
          if (pullY > 60) {
              handleRefresh();
          } else {
              setPullY(0);
          }
      };

      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);

      return () => {
          container.removeEventListener('touchstart', handleTouchStart);
          container.removeEventListener('touchmove', handleTouchMove);
          container.removeEventListener('touchend', handleTouchEnd);
      };
  }, [isMobile, scrollToTopRef, pullY]);


  const activeQuery = mode === 'latest' ? latestQuery : (mode === 'foryou' ? forYouQuery : personalizedQuery);
  const { status } = activeQuery;

  // --- ROBUST ARTICLE EXTRACTION ---
  const articles = useMemo(() => {
    let rawList: IArticle[] = [];
    
    if (mode === 'latest') {
      if (!latestQuery.data) return [];
      
      rawList = latestQuery.data.pages.flatMap((page: any) => {
        if (Array.isArray(page)) return page;
        if (page?.articles && Array.isArray(page.articles)) return page.articles;
        if (page?.data && Array.isArray(page.data)) return page.data;
        return [];
      });
      
    } else {
      const data = activeQuery.data as any;
      if (Array.isArray(data)) rawList = data;
      else if (data?.articles && Array.isArray(data.articles)) rawList = data.articles;
      else if (data?.data && Array.isArray(data.data)) rawList = data.data;
    }
    
    return rawList.filter(a => !!a && !!a._id);
  }, [mode, latestQuery.data, activeQuery.data]);

  const metaData = mode !== 'latest' ? (activeQuery.data as any)?.meta : null;

  // --- SCROLL PARENT LOGIC ---
  useEffect(() => {
    if (scrollToTopRef?.current) {
        setScrollParent(scrollToTopRef.current);
    } else {
        setScrollParent(undefined);
    }
  }, [scrollToTopRef]);

  useEffect(() => {
    if (scrollToTopRef?.current) scrollToTopRef.current.scrollTop = 0;
  }, [mode, filters, scrollToTopRef]);

  // --- MEMOIZED COMPONENTS ---
  const gridComponents = useMemo(() => ({
      Header: FeedHeader,
      Footer: FeedFooter,
      List: GridList,
      Item: GridItem
  }), []);

  const feedContextValue = useMemo(() => ({
      mode,
      filters,
      onFilterChange,
      vibrate,
      metaData,
      isFetchingNextPage: latestQuery.isFetchingNextPage
  }), [mode, filters, onFilterChange, vibrate, metaData, latestQuery.isFetchingNextPage]);

  // --- MEMOIZED ITEM CONTENT ---
  const itemContent: GridItemContent<IArticle, unknown> = useCallback((index, article) => {
    if (!article || !article._id) return null;
    return (
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
    );
  }, [onCompare, onAnalyze, handleShare, showTooltip, savedArticleIds, onToggleSave, currentArticle, playSingle, stop]);

  // --- RENDER ---
  return (
    <>
        <div 
            className="pull-refresh-indicator" 
            style={{ 
                height: `${pullY}px`, 
                opacity: pullY > 0 ? 1 : 0 
            }}
        >
            {isRefreshing ? (
                <div className="spinner-small" style={{width: '20px', height: '20px'}}></div>
            ) : (
                <span style={{ transform: `rotate(${pullY * 2}deg)` }}>↓</span>
            )}
        </div>

        <div className={`new-content-pill ${showNewPill ? 'visible' : ''}`} onClick={handleRefresh}>
            <span>↑ New Articles Available</span>
        </div>

        {status === 'pending' ? (
             <div className="articles-grid">
               <div style={{gridColumn: '1 / -1', paddingBottom: '20px'}}>
                  <div className="skeleton-pulse" style={{width: '100%', height: '40px', borderRadius: '20px'}}></div>
               </div>
               {[...Array(8)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> )) }
             </div>
        ) : status === 'error' ? (
            <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
                <p>Unable to load feed.</p>
                <button onClick={() => window.location.reload()} className="btn-secondary" style={{ marginTop: '10px' }}>Retry</button>
            </div>
        ) : articles.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
                <h3>No articles found</h3>
                <p>Try refreshing or checking back later.</p>
                <button onClick={handleRefresh} className="btn-secondary" style={{ marginTop: '15px' }}>Force Refresh</button>
            </div>
        ) : (
            <VirtuosoGrid
              key={mode} 
              ref={virtuosoRef}
              // FIX: Default to FALSE (internal scrolling) on desktop if no custom parent is found. 
              // This prevents the infinite loop where Window scroll is 0 but content is growing.
              useWindowScroll={isMobile ? !scrollParent : false}
              style={{ height: '100%', width: '100%' }}
              customScrollParent={scrollParent}
              data={articles}
              computeItemKey={(index, article) => article._id}
              context={feedContextValue} 
              initialItemCount={12} 
              // FIX: Added STRICT check for !isFetchingNextPage to stop infinite loops
              endReached={() => { 
                  if (mode === 'latest' && latestQuery.hasNextPage && !latestQuery.isFetchingNextPage) {
                      latestQuery.fetchNextPage(); 
                  }
              }}
              // FIX: Reduced overscan to prevent eager fetching of next page
              overscan={400} 
              components={gridComponents} 
              itemContent={itemContent}   
            />
        )}
    </>
  );
};

export default UnifiedFeed;
