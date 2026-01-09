// src/components/feeds/UnifiedFeed.tsx
import React, { useEffect, useRef, useMemo, useCallback } from 'react'; 
import CategoryPills from '../ui/CategoryPills';
import SkeletonCard from '../ui/SkeletonCard';
import { useRadio } from '../../context/RadioContext';
import useShare from '../../hooks/useShare'; 
import useIsMobile from '../../hooks/useIsMobile'; 
import useHaptic from '../../hooks/useHaptic'; 
import { useActivityTracker } from '../../hooks/useActivityTracker'; // NEW
import { IArticle, INarrative, IFilters } from '../../types';
import './UnifiedFeed.css'; 
import { useFeedQuery } from '../../hooks/useFeedQuery';
import FeedItemRenderer from './FeedItemRenderer';

interface UnifiedFeedProps {
  mode: 'latest' | 'infocus' | 'balanced' | 'personalized';
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

// --- HEADER COMPONENT ---
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
            
            {mode === 'infocus' && (
                 <div style={{ padding: '8px 12px', background: 'var(--surface-paper)', borderBottom: '1px solid var(--border-color)' }}>
                    <p style={{margin:0, fontSize: '0.9rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                        Developing Narratives
                    </p>
                 </div>
            )}

            {mode === 'balanced' && metaData && (
                 <div style={{ padding: '8px 12px', background: 'var(--surface-paper)', borderBottom: '1px solid var(--border-color)' }}>
                    <p style={{margin:0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {metaData.reason || 'Broadening your perspective'}
                    </p>
                 </div>
            )}
        </div>
    </div>
  );
});

// --- MAIN COMPONENT ---
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
  // 1. Data Query Hook
  const { 
      feedItems, status, isRefreshing, refresh, loadMoreRef, showNewPill, 
      metaData, isFetchingNextPage, hasNextPage 
  } = useFeedQuery(mode, filters);

  // 2. Radio & UI Hooks
  const { 
      startRadio, playSingle, stop, 
      currentArticle, updateContextQueue, 
      updateVisibleArticle, isPlaying 
  } = useRadio();
  
  const { handleShare } = useShare(); 
  const isMobile = useIsMobile(); 
  const vibrate = useHaptic(); 
  
  // 3. Refs & State
  const prevSentIds = useRef<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const articleRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastScrolledId = useRef<string | null>(null);

  // 4. NEW: Activity Tracking
  // We maintain a map for O(1) lookups inside the tracker
  const articlesMap = useMemo(() => {
      const map = new Map();
      feedItems.forEach(i => { if(i.type === 'Article') map.set(i._id, i); });
      return map;
  }, [feedItems]);

  // We track local visibility for stats (separate from Radio's global active article)
  const [trackerVisibleId, setTrackerVisibleId] = React.useState<string>();
  useActivityTracker(trackerVisibleId, articlesMap);

  // 5. Radio Queue Synchronization
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
          if (mode === 'balanced') label = 'Balanced View';
          if (mode === 'infocus') label = 'In Focus';
          if (filters?.category && filters.category !== 'All') label = filters.category;
          
          updateContextQueue(playableArticles, label);
          prevSentIds.current = contentSignature;
      }
  }, [contentSignature, playableArticles, mode, filters, updateContextQueue]);

  // 6. Intersection Observer (Merged Radio + Stats)
  useEffect(() => {
      if (status !== 'success') return;

      const options = {
          root: null, 
          rootMargin: '0px',
          threshold: 0.6 // 60% visibility required
      };

      observerRef.current = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
              if (entry.isIntersecting) {
                  const id = entry.target.getAttribute('data-article-id');
                  if (id) {
                      updateVisibleArticle(id); // Radio Context
                      setTrackerVisibleId(id);  // Activity Tracker
                  }
              }
          });
      }, options);

      // Attach to all refs
      articleRefs.current.forEach((element) => {
          if (element) observerRef.current?.observe(element);
      });

      return () => {
          observerRef.current?.disconnect();
      };
  }, [feedItems, status, updateVisibleArticle]);

  // 7. Auto-Scroll to Active Radio Article
  useEffect(() => {
      const currentId = currentArticle?._id;

      if (isPlaying && currentId) {
          if (currentId === lastScrolledId.current) return;

          const element = articleRefs.current.get(currentId);
          if (element) {
              lastScrolledId.current = currentId; 
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [currentArticle?._id, isPlaying]);

  // Ref Helper
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

        {/* GRID */}
        <div 
            className={`articles-grid ${isMobile ? 'mobile-stack' : ''}`} 
            ref={scrollToTopRef}
        >
            {status === 'pending' && !isRefreshing ? (
                 <>
                   {[...Array(6)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> )) }
                 </>
            ) : status === 'error' ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
                    <p>Unable to load feed.</p>
                    <button onClick={handleRefresh} className="btn-secondary" style={{ marginTop: '10px' }}>Retry</button>
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

                    {/* LOAD MORE (Only for Latest) */}
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
                    
                    <div style={{ height: '80px', flexShrink: 0, scrollSnapAlign: 'none' }} />
                </>
            )}
        </div>
    </div>
  );
};

export default UnifiedFeed;
