// In file: src/components/NewsFeed.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../services/api'; 
import ArticleCard from './ArticleCard';
import SkeletonCard from './ui/SkeletonCard';
import { useToast } from '../context/ToastContext';
import '../App.css'; // Ensure styles are loaded

function NewsFeed({ 
  filters, 
  onAnalyze, 
  onCompare, 
  savedArticleIds, 
  onToggleSave, 
  showTooltip 
}) {
  const [mode, setMode] = useState('latest'); // 'latest' or 'foryou'
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // For 'For You' metadata
  const [forYouMeta, setForYouMeta] = useState(null);

  const contentRef = useRef(null);
  const bottomSentinelRef = useRef(null);
  const { addToast } = useToast();

  // --- Handlers ---
  
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

  // --- Fetch Logic ---

  const fetchFeed = useCallback(async (isRefresh = false, isLoadMore = false) => {
    if (isRefresh) setIsRefreshing(true);
    else if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      if (mode === 'foryou') {
        // "For You" Logic (Always 1 page of curated content)
        const { data } = await api.fetchForYouArticles();
        setArticles(data.articles || []);
        setForYouMeta(data.meta);
        setTotalCount(data.articles?.length || 0);
      } else {
        // "Latest" Logic (Standard Paginated Feed)
        const offset = isLoadMore ? articles.length : 0;
        const { data } = await api.fetchArticles({ ...filters, limit: 12, offset });
        
        if (isLoadMore) {
          setArticles(prev => [...prev, ...data.articles]);
        } else {
          setArticles(data.articles || []);
        }
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      addToast('Failed to load articles.', 'error');
    } finally {
      if (isRefresh) setIsRefreshing(false);
      else if (isLoadMore) setLoadingMore(false);
      else setLoading(false);
    }
  }, [filters, mode, addToast, articles.length]);

  // Initial Fetch & Mode Switch
  useEffect(() => {
    fetchFeed(false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, mode]); // Re-fetch when filters or mode changes

  // Infinite Scroll Observer
  useEffect(() => {
    if (mode === 'foryou') return; // No infinite scroll for curated feed yet

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && articles.length < totalCount) {
          fetchFeed(false, true);
        }
      },
      { threshold: 0.1, rootMargin: '200px' } 
    );
    
    const currentSentinel = bottomSentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);
    
    return () => { if (currentSentinel) observer.unobserve(currentSentinel); };
  }, [loading, loadingMore, articles.length, totalCount, mode, fetchFeed]);


  // --- Render Helpers ---

  const renderToggle = () => (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px', marginTop: '10px' }}>
      <div style={{ 
        display: 'flex', background: 'var(--bg-elevated)', borderRadius: '25px', 
        padding: '4px', border: '1px solid var(--border-color)', position: 'relative' 
      }}>
        <button
          onClick={() => setMode('latest')}
          style={{
            background: mode === 'latest' ? 'var(--accent-primary)' : 'transparent',
            color: mode === 'latest' ? 'white' : 'var(--text-secondary)',
            border: 'none', borderRadius: '20px', padding: '8px 20px',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease',
            boxShadow: mode === 'latest' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
          }}
        >
          Latest News
        </button>
        <button
          onClick={() => setMode('foryou')}
          style={{
            background: mode === 'foryou' ? 'var(--accent-primary)' : 'transparent',
            color: mode === 'foryou' ? 'white' : 'var(--text-secondary)',
            border: 'none', borderRadius: '20px', padding: '8px 20px',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease',
            boxShadow: mode === 'foryou' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <span>Balanced For You</span>
          {mode !== 'foryou' && <span style={{ fontSize: '10px' }}>✨</span>}
        </button>
      </div>
    </div>
  );

  return (
    <main className="content" ref={contentRef}>
      
      {/* Pull to Refresh Indicator */}
      <div className="pull-to-refresh-container" style={{ display: isRefreshing ? 'flex' : 'none' }}>
        <div className="spinner-small"></div><p>Refreshing...</p>
      </div>

      {renderToggle()}

      {/* For You Meta Info */}
      {mode === 'foryou' && forYouMeta && !loading && (
        <div style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '12px' }}>
          <p>
            Based on your interest in <strong>{forYouMeta.basedOnCategory}</strong>. 
            Showing a mix of {forYouMeta.usualLean} sources and opposing views.
          </p>
        </div>
      )}

      {/* Feed Content */}
      {(loading && !loadingMore) ? (
        <div className="articles-grid">
           {[...Array(6)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> ))}
        </div>
      ) : (
        <>
          {articles.length > 0 ? (
            <div className="articles-grid">
              {articles.map((article) => (
                <div className="article-card-wrapper" key={article._id || article.url}>
                  <ArticleCard
                    article={article}
                    onCompare={() => onCompare(article)}
                    onAnalyze={onAnalyze}
                    onShare={() => handleShare(article)}
                    onRead={() => handleReadClick(article)}
                    showTooltip={showTooltip}
                    isSaved={savedArticleIds.has(article._id)}
                    onToggleSave={() => onToggleSave(article)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
                {mode === 'foryou' 
                 ? <p>Read more articles to unlock your personalized feed!</p> 
                 : <p>No articles found matching your current filters.</p>}
            </div>
          )}

          {/* Load More Sentinel */}
          {mode === 'latest' && articles.length < totalCount && (
            <div ref={bottomSentinelRef} className="article-card-wrapper load-more-wrapper" style={{ minHeight: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {loadingMore ? <div className="loading-container" style={{ minHeight: 'auto' }}><div className="spinner-small"></div></div> : <span style={{ opacity: 0 }}>Loading more...</span>}
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default NewsFeed;
