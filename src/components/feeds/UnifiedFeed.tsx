// src/components/feeds/UnifiedFeed.tsx
import React, { useEffect, useRef, useMemo, useCallback } from 'react'; 
import CategoryPills from '../ui/CategoryPills';
import SkeletonCard from '../ui/SkeletonCard';
import { useRadio } from '../../context/RadioContext';
import useShare from '../../hooks/useShare'; 
import useIsMobile from '../../hooks/useIsMobile'; 
import useHaptic from '../../hooks/useHaptic'; 
import { IArticle, INarrative, IFilters } from '../../types';
import './UnifiedFeed.css'; 

// --- Refactored Imports ---
import { useFeedQuery } from '../../hooks/useFeedQuery';
import FeedItemRenderer from './FeedItemRenderer';

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

// --- STABLE UI COMPONENTS ---
const FeedHeader: React.FC<{ 
  mode: string; 
  filters: IFilters; 
  onFilterChange?: (f: IFilters) => void; 
  vibrate: () => void; 
  metaData: any;
}> = React.memo(({ mode, filters, onFilterChange, vibrate, metaData }) => {
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
  // 1. Logic via Hook
  const { 
      feedItems, status, isRefreshing, refresh, loadMoreRef, showNewPill, 
      metaData, isFetchingNextPage, hasNextPage 
  } = useFeedQuery(mode, filters);

  // 2. UI Hooks
  const { 
      startRadio, playSingle, stop, 
      currentArticle, updateContextQueue, 
      updateVisibleArticle, isPlaying 
  } = useRadio();
  
  const { handleShare } = useShare(); 
  const isMobile = useIsMobile(); 
  const vibrate = useHaptic(); 
  
  // Refs
  const prevSentIds = useRef<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const articleRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastScrolledId = useRef<string | null>(null); // Guard Ref for Scroll Loop

  // 3. Radio Synchronization (Stabilized)
  const playableArticles = useMemo(() => {
    return feedItems.filter(item => item.type !== 'Narrative') as IArticle[];
  }, [feedItems]);

  const contentSignature = useMemo(() => {
    return playableArticles.map(a => a._id).join(',');
  }, [playableArticles]);

  useEffect(() => {
      if (!contentSignature) return;
      if (contentSignature !== prevSentIds.current) {
          let label = 'Latest News';
          if (mode === 'foryou') label = 'For You';
          if (mode === 'personalized') label = 'Your Feed';
          if (filters?.category && filters.category !== 'All Categories') label = filters.category;
          
          updateContextQueue(playableArticles, label);
          prevSentIds.current = contentSignature;
      }
  }, [contentSignature, playableArticles, mode, filters, updateContextQueue]);

  // 4. SMART START: Intersection Observer to track visible article
  useEffect(() => {
      if (status !== 'success') return;

      const options = {
          root: null, // viewport
          rootMargin: '0px',
          threshold: 0.6 // 60% visibility required to be "active"
      };

      observerRef.current = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
              if (entry.isIntersecting) {
                  const id = entry.target.getAttribute('data-article-id');
                  if (id) {
                      updateVisibleArticle(id);
                  }
              }
          });
      }, options);

      // Attach to all current article refs
      articleRefs.current.forEach((element) => {
          if (element) observerRef.current?.observe(element);
      });

      return () => {
          observerRef.current?.disconnect();
      };
  }, [feedItems, status, updateVisibleArticle]);

  // 5. AUTO-SCROLL: When Radio changes tracks, scroll feed to that article
  // FIXED: Strictly guarded to run ONCE per article ID
  useEffect(() => {
      const currentId = currentArticle?._id;

      if (isPlaying && currentId) {
          // If we already scrolled for this exact article ID, stop.
          // This prevents the "infinite fetch" loop where re-renders trigger repeated scrolls.
          if (currentId === lastScrolledId.current) return;

          const element = articleRefs.current.get(currentId);
          if (element) {
              lastScrolledId.current = currentId; // Mark handled
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [currentArticle?._id, isPlaying]);

  // Helper to manage refs
  const setArticleRef = useCallback((el: HTMLDivElement | null, id: string) => {
      if (el) {
          articleRefs.current.set(id, el);
          if (observerRef.current) observerRef.current.observe(el);
      } else {
          articleRefs.current.delete(id);
      }
  }, []);

  const handleRefresh = () => {
      vibrate();
      refresh();
      if (scrollToTopRef?.current) {
          scrollToTopRef.current.scrollTop = 0;
      }
  };

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
                    {feedItems.map((item) => (
                        <div 
                            key={item._id} 
                            ref={(el) => setArticleRef(el, item._id)} 
                            data-article-id={item._id} 
                            // Added class 'feed-article-wrapper' for CSS targeting
                            className={`feed-article-wrapper ${currentArticle?._id === item._id ? 'now-playing-highlight' : ''}`}
                        >
                            <FeedItemRenderer
                                item={item}
                                onOpenNarrative={onOpenNarrative}
                                onCompare={onCompare}
                                onAnalyze={onAnalyze}
                                onShare={handleShare}
                                savedArticleIds={savedArticleIds}
                                onToggleSave={onToggleSave}
                                showTooltip={showTooltip}
                                currentArticleId={currentArticle?._id}
                                playSingle={playSingle}
                                stop={stop}
                            />
                        </div>
                    ))}

                    {/* AUTOMATIC LOAD MORE SENSOR */}
                    {mode === 'latest' && (
                        <div className="load-more-container" ref={loadMoreRef}>
                            {isFetchingNextPage ? (
                                <div className="spinner-small" />
                            ) : hasNextPage ? (
                                <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Loading more...</span>
                            ) : (
                                <div className="end-message">You're all caught up</div>
                            )}
                        </div>
                    )}
                    
                    {/* Extra padding at bottom to ensure last item can be scrolled fully */}
                    <div style={{ height: '80px', flexShrink: 0, scrollSnapAlign: 'none' }} />
                </>
            )}
        </div>
    </div>
  );
};

export default UnifiedFeed;
