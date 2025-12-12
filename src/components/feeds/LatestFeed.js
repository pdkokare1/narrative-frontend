// src/components/feeds/LatestFeed.js
import React, { useState, useEffect, useMemo, useRef, forwardRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { VirtuosoGrid } from 'react-virtuoso'; 
import * as api from '../../services/api'; 
import ArticleCard from '../ArticleCard';
import SkeletonCard from '../ui/SkeletonCard';
import CategoryPills from '../ui/CategoryPills';
import { useToast } from '../../context/ToastContext';
import { useRadio } from '../../context/RadioContext';

// --- GLOBAL STATE CACHE ---
// This lives outside the component lifecycle to persist scroll position
// even when you navigate away to an article and come back.
let feedStateCache = null;

function LatestFeed({ 
  filters, 
  onFilterChange, 
  onAnalyze, 
  onCompare, 
  savedArticleIds, 
  onToggleSave, 
  showTooltip,
  scrollToTopRef 
}) {
  const { addToast } = useToast();
  const { startRadio, playSingle, stop, currentArticle, isPlaying } = useRadio();
  
  // Track visibility for "Smart Start" Radio
  const [visibleArticleIndex, setVisibleArticleIndex] = useState(0);
  
  // Refs
  const virtuosoRef = useRef(null);
  const [scrollParent, setScrollParent] = useState(undefined);

  // Attach to main window scroll if ref is provided
  useEffect(() => {
    if (scrollToTopRef?.current) {
        setScrollParent(scrollToTopRef.current);
    }
  }, [scrollToTopRef]);

  // --- QUERY: Infinite Feed ---
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error
  } = useInfiniteQuery({
    queryKey: ['latestFeed', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await api.fetchArticles({ ...filters, limit: 12, offset: pageParam });
      return data;
    },
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

  // --- SCROLL RESTORATION LOGIC ---
  // 1. Save state when unmounting (leaving the page)
  useEffect(() => {
    return () => {
      if (virtuosoRef.current) {
        feedStateCache = virtuosoRef.current.getState();
      }
    };
  }, []);

  // 2. Reset scroll to top ONLY if filters change (Category/Sort)
  // We clear the cache so the user starts fresh on a new category.
  useEffect(() => {
    feedStateCache = null; 
    if (scrollToTopRef?.current) {
        scrollToTopRef.current.scrollTop = 0;
    }
  }, [filters, scrollToTopRef]);

  // --- ERROR HANDLING ---
  useEffect(() => {
    if (status === 'error') {
        console.error("Feed Error:", error);
        addToast('Failed to load articles.', 'error');
    }
  }, [status, error, addToast]);

  // --- HANDLERS ---
  const handleCategorySelect = (category) => {
    onFilterChange({ ...filters, category });
  };

  const handleReadClick = (article) => {
    // Save scroll state before navigating away
    if (virtuosoRef.current) {
        feedStateCache = virtuosoRef.current.getState();
    }
    api.logRead(article._id).catch(err => console.error("Log Read Error:", err));
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = (article) => {
    api.logShare(article._id).catch(err => console.error("Log Share Error:", err));
    const shareUrl = `${window.location.origin}?article=${article._id}`;
    if (navigator.share) {
      navigator.share({ title: article.headline, text: `Check this out: ${article.headline}`, url: shareUrl })
        .catch(() => navigator.clipboard.writeText(shareUrl).then(() => addToast('Link copied!', 'success')));
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => addToast('Link copied!', 'success'));
    }
  };

  // --- VIRTUOSO COMPONENTS (Grid Config) ---
  
  const GridList = useMemo(() => forwardRef(({ style, children, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      style={{ ...style }} 
      className="articles-grid" // CSS Grid Layout handles columns (1 mobile, 4 desktop)
    >
      {children}
    </div>
  )), []);

  const GridItem = useMemo(() => forwardRef(({ children, ...props }, ref) => (
    <div 
        {...props} 
        ref={ref}
        className="article-card-wrapper" 
        style={{ margin: 0, minHeight: '300px' }} // FIX: Enforce min-height to reduce layout shift
    >
      {children}
    </div>
  )), []);

  const FeedHeader = () => (
    <div style={{ paddingBottom: '20px' }}>
        <CategoryPills 
          selectedCategory={filters.category} 
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
           {[...Array(4)].map((_, i) => ( 
             <div className="article-card-wrapper" key={`skel-${i}`}>
                <SkeletonCard />
             </div> 
           ))}
        </div>
      );
  };

  // --- LOADING STATE ---
  if (status === 'pending') {
      return (
         <div className="articles-grid">
           <div style={{gridColumn: '1 / -1'}}><FeedHeader /></div>
           {[...Array(8)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> )) }
         </div>
      );
  }

  // --- EMPTY STATE ---
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

  // --- MAIN RENDER ---
  return (
    <VirtuosoGrid
      ref={virtuosoRef}
      restoreStateFrom={feedStateCache} // <--- FIX: Restores scroll position on back
      customScrollParent={scrollParent}
      data={articles}
      initialItemCount={12} // FIX: Ensures Desktop fills up immediately
      endReached={() => { if (hasNextPage) fetchNextPage(); }}
      overscan={1000} // FIX: Increased overscan to prevent white flashes on fast scroll
      rangeChanged={({ startIndex }) => setVisibleArticleIndex(startIndex)}
      components={{
        Header: FeedHeader,
        Footer: FeedFooter,
        List: GridList,
        Item: GridItem
      }}
      itemContent={(index, article) => (
        <ArticleCard
          article={article}
          onCompare={() => onCompare(article)}
          onAnalyze={onAnalyze}
          onShare={() => handleShare(article)}
          onRead={() => handleReadClick(article)}
          showTooltip={showTooltip}
          isSaved={savedArticleIds.has(article._id)}
          onToggleSave={() => onToggleSave(article)}
          isPlaying={currentArticle && currentArticle._id === article._id}
          onPlay={() => playSingle(article)}
          onStop={stop}
        />
      )}
    />
  );
}

export default LatestFeed;
