// In file: src/SavedArticles.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // <--- NEW IMPORTS
import * as api from './services/api'; 
import { useToast } from './context/ToastContext'; 
import ArticleCard from './components/ArticleCard'; 
import SkeletonCard from './components/ui/SkeletonCard'; // <--- NEW IMPORT
import useIsMobile from './hooks/useIsMobile';
import './App.css'; 
import './SavedArticles.css'; 

function SavedArticles({ onToggleSave, onCompare, onAnalyze, onShare, onRead, showTooltip }) {
  const isMobileView = useIsMobile();
  const { addToast } = useToast(); 
  const queryClient = useQueryClient(); // Access the cache

  // --- QUERY: Saved Articles ---
  const { 
    data: savedArticles = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['savedArticles'],
    queryFn: async () => {
      const { data } = await api.fetchSavedArticles();
      return data.articles || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // --- Handler: Optimistic Removal ---
  const handleLocalToggleSave = (article) => {
    // 1. Trigger the global save logic (App.js)
    onToggleSave(article);

    // 2. Instantly remove from THIS list (Optimistic UI)
    queryClient.setQueryData(['savedArticles'], (oldData) => {
      if (!oldData) return [];
      return oldData.filter(a => a._id !== article._id);
    });
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
      <p>Could not load your library.</p>
      <button onClick={() => window.location.reload()} className="btn-secondary" style={{ marginTop: '20px' }}>
        Retry
      </button>
    </div>
  );

  // --- NEW: Skeleton Grid ---
  const renderSkeletons = () => (
    <div className="articles-grid">
       {[...Array(6)].map((_, i) => ( 
         <div className="article-card-wrapper" key={i}>
           <SkeletonCard />
         </div> 
       ))}
    </div>
  );

  // --- Mobile View ---
  if (isMobileView) {
    return (
      <main className="content">
        {isLoading ? (
           <div className="article-card-wrapper"><SkeletonCard /></div>
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

  // --- Desktop View ---
  return (
    <div className="content saved-articles-container">
      {isLoading ? (
        renderSkeletons()
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
