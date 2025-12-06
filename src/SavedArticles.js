// In file: src/SavedArticles.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as api from './services/api'; 
import { useToast } from './context/ToastContext'; 
import ArticleCard from './components/ArticleCard'; 
import './App.css'; 
import './DashboardPages.css'; 

const isMobile = () => window.innerWidth <= 768;

function SavedArticles({ onToggleSave, onCompare, onAnalyze, onShare, onRead, showTooltip }) {
  const [savedArticles, setSavedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobileView, setIsMobileView] = useState(isMobile()); 
  const { addToast } = useToast(); 
  
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

  const handleLocalToggleSave = async (article) => {
    // Optimistic Update
    setSavedArticles(prev => prev.filter(a => a._id !== article._id));
    onToggleSave(article);
  };
  
  // --- Render Views ---
  const renderDesktopView = () => (
    <div className="content-router-outlet saved-articles-desktop-page" ref={contentRef}>
      {loading && (
        <div className="loading-container page-loader">
          <div className="spinner"></div>
          <p className="loading-text">Loading saved articles...</p>
        </div>
      )}
      
      {error && (
        <div className="placeholder-page">
          <h2 className="error-text">Error</h2>
          <p>{error}</p>
          <Link to="/" className="btn-secondary">Back to Articles</Link>
        </div>
      )}

      {!loading && !error && (
        <>
          {savedArticles.length > 0 ? (
            <>
              <div className="saved-articles-header">
                <h1>{savedArticles.length} Saved Articles</h1>
              </div>

              <div className="articles-grid">
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
            <div className="placeholder-page">
              <h2>No Saved Articles</h2>
              <p>You haven't saved any articles yet.</p>
              <Link to="/" className="btn-secondary">Back to Articles</Link>
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
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading saved articles...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="article-card-wrapper">
          <div className="placeholder-page">
            <h2 className="error-text">Error</h2>
            <p>{error}</p>
            <Link to="/" className="btn-secondary">Back to Articles</Link>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {savedArticles.length > 0 ? (
            <>
              <div className="saved-articles-header-mobile">
                <h1>{savedArticles.length} Saved Articles</h1>
              </div>

              {savedArticles.map((article, index) => (
                <div className="article-card-wrapper" key={article._id}>
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
              <div className="placeholder-page">
                <h2>No Saved Articles</h2>
                <p>You haven't saved any articles yet.</p>
                <Link to="/" className="btn-secondary">Back to Articles</Link>
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
