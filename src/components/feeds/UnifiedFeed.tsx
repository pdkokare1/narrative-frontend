// src/components/feeds/UnifiedFeed.tsx
import React, { useState, useEffect, useMemo } from 'react'; 
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
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

// --- STABLE COMPONENTS ---

const FeedHeader: React.FC<{ 
  mode: string; 
  filters: IFilters; 
  onFilterChange?: (f: IFilters) => void; 
  vibrate: () => void; 
  metaData: any 
}> = React.memo(({ mode, filters, onFilterChange, vibrate, metaData }) => {
  return (
    <div className="feed-header-sticky">
        {mode === 'latest' && onFilterChange && (
            <CategoryPills 
              categories={["All", "Technology", "Business", "Science", "Health", "Entertainment", "Sports", "World", "Politics"]}
              selectedCategory={filters.category || 'All'} 
              onSelectCategory={(cat) => { vibrate(); onFilterChange({ ...filters, category: cat }); }} 
            />
        )}
        
        {/* Reduced bottom padding to tighten layout */}
        {mode === 'foryou' && metaData && (
             <div style={{ textAlign: 'center', paddingBottom: '5px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                <p>Based on your interest in <strong>{metaData.basedOnCategory || 'various topics'}</strong>. Including {metaData.usualLean || 'balanced'} sources and opposing views.</p>
             </div>
        )}
        {mode === 'personalized' && metaData && (
             <div style={{ textAlign: 'center', paddingBottom: '5px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                <p>Curated for you based on <strong>{metaData.topCategories?.join(', ') || 'your history'}</strong>.</p>
             </div>
        )}
    </div>
  );
});

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
  // Destructure updateContextQueue to register this feed
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
      // 1. ROBUST CHECK: Extract items correctly
      const lastPageItems = Array.isArray(lastPage) ? lastPage : (lastPage?.articles || lastPage?.data || []);
      
      // 2. STOP if the last page was empty (no more content)
      if (!lastPageItems || lastPageItems.length === 0) return undefined;

      // 3. STOP if we received fewer items than requested (implies end of list)
      if (lastPageItems.length < BATCH_SIZE) return undefined;

      // 4. Calculate next offset
      const loadedCount = allPages.reduce((acc, page: any) => {
          const items = Array.isArray(page) ? page : (page?.articles || page?.data || []);
          return acc + items.length;
      }, 0);
      
      // 5. Check against total ONLY if total is explicitly provided and valid
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

  // --- ROBUST ARTICLE EXTRACTION & DEDUPLICATION ---
  const activeQuery = mode === 'latest' ? latestQuery : (mode === 'foryou' ? forYouQuery : personalizedQuery);
  const { status } = activeQuery;

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
    
    // Deduplicate
    const seen = new Set<string>();
    return rawList.filter(a => {
        if (!a || typeof a !== 'object') return false;
        if (!a._id) return false;
        if (seen.has(a._id)) return false;
        seen.add(a._id);
        return true;
    });
  }, [mode, latestQuery.data, activeQuery.data]);

  // --- SMART RADIO REGISTRATION ---
  useEffect(() => {
      if (articles.length > 0) {
          let label = 'Latest News';
          if (mode === 'foryou') label = 'For You';
          if (mode === 'personalized') label = 'Your Feed';
          if (filters?.category && filters.category !== 'All Categories') label = filters.category;
          
          updateContextQueue(articles, label);
      }
  }, [articles, mode, filters, updateContextQueue]);

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

  // --- RENDER ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* NEW CONTENT PILL */}
        <div className={`new-content-pill ${showNewPill ? 'visible' : ''}`} onClick={handleRefresh}>
            <span>↑ New Articles Available</span>
        </div>

        {/* HEADER (Sticky) */}
        <FeedHeader 
            mode={mode} 
            filters={filters} 
            onFilterChange={onFilterChange} 
            vibrate={vibrate} 
            metaData={metaData} 
        />

        {/* SCROLLABLE GRID (With Snap) */}
        {/* The ref is attached here because THIS element scrolls now */}
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
            ) : articles.length === 0 && !isRefreshing ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
                    <h3>No articles found</h3>
                    <p>Try refreshing or checking back later.</p>
                    <button onClick={handleRefresh} className="btn-secondary" style={{ marginTop: '15px' }}>Force Refresh</button>
                </div>
            ) : (
                <>
                    {/* If refreshing, maybe show skeletons again or just keep content? 
                        Usually keeping content is better UX, but let's show skeletons if we cleared query. 
                        In handleRefresh we resetQueries for latestFeed. 
                        So status might go to 'pending' or 'fetching'. 
                    */}
                    {articles.map((article) => (
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
                    ))}

                    {/* MANUAL LOAD MORE BUTTON */}
                    {mode === 'latest' && (
                        <div className="load-more-container">
                            {latestQuery.isFetchingNextPage ? (
                                <div className="spinner-small" />
                            ) : latestQuery.hasNextPage ? (
                                <button 
                                    className="load-more-btn"
                                    onClick={() => { vibrate(); latestQuery.fetchNextPage(); }}
                                >
                                    Load More Articles
                                </button>
                            ) : (
                                <div className="end-message">You're all caught up</div>
                            )}
                        </div>
                    )}
                    
                    {/* SPACER FOR BOTTOM NAV */}
                    <div style={{ height: '80px', flexShrink: 0, scrollSnapAlign: 'none' }} />
                </>
            )}
        </div>
    </div>
  );
};

export default UnifiedFeed;
