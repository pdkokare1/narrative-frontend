// src/components/feeds/UnifiedFeed.tsx
import React, { useState, useEffect, useMemo, useRef, forwardRef } from 'react'; 
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

// Removed problematic cache variable
// let feedStateCache: any = null; 

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
  
  const [visibleArticleIndex, setVisibleArticleIndex] = useState(0);
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
      const { data } = await api.fetchArticles({ ...filters, limit: 12, offset: pageParam as number });
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((acc, page) => acc + page.articles.length, 0);
      const totalAvailable = lastPage.pagination?.total || 0;
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
              if (data.articles && data.articles.length > 0) {
                  const latestRemote = new Date(data.articles[0].publishedAt).getTime();
                  const currentTop = latestQuery.data?.pages[0]?.articles[0];
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
      
      // Artificial delay for UX feeling
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
              // Resistance effect
              setPullY(Math.min(diff * 0.4, 120)); 
              // Prevent native scroll if pulling down at top
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

  const articles = useMemo(() => {
    let rawList: IArticle[] = [];
    if (mode === 'latest') {
      rawList = latestQuery.data?.pages.flatMap(page => page.articles) || [];
    } else {
      // @ts-ignore
      rawList = activeQuery.data?.articles || [];
    }
    return rawList.filter(a => !!a && !!a._id);
  }, [mode, latestQuery.data, activeQuery.data]);

  const metaData = mode !== 'latest' ? (activeQuery.data as any)?.meta : null;

  // --- FIX: SCROLL PARENT LOGIC ---
  useEffect(() => {
    // Only use the custom container if we are on mobile (where CSS sets overflow-y: auto)
    if (isMobile && scrollToTopRef?.current) {
        setScrollParent(scrollToTopRef.current);
    } else {
        // On desktop, let Virtuoso use the Window/Body scroll to prevent infinite loop
        setScrollParent(undefined);
    }
  }, [scrollToTopRef, isMobile]);

  useEffect(() => {
    // feedStateCache = null; // Removed
    if (scrollToTopRef?.current) scrollToTopRef.current.scrollTop = 0;
  }, [mode, filters, scrollToTopRef]);

  const GridList = useMemo(() => forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ style, children, ...props }, ref) => (
    <div ref={ref} {...props} style={{ ...style }} className="articles-grid">
      {children}
    </div>
  )), []);

  const GridItem = useMemo(() => forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, ...props }, ref) => (
    <div {...props} ref={ref} className="article-card-wrapper" style={{ margin: 0, minHeight: '300px' }}>
      {children}
    </div>
  )), []);

  const FeedHeader = () => (
    <div style={{ paddingBottom: '5px' }}> {/* Reduced from 20px */}
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

  const FeedFooter = () => {
      if (mode !== 'latest' || !latestQuery.isFetchingNextPage) return <div style={{ height: '60px' }} />;
      return (
        <div className="articles-grid" style={{ marginTop: '20px', paddingBottom: '40px' }}>
           {[...Array(4)].map((_, i) => ( <div className="article-card-wrapper" key={`skel-${i}`}><SkeletonCard /></div> ))}
        </div>
      );
  };

  const itemContent: GridItemContent<IArticle, unknown> = (index, article) => {
    if (!article || !article._id) return null;
    return (
        <ArticleCard
          article={article}
          onCompare={() => onCompare(article)}
          onAnalyze={onAnalyze}
          onShare={() => handleShare(article)} 
          onRead={() => {
              // Removed invalid getState call here to fix crash
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
  };

  // --- RENDER ---
  return (
    <>
        {/* PULL TO REFRESH INDICATOR */}
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
               <div style={{gridColumn: '1 / -1'}}><FeedHeader /></div>
               {[...Array(8)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> )) }
             </div>
        ) : status === 'error' ? (
            <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
                <p>Unable to load feed.</p>
                <button onClick={() => window.location.reload()} className="btn-secondary" style={{ marginTop: '10px' }}>Retry</button>
            </div>
        ) : articles.length === 0 ? (
            <>
              <FeedHeader />
              <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
                  <p>No articles found.</p>
              </div>
            </>
        ) : (
            <VirtuosoGrid
              key={`${mode}-${isMobile ? 'mobile' : 'desktop'}`}
              ref={virtuosoRef}
              // restoreStateFrom={feedStateCache} // Removed invalid prop
              customScrollParent={scrollParent}
              data={articles}
              initialItemCount={12} 
              endReached={() => { 
                  if (mode === 'latest' && latestQuery.hasNextPage) latestQuery.fetchNextPage(); 
              }}
              overscan={800} 
              rangeChanged={({ startIndex }) => setVisibleArticleIndex(startIndex)}
              components={{ Header: FeedHeader, Footer: FeedFooter, List: GridList, Item: GridItem }}
              itemContent={itemContent}
            />
        )}
    </>
  );
};

export default UnifiedFeed;
