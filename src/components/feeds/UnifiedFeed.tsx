// src/components/feeds/UnifiedFeed.tsx
import React, { useEffect, useRef, useMemo } from 'react'; 
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
  const { startRadio, playSingle, stop, currentArticle, updateContextQueue } = useRadio();
  const { handleShare } = useShare(); 
  const isMobile = useIsMobile(); 
  const vibrate = useHaptic(); 
  
  // Ref to prevent infinite loops by tracking the signature of data sent to context
  const prevSentIds = useRef<string>('');

  // 3. Radio Synchronization (Stabilized)
  // Memoize the list of playable articles to ensure stability
  const playableArticles = useMemo(() => {
    return feedItems.filter(item => item.type !== 'Narrative') as IArticle[];
  }, [feedItems]);

  // Create a stable string signature of the IDs
  const contentSignature = useMemo(() => {
    return playableArticles.map(a => a._id).join(',');
  }, [playableArticles]);

  useEffect(() => {
      // If no articles, nothing to sync
      if (!contentSignature) return;

      // Only proceed if the content signature has actually changed
      if (contentSignature !== prevSentIds.current) {
          let label = 'Latest News';
          if (mode === 'foryou') label = 'For You';
          if (mode === 'personalized') label = 'Your Feed';
          if (filters?.category && filters.category !== 'All Categories') label = filters.category;
          
          updateContextQueue(playableArticles, label);
          
          // Update ref to lock this signature
          prevSentIds.current = contentSignature;
      }
  }, [contentSignature, playableArticles, mode, filters, updateContextQueue]);

  // 4. Handle Manual Refresh
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
                        <FeedItemRenderer
                            key={item._id}
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
                    
                    <div style={{ height: '80px', flexShrink: 0, scrollSnapAlign: 'none' }} />
                </>
            )}
        </div>
    </div>
  );
};

export default UnifiedFeed;
