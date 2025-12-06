// In file: src/SavedArticles.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from './services/api'; 
import { useToast } from './context/ToastContext'; 
import ArticleCard from './components/ArticleCard'; 
import useIsMobile from './hooks/useIsMobile';
import './App.css'; 
import './SavedArticles.css'; // <--- NEW: Modular styles

function SavedArticles({ onToggleSave, onCompare, onAnalyze, onShare, onRead, showTooltip }) {
  const [savedArticles, setSavedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const isMobileView = useIsMobile();
  const { addToast } = useToast(); 

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

  const handleLocalToggleSave = async (article) => {
    // Optimistic Update: Remove immediately from UI
    setSavedArticles(prev => prev.filter(a => a._id !== article._id));
    onToggleSave(article);
  };

  // --- Render Helpers ---
  
  const renderHeader = () => (
    <div className="saved-header">
      <h1>Saved Articles</h1>
      <span className="saved-count-badge">{savedArticles.length} Items</span>
    </div>
  );

  const renderEmptyState = () => (
    <div className="saved-placeholder">
      <h2>No Saved Articles</h2>
      <p>Articles you save will appear here for quick access.</p>
      <Link to="/" className="btn-secondary" style={{ marginTop: '20px', textDecoration: 'none' }}>
        Browse Articles
      </Link>
    </div>
  );

  const renderError = () => (
    <div className="saved-placeholder">
      <h2 className="error-text">Error</h2>
      <p>{error}</p>
      <Link to="/" className="btn-secondary" style={{ marginTop: '20px', textDecoration: 'none' }}>
        Back to Home
      </Link>
    </div>
  );

  const renderLoading = () => (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading your library...</p>
    </div>
  );

  // --- Mobile View (Snap Scrolling) ---
  if (isMobileView) {
    return (
      <main className="content">
        {loading ? (
           <div className="article-card-wrapper">{renderLoading()}</div>
        ) : error ? (
           <div className="article-card-wrapper">{renderError()}</div>
        ) : savedArticles.length === 0 ? (
           <div className="article-card-wrapper">{renderEmptyState()}</div>
        ) : (
          <>
            {renderHeader()}
            {savedArticles.map((article) => (
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
        )}
      </main>
    );
  }

  // --- Desktop View (Standard Grid) ---
  return (
    <div className="content saved-articles-container">
      {loading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : (
        <>
          {renderHeader()}
          {savedArticles.length === 0 ? (
            renderEmptyState()
          ) : (
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
          )}
        </>
      )}
    </div>
  );
}

export default SavedArticles;
