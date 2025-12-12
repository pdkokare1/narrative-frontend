// src/components/feeds/LatestFeed.js
import React, { useState, useEffect, useMemo, forwardRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { VirtuosoGrid } from 'react-virtuoso'; 
import * as api from '../../services/api'; 
import ArticleCard from '../ArticleCard';
import SkeletonCard from '../ui/SkeletonCard';
import CategoryPills from '../ui/CategoryPills';
import { useToast } from '../../context/ToastContext';
import { useRadio } from '../../context/RadioContext';

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
  
  // Capture the scroll container for Virtuoso
  const [scrollParent, setScrollParent] = useState(undefined);

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
      // Fetch 12 articles per page (perfect for 1, 2, 3, or 4 column layouts)
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

  // --- 1. Scroll to Top on Filter Change ---
  useEffect(() => {
    if (scrollToTopRef?.current) {
        scrollToTopRef.current.scrollTop = 0;
    }
  }, [filters, scrollToTopRef]);

  // --- 2. Error Handling ---
  useEffect(() => {
    if (status === 'error') {
        console.error("Feed Error:", error);
        addToast('Failed to load articles.', 'error');
    }
  }, [status, error, addToast]);

  // --- Handlers ---
  const handleCategorySelect = (category) => {
    onFilterChange({ ...filters, category });
  };

  const handleReadClick = (article) => {
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
  
  // 1. The List Container (Acts as the CSS Grid)
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

  // 2. The Item Container (Wraps each card)
  const GridItem = useMemo(() => forwardRef(({ children, ...props }, ref) => (
    <div 
        {...props} 
        ref={ref}
        className="article-card-wrapper" 
        style={{ margin: 0 }} 
    >
      {children}
    </div>
  )), []);

  // 3. Header
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

  // 4. Footer (Loading Skeletons)
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

  // --- Initial Loading State ---
  if (status === 'pending') {
      return (
         <div className="articles-grid">
           <div style={{gridColumn: '1 / -1'}}><FeedHeader /></div>
           {[...Array(8)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> )) }
         </div>
      );
  }

  // --- Empty State ---
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

  // --- MAIN RENDER: VIRTUOSO GRID ---
  return (
    <VirtuosoGrid
      customScrollParent={scrollParent}
      data={articles}
      // --- FIX: Force rendering initial items to fill desktop grid immediately ---
      initialItemCount={12} 
      endReached={() => { if (hasNextPage) fetchNextPage(); }}
      overscan={600} 
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
