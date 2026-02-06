// src/components/feeds/UnifiedFeed.tsx
import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react'; 
import CategoryPills from '../ui/CategoryPills';
import SkeletonCard from '../ui/SkeletonCard';
import NativeAdUnit from '../ui/NativeAdUnit'; 
import LoginModal from '../modals/LoginModal';
import SmartBriefingModal from '../modals/SmartBriefingModal'; 
import InFocusBar from '../InFocusBar'; 
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
import { API_URL } from '../../services/axiosInstance'; // Import URL for debug

interface UnifiedFeedProps {
  mode: 'latest' | 'infocus'; 
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
  activeTopic?: string | null; 
  onClearTopic?: () => void;
}> = React.memo(({ mode, filters, onFilterChange, vibrate, activeTopic, onClearTopic }) => {
  return (
    <div className="feed-header-sticky">
        <div style={{ flex: 1, overflow: 'hidden' }}>
            {mode === 'latest' && onFilterChange && !activeTopic && (
                <CategoryPills 
                  categories={["All", "Technology", "Business", "Science", "Health", "Entertainment", "Sports", "World", "Politics"]}
                  selectedCategory={filters.category || 'All'} 
                  onSelectCategory={(cat) => { vibrate(); onFilterChange({ ...filters, category: cat }); }} 
                />
            )}
            
            {mode === 'latest' && activeTopic && (
                 <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{margin:0, fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        Filtered by: <span style={{color:'var(--accent-primary)'}}>#{activeTopic}</span>
                    </p>
                    <button 
                        onClick={onClearTopic}
                        style={{ background:'none', border:'none', color:'var(--text-tertiary)', fontSize:'0.8rem', cursor:'pointer' }}
                    >
                        Clear ✕
                    </button>
                 </div>
            )}

            {mode === 'infocus' && (
                 <div style={{ padding: '8px 12px', background: 'var(--surface-paper)', borderBottom: '1px solid var(--border-color)' }}>
                    <p style={{margin:0, fontSize: '0.9rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Developing Narratives</p>
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
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const effectiveFilters = useMemo(() => ({
      ...filters,
      topic: activeTopic
  }), [filters, activeTopic]);

  // Capture specific error from hook
  const { 
      feedItems, status, isRefreshing, refresh, loadMoreRef, showNewPill, 
      isFetchingNextPage, hasNextPage,
      error // Assumes useFeedQuery returns 'error' object if status === 'error'
  } = useFeedQuery(mode, effectiveFilters) as any; // Cast to any to access 'error' if not in type def yet

  const { startRadio, playSingle, stop, currentArticle, updateContextQueue, updateVisibleArticle, isPlaying } = useRadio();
  const { handleShare } = useShare(); 
  const isMobile = useIsMobile(); 
  const vibrate = useHaptic(); 
  const { isGuest } = useAuth(); 

  const [showLoginModal, setShowLoginModal] = useState(false);

  const prevSentIds = useRef<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const articleRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastScrolledId = useRef<string | null>(null);

  const articlesMap = useMemo(() => {
      const map = new Map();
      feedItems.forEach((i: any) => { if(i.type === 'Article') map.set(i._id, i); });
      return map;
  }, [feedItems]);

  const [trackerVisibleId, setTrackerVisibleId] = React.useState<string>();
  useActivityTracker(trackerVisibleId, articlesMap);

  const playableArticles = useMemo(() => {
    return feedItems.filter((item: any) => item.type !== 'Narrative') as IArticle[];
  }, [feedItems]);

  const contentSignature = useMemo(() => {
    return playableArticles.map(a => a._id).join(',');
  }, [playableArticles]);

  useEffect(() => {
      if (!contentSignature) return;
      if (contentSignature !== prevSentIds.current) {
          let label = 'Latest News';
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

  const handleTopicClick = (topic: string) => {
     vibrate();
     setActiveTopic(prev => prev === topic ? null : topic);
     if (scrollToTopRef?.current) scrollToTopRef.current.scrollTop = 0;
  };

  return (
    <div className="feed-page-container">
        <div className={`new-content-pill ${showNewPill ? 'visible' : ''}`} onClick={handleRefresh}>
            <span>↑ New Articles Available</span>
        </div>

        {mode === 'latest' && (
            <InFocusBar 
                onTopicClick={handleTopicClick} 
                activeTopic={activeTopic} 
            />
        )}

        <FeedHeader 
            mode={mode} 
            filters={effectiveFilters} 
            onFilterChange={onFilterChange} 
            vibrate={vibrate} 
            activeTopic={activeTopic}
            onClearTopic={() => handleTopicClick(activeTopic!)}
        />

        <div className={`articles-grid ${isMobile ? 'mobile-stack' : ''}`} ref={scrollToTopRef}>
            {status === 'pending' && !isRefreshing ? (
                 <> {[...Array(6)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> )) } </>
            ) : status === 'error' ? (
                // --- DEBUG ERROR STATE ---
                <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)', padding: '20px' }}>
                    <p style={{ color: '#ff6b6b', fontWeight: 'bold' }}>Unable to load feed.</p>
                    <div style={{ 
                        fontSize: '0.75rem', 
                        fontFamily: 'monospace', 
                        background: '#2a2a2a', 
                        padding: '10px', 
                        borderRadius: '4px',
                        margin: '10px 0',
                        color: '#eee',
                        wordBreak: 'break-all'
                    }}>
                        Error: {error?.message || 'Unknown Error'}<br/>
                        Status: {error?.status || 'N/A'}<br/>
                        URL: {API_URL}
                    </div>
                    <button onClick={handleRefresh} className="btn-secondary" style={{ marginTop: '10px' }}>Retry</button>
                </div>
            ) : feedItems.length === 0 && !isRefreshing ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
                    <h3>No articles found</h3>
                    <p>{activeTopic ? `No stories found for #${activeTopic}` : "Try refreshing or checking back later."}</p>
                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '10px' }}>Connected to: {API_URL}</div>
                    <button onClick={handleRefresh} className="btn-secondary" style={{ marginTop: '15px' }}>Force Refresh</button>
                </div>
            ) : (
                <>
                    {feedItems.map((item: any, index: number) => (
                        <React.Fragment key={item._id}>
                             {index > 0 && index % 7 === 0 && (
                                <NativeAdUnit 
                                    slotId="1234567890" 
                                    layoutKey="-6t+ed+2i-1n-4w"
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
        
        <LoginModal 
            isOpen={showLoginModal} 
            onClose={() => setShowLoginModal(false)}
            message="Join The Gamut to save articles, listen to stories, and customize your feed."
        />
    </div>
  );
};

export default UnifiedFeed;
