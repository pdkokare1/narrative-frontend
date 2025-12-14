// src/components/feeds/LatestFeed.tsx
import React, { useState, useEffect, useMemo, useRef, forwardRef } from 'react'; 
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { VirtuosoGrid, VirtuosoGridHandle, GridItemContent } from 'react-virtuoso'; 
import * as api from '../../services/api'; 
import ArticleCard from '../ArticleCard';
import SkeletonCard from '../ui/SkeletonCard';
import CategoryPills from '../ui/CategoryPills';
import { useToast } from '../../context/ToastContext';
import { useRadio } from '../../context/RadioContext';
import useShare from '../../hooks/useShare'; 
import useIsMobile from '../../hooks/useIsMobile'; 
import { IArticle, IFilters } from '../../types';

// --- GLOBAL STATE CACHE ---
let feedStateCache: any = null;

interface LatestFeedProps {
  filters: IFilters;
  onFilterChange: (filters: IFilters) => void;
  onAnalyze: (article: IArticle) => void;
  onCompare: (article: IArticle) => void;
  savedArticleIds: Set<string>;
  onToggleSave: (article: IArticle) => void;
  showTooltip: (text: string, e: React.MouseEvent) => void;
  scrollToTopRef: React.RefObject<HTMLDivElement>;
}

const LatestFeed: React.FC<LatestFeedProps> = ({ 
  filters, 
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
  const queryClient = useQueryClient();
  
  const [visibleArticleIndex, setVisibleArticleIndex] = useState(0);
  const virtuosoRef = useRef<VirtuosoGridHandle>(null);
  const [scrollParent, setScrollParent] = useState<HTMLElement | undefined>(undefined);

  // --- PULL TO REFRESH STATE ---
  const [pullStartY, setPullStartY] = useState(0);
  const [pullMoveY, setPullMoveY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const PULL_THRESHOLD = 80;

  useEffect(() => {
    if (scrollToTopRef?.current) {
        setScrollParent(scrollToTopRef.current);
    }
  }, [scrollToTopRef]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    status,
    error
  } = useInfiniteQuery({
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
    staleTime: 1000 * 60 * 5, 
  });

  const articles = useMemo(() => {
    return data?.pages.flatMap(page => page.articles) || [];
  }, [data]);

  // --- RESTORE SCROLL ---
  useEffect(() => {
    return () => {
      if (virtuosoRef.current) {
        // @ts-ignore
        feedStateCache = virtuosoRef.current.getState();
      }
    };
  }, []);

  useEffect(() => {
    feedStateCache = null; 
    if (scrollToTopRef?.current) {
        scrollToTopRef.current.scrollTop = 0;
    }
  }, [filters, scrollToTopRef]);

  useEffect(() => {
    if (status === 'error') {
        console.error("Feed Error:", error);
        addToast('Failed to load articles.', 'error');
    }
  }, [status, error, addToast]);

  // --- PULL TO REFRESH HANDLERS ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollParent && scrollParent.scrollTop === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY > 0 && scrollParent && scrollParent.scrollTop === 0) {
      const currentY = e.touches[0].clientY;
      if (currentY > pullStartY) {
        setPullMoveY(currentY - pullStartY);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullMoveY > PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullMoveY(60); // Snap to loading height
      try {
        await queryClient.resetQueries({ queryKey: ['latestFeed', filters] });
        await refetch();
        addToast('Feed updated', 'success');
      } catch (e) {
        addToast('Refresh failed', 'error');
      } finally {
        setIsRefreshing(false);
        setPullMoveY(0);
        setPullStartY(0);
      }
    } else {
      setPullMoveY(0);
      setPullStartY(0);
    }
  };

  const handleCategorySelect = (category: string) => {
    onFilterChange({ ...filters, category });
  };

  const handleReadClick = (article: IArticle) => {
    if (virtuosoRef.current) {
        // @ts-ignore
        feedStateCache = virtuosoRef.current.getState();
    }
    api.logRead(article._id).catch(err => console.error("Log Read Error:", err));
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

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
        <CategoryPills 
          selectedCategory={filters.category || 'All Categories'} 
          onSelect={handleCategorySelect} 
        />
        {!isPlaying && articles.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px', marginTop: '10px' }}>
                <button 
                    onClick={() => startRadio(articles, visibleArticleIndex)}
                    className="btn-primary"
                    style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <span>▶</span> Start News Radio
                </button>
            </div>
        )}
    </div>
  );

  const FeedFooter = () => {
      if (!isFetchingNextPage) return <div style={{ height: '40px' }} />;
      return (
        <div className="articles-grid" style={{ marginTop: '20px', paddingBottom: '40px' }}>
           {[...Array(4)].map((_, i) => ( <div className="article-card-wrapper" key={`skel-${i}`}><SkeletonCard /></div> ))}
        </div>
      );
  };

  const itemContent: GridItemContent<IArticle, unknown> = (index, article) => (
    <ArticleCard
      article={article}
      onCompare={() => onCompare(article)}
      onAnalyze={onAnalyze}
      onShare={() => handleShare(article)} 
      onRead={() => handleReadClick(article)}
      showTooltip={showTooltip}
      isSaved={savedArticleIds.has(article._id)}
      onToggleSave={() => onToggleSave(article)}
      isPlaying={currentArticle?._id === article._id}
      onPlay={() => playSingle(article)}
      onStop={stop}
    />
  );

  if (status === 'pending') {
      return (
         <div className="articles-grid">
           <div style={{gridColumn: '1 / -1'}}><FeedHeader /></div>
           {[...Array(8)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> )) }
         </div>
      );
  }

  if (status === 'success' && articles.length === 0) {
      return (
        <>
          <FeedHeader />
          <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
              <p>No articles found matching your current filters.</p>
          </div>
        </>
      );
  }

  return (
    <div 
      style={{ position: 'relative' }} 
      onTouchStart={handleTouchStart} 
      onTouchMove={handleTouchMove} 
      onTouchEnd={handleTouchEnd}
    >
      {/* --- PULL TO REFRESH INDICATOR --- */}
      <div 
        className={`ptr-element ${isRefreshing ? 'refreshing' : ''}`}
        style={{ marginTop: isRefreshing ? 0 : Math.min(pullMoveY, PULL_THRESHOLD) - 60 }}
      >
        <div className={`ptr-icon ${isRefreshing ? 'ptr-spinner' : ''} ${pullMoveY > PULL_THRESHOLD * 0.8 ? 'rotate' : ''}`}>
           {isRefreshing ? '' : '↓'}
        </div>
      </div>

      <VirtuosoGrid
        key={isMobile ? 'mobile-view' : 'desktop-view'}
        ref={virtuosoRef}
        restoreStateFrom={feedStateCache} 
        customScrollParent={scrollParent}
        data={articles}
        initialItemCount={12} 
        endReached={() => { if (hasNextPage) fetchNextPage(); }}
        overscan={1000} 
        rangeChanged={({ startIndex }) => setVisibleArticleIndex(startIndex)}
        components={{ Header: FeedHeader, Footer: FeedFooter, List: GridList, Item: GridItem }}
        itemContent={itemContent}
      />
    </div>
  );
};

export default LatestFeed;
