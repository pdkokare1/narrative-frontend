// src/components/feeds/LatestFeed.js
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query'; // <--- NEW
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
  
  // Refs for "Smart Start" Radio
  const [visibleArticleIndex, setVisibleArticleIndex] = useState(0);
  const articleRefs = useRef([]);
  const bottomSentinelRef = useRef(null);

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
    queryKey: ['latestFeed', filters], // Filters in key = Auto-refetch on change
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await api.fetchArticles({ ...filters, limit: 12, offset: pageParam });
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      // Calculate total articles loaded so far
      const loadedCount = allPages.reduce((acc, page) => acc + page.articles.length, 0);
      const totalAvailable = lastPage.pagination?.total || 0;
      
      // If we have more to load, return the next offset
      return loadedCount < totalAvailable ? loadedCount : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Flatten the pages into a single list of articles
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

  // --- 3. Infinite Scroll Observer ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // If bottom visible AND we have more pages AND we aren't already fetching
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '400px' } // Pre-fetch before user hits absolute bottom
    );
    
    const sentinel = bottomSentinelRef.current;
    if (sentinel) observer.observe(sentinel);
    return () => { if (sentinel) observer.unobserve(sentinel); };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // --- 4. "Smart Start" Radio Observer ---
  useEffect(() => {
    if (isFetching && !isFetchingNextPage) return; // Don't track during initial load
    if (articles.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.index);
            if (!isNaN(index)) setVisibleArticleIndex(index);
          }
        });
      },
      { threshold: 0.6 }
    );
    
    // Observe new refs
    articleRefs.current.forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [articles.length, isFetching, isFetchingNextPage]);

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

  // --- Render ---
  return (
    <>
      {/* Category Pills */}
      <div style={{ marginBottom: '20px' }}>
        <CategoryPills 
          selectedCategory={filters.category} 
          onSelect={handleCategorySelect} 
        />
      </div>

      {/* Start Radio Button */}
      {!isPlaying && articles.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px' }}>
            <button 
                onClick={() => startRadio(articles, visibleArticleIndex)}
                className="btn-primary"
                style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                <span>▶</span> Start News Radio
            </button>
        </div>
      )}

      {/* Articles Grid */}
      <div className="articles-grid">
        {/* Initial Loading State */}
        {status === 'pending' ? (
           [...Array(6)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> ))
        ) : (
           articles.map((article, index) => (
            <div 
                className="article-card-wrapper" 
                key={article._id || index}
                ref={el => articleRefs.current[index] = el}
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
          ))
        )}
        
        {/* Load More Skeletons */}
        {isFetchingNextPage && (
           [...Array(3)].map((_, i) => ( <div className="article-card-wrapper" key={`more-${i}`}><SkeletonCard /></div> ))
        )}
      </div>

      {/* Empty State */}
      {status === 'success' && articles.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
            <p>No articles found matching your current filters.</p>
        </div>
      )}

      {/* Scroll Sentinel (Invisible line to trigger load more) */}
      <div ref={bottomSentinelRef} style={{ height: '20px', marginBottom: '20px', marginTop: '20px' }} />
      
      {/* End of Feed Message */}
      {!hasNextPage && status === 'success' && articles.length > 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
              <p>You've caught up with the latest news!</p>
          </div>
      )}
    </>
  );
}

export default LatestFeed;
