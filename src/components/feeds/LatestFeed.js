// src/components/feeds/LatestFeed.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  scrollToTopRef // Parent passes this so we can scroll top on filter change
}) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  // Scroll Tracking
  const [visibleArticleIndex, setVisibleArticleIndex] = useState(0);
  const articleRefs = useRef([]);
  const bottomSentinelRef = useRef(null);
  
  const { addToast } = useToast();
  const { startRadio, playSingle, stop, currentArticle, isPlaying } = useRadio();

  // --- 1. Fetch Logic ---
  const fetchFeed = useCallback(async (isLoadMore = false) => {
    if (isLoadMore && loadingMore) return;

    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const offset = isLoadMore ? articles.length : 0;
      const { data } = await api.fetchArticles({ ...filters, limit: 12, offset });
      
      if (isLoadMore) {
        setArticles(prev => [...prev, ...data.articles]);
      } else {
        setArticles(data.articles || []);
      }
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error('Fetch error:', error);
      addToast('Failed to load articles.', 'error');
    } finally {
      if (isLoadMore) setLoadingMore(false);
      else setLoading(false);
    }
  }, [filters, articles.length, loadingMore, addToast]);

  // --- 2. Initial Load & Filter Change ---
  useEffect(() => {
    setLoading(true);
    fetchFeed(false);
    if (scrollToTopRef?.current) scrollToTopRef.current.scrollTop = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // --- 3. Infinite Scroll Observer ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && articles.length < totalCount) {
          fetchFeed(true);
        }
      },
      { threshold: 0.1, rootMargin: '300px' }
    );
    
    const sentinel = bottomSentinelRef.current;
    if (sentinel) observer.observe(sentinel);
    return () => { if (sentinel) observer.unobserve(sentinel); };
  }, [loading, loadingMore, articles.length, totalCount, fetchFeed]);

  // --- 4. "Smart Start" Radio Observer ---
  // Tracks which article is at the top of the screen so Radio starts there
  useEffect(() => {
    if (loading || articles.length === 0) return;
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
    
    articleRefs.current.forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [articles, loading]);

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
      navigator.share({ title: article.headline, text: `Check this out: ${article.headline}`, url: shareUrl });
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
        {loading && !loadingMore ? (
           [...Array(6)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> ))
        ) : (
           articles.map((article, index) => (
            <div 
                className="article-card-wrapper" 
                key={article._id || article.url}
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
        
        {loadingMore && (
           [...Array(3)].map((_, i) => ( <div className="article-card-wrapper" key={`more-${i}`}><SkeletonCard /></div> ))
        )}
      </div>

      {/* Empty State */}
      {!loading && articles.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
            <p>No articles found matching your current filters.</p>
        </div>
      )}

      {/* Scroll Sentinel */}
      {articles.length < totalCount && (
        <div ref={bottomSentinelRef} style={{ height: '20px', marginBottom: '20px' }} />
      )}
      
      {/* End of Feed Message */}
      {!loading && !loadingMore && articles.length >= totalCount && articles.length > 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
              <p>You've caught up with the latest news!</p>
          </div>
      )}
    </>
  );
}

export default LatestFeed;
