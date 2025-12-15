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

// Global cache for scroll position
let feedStateCache: any = null;

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

  // --- 1. DATA FETCHING LOGIC ---
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
    queryFn: async () => {
      const { data } = await api.fetchForYouArticles();
      return data;
    },
    enabled: mode === 'foryou',
    staleTime: 1000 * 60 * 15,
  });

  const personalizedQuery = useQuery({
    queryKey: ['personalizedFeed'],
    queryFn: async () => {
      const { data } = await api.fetchPersonalizedArticles();
      return data;
    },
    enabled: mode === 'personalized',
    staleTime: 1000 * 60 * 10,
  });

  // --- 2. LIVE UPDATES (POLLING) ---
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
          } catch (e) { /* Ignore poll errors */ }
      };
      const interval = setInterval(checkForUpdates, 60000); 
      return () => clearInterval(interval);
  }, [mode, filters, latestQuery.data]);

  const handleRefresh = () => {
      vibrate();
      setShowNewPill(false);
      queryClient.resetQueries({ queryKey: ['latestFeed'] });
      latestQuery.refetch();
      if (virtuosoRef.current) {
          virtuosoRef.current.scrollToIndex({ index: 0, align: 'start', behavior: 'smooth' });
      }
  };

  // --- 3. MERGE & FILTER DATA ---
  const activeQuery = mode === 'latest' ? latestQuery : (mode === 'foryou' ? forYouQuery : personalizedQuery);
  const { status, error } = activeQuery;

  const articles = useMemo(() => {
    let rawList: IArticle[] = [];
    if (mode === 'latest') {
      rawList = latestQuery.data?.pages.flatMap(page => page.articles) || [];
    } else {
      // @ts-ignore
      rawList = activeQuery.data?.articles || [];
    }
    // SAFETY CHECK: Filter out null/undefined articles
    return rawList.filter(a => !!a && !!a._id);
  }, [mode, latestQuery.data, activeQuery.data]);

  const metaData = mode !== 'latest' ? (activeQuery.data as any)?.meta : null;

  // --- 4. SCROLL & RESTORE ---
  useEffect(() => {
    if (scrollToTopRef?.current) setScrollParent(scrollToTopRef.current);
  }, [scrollToTopRef]);

  useEffect(() => {
    feedStateCache = null; 
    if (scrollToTopRef?.current) scrollToTopRef.current.scrollTop = 0;
  }, [mode, filters, scrollToTopRef]);

  // --- 5. RENDERERS ---
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
    <div style={{ paddingBottom: '20px' }}>
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

        {!isPlaying && articles.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px', marginTop: '10px' }}>
                <button 
                    onClick={() => { vibrate(); startRadio(articles, visibleArticleIndex); }}
                    className="btn-primary"
                    style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <span>▶</span> {mode === 'latest' ? 'Start News Radio' : 'Play Daily Mix'}
                </button>
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
    // DOUBLE SAFETY CHECK
    if (!article || !article._id) return null;

    return (
        <ArticleCard
          article={article}
          onCompare={() => onCompare(article)}
          onAnalyze={onAnalyze}
          onShare={() => handleShare(article)} 
          onRead={() => {
              if (virtuosoRef.current) {
                  feedStateCache = (virtuosoRef.current as any).getState();
              }
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

  if (status === 'pending') {
      return (
         <div className="articles-grid">
           <div style={{gridColumn: '1 / -1'}}><FeedHeader /></div>
           {[...Array(8)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> )) }
         </div>
      );
  }

  if (status === 'error') {
      return (
        <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
            <p>Unable to load feed.</p>
            <button onClick={() => window.location.reload()} className="btn-secondary" style={{ marginTop: '10px' }}>Retry</button>
        </div>
      );
  }

  if (articles.length === 0) {
      return (
        <>
          <FeedHeader />
          <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
              <p>No articles found.</p>
          </div>
        </>
      );
  }

  return (
    <>
        <div className={`new-content-pill ${showNewPill ? 'visible' : ''}`} onClick={handleRefresh}>
            <span>↑ New Articles Available</span>
        </div>

        <VirtuosoGrid
          key={`${mode}-${isMobile ? 'mobile' : 'desktop'}`}
          ref={virtuosoRef}
          restoreStateFrom={feedStateCache} 
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
    </>
  );
};

export default UnifiedFeed;
