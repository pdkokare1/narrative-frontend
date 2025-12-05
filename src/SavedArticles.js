// In file: src/SavedArticles.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as api from './services/api'; // <--- Centralized API
import { useToast } from './context/ToastContext'; // <--- Notifications
import ArticleCard from './components/ArticleCard'; 
import './App.css'; 
import './DashboardPages.css'; 

const isMobile = () => window.innerWidth <= 768;

function SavedArticles({ onToggleSave, onCompare, onAnalyze, onShare, onRead, showTooltip }) {
  const [savedArticles, setSavedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobileView, setIsMobileView] = useState(isMobile()); 
  const { addToast } = useToast(); // Hook for popups
  
  const contentRef = useRef(null); 

  useEffect(() => {
    const loadSavedArticles = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.fetchSavedArticles();
        setSavedArticles(data.articles || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Could not load your saved articles.');
        addToast('Failed to load saved articles', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadSavedArticles();
  }, [addToast]);
  
  useEffect(() => {
    const handleResize = () => setIsMobileView(isMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle Unsave
  const handleLocalToggleSave = async (article) => {
    // 1. Optimistic Update (Remove from UI immediately)
    setSavedArticles(prev => prev.filter(a => a._id !== article._id));
    
    // 2. Call Global Handler (Updates App.js state)
    onToggleSave(article);
  };
  
  // --- Render Views ---
  const renderDesktopView = () => (
    <div className="content-router-outlet saved-articles-desktop-page" ref={contentRef}>
      {loading && (
        <div className="loading-container" style={{ minHeight: '300px' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-tertiary)' }}>Loading saved articles...</p>
        </div>
      )}
      
      {error && (
        <div className="placeholder-page" style={{ padding: '20px' }}>
          <h2 style={{ color: '#E57373' }}>Error</h2>
          <p style={{ color: 'var(--text-tertiary)' }}>{error}</p>
          <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', marginTop: '20px' }}>
            Back to Articles
          </Link>
        </div>
      )}

      {!loading && !error && (
        <>
          {savedArticles.length > 0 ? (
            <>
              <div style={{ 
                position: 'absolute', top: '0', left: '0', right: '0',
                paddingTop: '10px', zIndex: 0, pointerEvents: 'none', textAlign: 'center'
              }}>
                <h1 style={{ fontSize: '14px', color: 'var(--text-tertiary)', fontWeight: '500', margin: 0 }}>
                  {savedArticles.length} Saved Articles
                </h1>
              </div>

              <div className="articles-grid" style={{ marginTop: '25px', position: 'relative', zIndex: 1 }}>
                {savedArticles.map((article) => (
                  <ArticleCard
                    key={article._id}
                    article={article}
                    onCompare={() => onCompare(article)}
                    onAnalyze={onAnalyze}
                    onShare={onShare}
                    onRead={onRead}
                    showTooltip={showTooltip}
                    isSaved={true}
                    onToggleSave={() => handleLocalToggleSave(article)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="placeholder-page" style={{ padding: '20px', minHeight: 'calc(100vh - 200px)' }}>
              <h2>No Saved Articles</h2>
              <p>You haven't saved any articles yet.</p>
              <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', marginTop: '20px' }}>
                Back to Articles
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
  
  const renderMobileView = () => (
    <main className="content" ref={contentRef}>
      {loading && (
        <div className="article-card-wrapper">
          <div className="loading-container" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-tertiary)' }}>Loading saved articles...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="article-card-wrapper">
          <div className="placeholder-page" style={{ padding: '20px' }}>
            <h2 style={{ color: '#E57373' }}>Error</h2>
            <p style={{ color: 'var(--text-tertiary)' }}>{error}</p>
            <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', marginTop: '20px' }}>
              Back to Articles
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {savedArticles.length > 0 ? (
            <>
              <div style={{ 
                position: 'absolute', top: '0', left: '0', right: '0',
                paddingTop: '10px', paddingBottom: '10px', zIndex: 0, pointerEvents: 'none' 
              }}>
                <h1 style={{ width: '100%', maxWidth: '500px', margin: '0 auto', textAlign: 'center', fontSize: '14px', color: 'var(--text-tertiary)', fontWeight: '500' }}>
                  {savedArticles.length} Saved Articles 
                </h1>
              </div>

              {savedArticles.map((article, index) => (
                <div className="article-card-wrapper" key={article._id} style={{ paddingTop: index === 0 ? '45px' : '20px' }}>
                  <ArticleCard
                    article={article}
                    onCompare={() => onCompare(article)}
                    onAnalyze={onAnalyze}
                    onShare={onShare}
                    onRead={onRead}
                    showTooltip={showTooltip}
                    isSaved={true}
                    onToggleSave={() => handleLocalToggleSave(article)}
                  />
                </div>
              ))}
            </>
          ) : (
            <div className="article-card-wrapper">
              <div className="placeholder-page" style={{ padding: '20px' }}>
                <h2>No Saved Articles</h2>
                <p>You haven't saved any articles yet.</p>
                <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', marginTop: '20px' }}>
                  Back to Articles
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );

  return isMobileView ? renderMobileView() : renderDesktopView();
}

export default SavedArticles;
