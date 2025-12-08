// In file: src/components/NewsFeed.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import * as api from '../services/api'; 
import ArticleCard from './ArticleCard';
import SkeletonCard from './ui/SkeletonCard';
import CategoryPills from './ui/CategoryPills'; 
import { useToast } from '../context/ToastContext';
import '../App.css'; 
import useNewsRadio from '../hooks/useNewsRadio';
import './NewsRadio.css';

function NewsFeed({ 
  filters, 
  onFilterChange, 
  onAnalyze, 
  onCompare, 
  savedArticleIds, 
  onToggleSave, 
  showTooltip 
}) {
  const [mode, setMode] = useState('latest'); 
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false); 
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [forYouMeta, setForYouMeta] = useState(null);

  // --- NEW: Scroll Tracking State ---
  const [visibleArticleIndex, setVisibleArticleIndex] = useState(0);
  const articleRefs = useRef([]); // Array of refs for each card

  const contentRef = useRef(null);
  const bottomSentinelRef = useRef(null);
  const { addToast } = useToast();

  // --- RADIO HOOK ---
  const { 
    isSpeaking, 
    isPaused, 
    currentArticleId, 
    availableVoices, 
    selectedVoice,   
    changeVoice,
    startRadio, 
    playSingle, 
    stop, 
    pause, 
    resume, 
    skip,
    // New Props for "Up Next" logic
    isWaitingForNext,
    autoplayTimer,
    cancelAutoplay
  } = useNewsRadio();

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

  const handleCategorySelect = (category) => {
    onFilterChange({ ...filters, category });
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  const fetchFeed = useCallback(async (isRefresh = false, isLoadMore = false) => {
    if (isLoadMore && loadingMore) return; 

    if (isRefresh) setIsRefreshing(true);
    else if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      if (mode === 'foryou') {
        const { data } = await api.fetchForYouArticles();
        setArticles(data.articles || []);
        setForYouMeta(data.meta);
        setTotalCount(data.articles?.length || 0);
      } else {
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
  }, [filters, mode, addToast, articles.length, loadingMore]);

  // --- NEW: Scroll Observer for "Smart Start" ---
  useEffect(() => {
    if (loading || articles.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Get index from data-attribute
            const index = Number(entry.target.dataset.index);
            if (!isNaN(index)) {
              // Update state to track what user is looking at
              setVisibleArticleIndex(index);
            }
          }
        });
      },
      { threshold: 0.6 } // Trigger when 60% of card is visible
    );

    // Observe all current card refs
    articleRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [articles, loading]);


  useEffect(() => {
    setLoading(true); 
    fetchFeed(false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, mode]); 

  // Infinite Scroll
  useEffect(() => {
    if (mode === 'foryou') return; 
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && articles.length < totalCount) {
          fetchFeed(false, true);
        }
      },
      { threshold: 0.1, rootMargin: '300px' } 
    );
    const currentSentinel = bottomSentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);
    return () => { if (currentSentinel) observer.unobserve(currentSentinel); };
  }, [loading, loadingMore, articles.length, totalCount, mode, fetchFeed]);

  const renderToggle = () => (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px', marginTop: '10px' }}>
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
        </button>
      </div>
    </div>
  );

  const renderRadioBar = () => {
    if (articles.length === 0) return null;
    const activeArticle = articles.find(a => a._id === currentArticleId);
    
    return (
      <div className="radio-bar-container">
        <div className="radio-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span className="radio-status-text">
                {isSpeaking ? (isPaused ? "RADIO PAUSED" : "ON AIR") : "NEWS RADIO"}
            </span>
            
            {!isSpeaking && availableVoices.length > 0 && (
                <select 
                    className="voice-select" 
                    value={selectedVoice?.name || ''} 
                    onChange={(e) => changeVoice(e.target.value)}
                >
                    {availableVoices
                        .filter(v => v.lang.startsWith('en'))
                        .map(v => (
                            <option key={v.name} value={v.name}>
                                {v.name.replace(/Microsoft|Google|English|United States/g, '').trim() || v.name}
                            </option>
                        ))
                    }
                </select>
            )}
          </div>

          {isSpeaking && activeArticle && (
            <span className="radio-headline-preview">
              Now Reading: {activeArticle.headline}
            </span>
          )}
        </div>

        <div className="radio-controls">
          {!isSpeaking ? (
            // --- UPDATED: Pass visibleArticleIndex to startRadio ---
            <button className="radio-btn primary-action" onClick={() => startRadio(articles, visibleArticleIndex)}>
              Start Radio
            </button>
          ) : (
            <>
              {isPaused ? (
                <button className="radio-btn" onClick={resume}>Resume</button>
              ) : (
                <button className="radio-btn" onClick={pause}>Pause</button>
              )}
              <button className="radio-btn" onClick={skip}>Next</button>
              <button className="radio-btn stop-action" onClick={stop}>Stop</button>
            </>
          )}
        </div>
      </div>
    );
  };

  // --- NEW: Render "Up Next" Toast ---
  const renderUpNextToast = () => {
    if (!isWaitingForNext) return null;
    return (
      <div className="up-next-toast">
        <div className="up-next-content">
          <span className="up-next-label">Up Next in {autoplayTimer}s...</span>
          <div className="up-next-loader" style={{ width: `${(autoplayTimer/3)*100}%` }}></div>
        </div>
        <button onClick={cancelAutoplay} className="up-next-cancel-btn">
          Cancel
        </button>
      </div>
    );
  };

  const getPageTitle = () => {
    if (mode === 'foryou') return 'Balanced For You | The Gamut';
    if (filters.category && filters.category !== 'All Categories') return `${filters.category} News | The Gamut`;
    return 'The Gamut - Analyse The Full Spectrum';
  };

  return (
    <main className="content" ref={contentRef}>
      <Helmet>
        <title>{getPageTitle()}</title>
      </Helmet>

      <div className="pull-to-refresh-container" style={{ display: isRefreshing ? 'flex' : 'none' }}>
        <div className="spinner-small"></div><p>Refreshing...</p>
      </div>

      {renderToggle()}

      {mode === 'latest' && (
        <div style={{ marginBottom: '20px' }}>
          <CategoryPills 
            selectedCategory={filters.category} 
            onSelect={handleCategorySelect} 
          />
        </div>
      )}

      {renderRadioBar()}

      {mode === 'foryou' && forYouMeta && !loading && (
        <div style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '12px' }}>
          <p>
            Based on your interest in <strong>{forYouMeta.basedOnCategory}</strong>. 
            Showing a mix of {forYouMeta.usualLean} sources and opposing views.
          </p>
        </div>
      )}

      <div className="articles-grid">
        {loading && !loadingMore ? (
           [...Array(6)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> ))
        ) : (
           articles.map((article, index) => (
            <div 
                className="article-card-wrapper" 
                key={article._id || article.url}
                // --- NEW: Attach Ref for Scroll Tracking ---
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
                isPlaying={currentArticleId === article._id}
                
                // --- UPDATED: Pass full list to enable autoplay ---
                onPlay={() => playSingle(article, articles)}
                onStop={stop}
              />
            </div>
          ))
        )}
        
        {loadingMore && (
           [...Array(3)].map((_, i) => ( <div className="article-card-wrapper" key={`more-${i}`}><SkeletonCard /></div> ))
        )}
      </div>

      {!loading && articles.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
            {mode === 'foryou' 
             ? <p>Read more articles to unlock your personalized feed!</p> 
             : <p>No articles found matching your current filters.</p>}
        </div>
      )}

      {mode === 'latest' && articles.length < totalCount && (
        <div ref={bottomSentinelRef} style={{ height: '20px', marginBottom: '20px' }} />
      )}
      
      {/* --- RENDER TOAST --- */}
      {renderUpNextToast()}

      {mode === 'latest' && !loading && !loadingMore && articles.length >= totalCount && articles.length > 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
              <p>You've caught up with the latest news!</p>
          </div>
      )}
    </main>
  );
}

export default NewsFeed;
