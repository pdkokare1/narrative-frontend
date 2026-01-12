// src/components/feeds/UnifiedFeed.tsx
import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react'; 
import CategoryPills from '../ui/CategoryPills';
import SkeletonCard from '../ui/SkeletonCard';
import NativeAdUnit from '../ui/NativeAdUnit'; 
import LoginModal from '../modals/LoginModal'; 
import { useRadio } from '../../context/RadioContext';
import useShare from '../../hooks/useShare'; 
import useIsMobile from '../../hooks/useIsMobile'; 
import useHaptic from '../../hooks/useHaptic'; 
import { useActivityTracker } from '../../hooks/useActivityTracker'; 
import { IArticle, INarrative, IFilters } from '../../types';
import './UnifiedFeed.css'; 
import { useFeedQuery } from '../../hooks/useFeedQuery';
import FeedItemRenderer from './FeedItemRenderer';
import { useAuth } from '../../context/AuthContext'; 

interface UnifiedFeedProps {
  mode: 'latest' | 'infocus' | 'balanced'; 
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
            {/* Other headers preserved */}
            {mode === 'infocus' && (
                 <div style={{ padding: '8px 12px', background: 'var(--surface-paper)', borderBottom: '1px solid var(--border-color)' }}>
                    <p style={{margin:0, fontSize: '0.9rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Developing Narratives</p>
                 </div>
            )}
            {mode === 'balanced' && metaData && (
                 <div style={{ padding: '8px 12px', background: 'var(--surface-paper)', borderBottom: '1px solid var(--border-color)' }}>
                    <p style={{margin:0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{metaData.reason || 'Broadening your perspective'}</p>
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
  const { 
      feedItems, status, isRefreshing, refresh, loadMoreRef, showNewPill, 
      metaData, isFetchingNextPage, hasNextPage 
  } = useFeedQuery(mode, filters);

  const { startRadio, playSingle, stop, currentArticle, updateContextQueue, updateVisibleArticle, isPlaying } = useRadio();
  const { handleShare } = useShare(); 
  const isMobile = useIsMobile(); 
  const vibrate = useHaptic(); 
  const { isGuest } = useAuth(); 

  // Local state for Login Modal
  const [showLoginModal, setShowLoginModal] = useState(false);

  const prevSentIds = useRef<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const articleRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastScrolledId = useRef<string | null>(null);

  const articlesMap = useMemo(() => {
      const map = new Map();
      feedItems.forEach(i => { if(i.type === 'Article') map.set(i._id, i); });
      return map;
  }, [feedItems]);

  const [trackerVisibleId, setTrackerVisibleId] = React.useState<string>();
  useActivityTracker(trackerVisibleId, articlesMap);

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

  useEffect(() => {
      if (status !== 'success') return;
      const options = { root: null, rootMargin: '0px', threshold: 0.6 };
      observerRef.current = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
              if (entry.isIntersecting) {
                  const id = entry.target.getAttribute('data-article-id');
                  if (id) {
                      updateVisibleArticle(id); 
                      setTrackerVisibleId(id);  
                  }
              }
          });
      }, options);
      articleRefs.current.forEach((element) => {
          if (element) observerRef.current?.observe(element);
      });
      return () => { observerRef.current?.disconnect(); };
  }, [feedItems, status, updateVisibleArticle]);

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
      if (scrollToTopRef?.current) scrollToTopRef.current.scrollTop = 0;
  };

  // --- Handle Interactions with Guest Check ---
  const handleToggleSaveWrapper = (article: IArticle) => {
      if (isGuest) {
          setShowLoginModal(true);
      } else {
          onToggleSave(article);
      }
  };

  const handlePlayWrapper = (article: IArticle) => {
      if (isGuest) {
          setShowLoginModal(true);
      } else {
          playSingle(article);
      }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div className={`new-content-pill ${showNewPill ? 'visible' : ''}`} onClick={handleRefresh}>
            <span>↑ New Articles Available</span>
        </div>

        <FeedHeader mode={mode} filters={filters} onFilterChange={onFilterChange} vibrate={vibrate} metaData={metaData} />

        <div className={`articles-grid ${isMobile ? 'mobile-stack' : ''}`} ref={scrollToTopRef}>
            {status === 'pending' && !isRefreshing ? (
                 <> {[...Array(6)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> )) } </>
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
                    {feedItems.map((item, index) => (
                        <React.Fragment key={item._id}>
                             {/* NATIVE AD INJECTION: Every 7 items */}
                             {index > 0 && index % 7 === 0 && (
                                <NativeAdUnit 
                                    slotId="1234567890" // REPLACE WITH REAL ID
                                    layoutKey="-6t+ed+2i-1n-4w" // REPLACE WITH REAL KEY
                                    // Removed className="feed-ad-wrapper" to prevent CSS conflicts
                                />
                             )}

                            <div 
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
                                    onToggleSave={handleToggleSaveWrapper} 
                                    showTooltip={showTooltip}
                                    currentArticleId={currentArticle?._id}
                                    playSingle={handlePlayWrapper} 
                                    stop={stop}
                                />
                            </div>
                        </React.Fragment>
                    ))}

                    {mode === 'latest' && (
                        <div className="load-more-container" ref={loadMoreRef}>
                            {isFetchingNextPage ? ( <div className="spinner-small" /> ) : hasNextPage ? ( <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Loading more...</span> ) : ( <div className="end-message">You're all caught up</div> )}
                        </div>
                    )}
                    <div style={{ height: '80px', flexShrink: 0, scrollSnapAlign: 'none' }} />
                </>
            )}
        </div>
        
        {/* Guest Login Prompt */}
        <LoginModal 
            isOpen={showLoginModal} 
            onClose={() => setShowLoginModal(false)}
            message="Join The Gamut to save articles, listen to stories, and customize your feed."
        />
    </div>
  );
};

export default UnifiedFeed;
