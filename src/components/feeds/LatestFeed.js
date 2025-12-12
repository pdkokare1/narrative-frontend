// src/components/feeds/LatestFeed.js
import React, { useState, useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Virtuoso } from 'react-virtuoso'; // <--- NEW: Virtualization Engine
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
  scrollToTopRef // <--- We use this to attach virtualization to the main scrollbar
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
    isFetching,
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

  // --- Virtualized Components ---
  
  // The Header scrolls *with* the list
  const Header = () => (
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

  // The Footer shows loading skeletons at the bottom
  const Footer = () => {
      if (!isFetchingNextPage) return <div style={{ height: '20px' }} />; // Small padding
      return (
        <div style={{ paddingBottom: '40px' }}>
           {[...Array(3)].map((_, i) => ( 
             <div className="article-card-wrapper" key={`skel-${i}`} style={{ marginBottom: '25px' }}>
                <SkeletonCard />
             </div> 
           ))}
        </div>
      );
  };

  // --- Initial Loading State (Before Virtualization) ---
  if (status === 'pending') {
      return (
         <div className="articles-grid">
           <Header />
           {[...Array(6)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> )) }
         </div>
      );
  }

  // --- Empty State ---
  if (status === 'success' && articles.length === 0) {
      return (
        <>
          <Header />
          <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
              <p>No articles found matching your current filters.</p>
          </div>
        </>
      );
  }

  // --- Main Virtual List ---
  return (
    <Virtuoso
      customScrollParent={scrollParent} // Hooks into your main .content div
      data={articles}
      endReached={() => { if (hasNextPage) fetchNextPage(); }}
      overscan={500} // Render 500px ahead of viewport for smoothness
      rangeChanged={({ startIndex }) => setVisibleArticleIndex(startIndex)} // Updates Radio "Start From Here"
      components={{ Header, Footer }}
      itemContent={(index, article) => (
        <div 
            className="article-card-wrapper" 
            style={{ paddingBottom: '25px' }} // Spacing between cards
            data-index={index}
        >
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
        </div>
      )}
    />
  );
}

export default LatestFeed;
