// src/SavedArticles.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import * as api from './services/api'; 
import offlineStorage from './services/offlineStorage'; 
import { useToast } from './context/ToastContext'; 
import ArticleCard from './components/ArticleCard'; 
import SkeletonCard from './components/ui/SkeletonCard'; 
import useIsMobile from './hooks/useIsMobile';
import useShare from './hooks/useShare'; // NEW IMPORT
import './App.css'; 
import './SavedArticles.css'; 
import { IArticle } from './types';

interface SavedArticlesProps {
  onToggleSave: (article: IArticle) => void;
  onCompare: (article: IArticle) => void;
  onAnalyze: (article: IArticle) => void;
  onShare?: (article: IArticle) => void; // Made optional, we use hook instead
  onRead: (article: IArticle) => void;
  showTooltip: (text: string, e: React.MouseEvent) => void;
}

const SavedArticles: React.FC<SavedArticlesProps> = ({ 
  onToggleSave, 
  onCompare, 
  onAnalyze, 
  onRead, 
  showTooltip 
}) => {
  const isMobileView = useIsMobile();
  const { addToast } = useToast(); 
  const { handleShare } = useShare(); // NEW HOOK
  const queryClient = useQueryClient(); 

  // --- QUERY: Saved Articles (With Offline Support) ---
  const { 
    data: savedArticles = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['savedArticles'],
    queryFn: async () => {
      try {
        const { data } = await api.fetchSavedArticles();
        const articles = data.articles || [];
        if (articles.length > 0) offlineStorage.save('saved-library', articles);
        return articles;
      } catch (err) {
        console.warn("Network failed, checking offline cache for library...");
        const cachedLibrary = await offlineStorage.get('saved-library');
        if (cachedLibrary) {
            addToast('Offline mode: Showing cached library', 'info');
            return cachedLibrary;
        }
        throw err; 
      }
    },
    staleTime: 1000 * 60 * 5, 
  });

  const handleLocalToggleSave = (article: IArticle) => {
    onToggleSave(article);
    queryClient.setQueryData(['savedArticles'], (oldData: IArticle[] | undefined) => {
      if (!oldData) return [];
      const newData = oldData.filter(a => a._id !== article._id);
      offlineStorage.save('saved-library', newData);
      return newData;
    });
  };

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
      <h2 className="error-text">Connection Error</h2>
      <p>Could not load your library and no offline copy was found.</p>
      <button onClick={() => window.location.reload()} className="btn-secondary" style={{ marginTop: '20px' }}>
        Retry
      </button>
    </div>
  );

  const renderSkeletons = () => (
    <div className="articles-grid">
       {[...Array(6)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> ))}
    </div>
  );

  if (isMobileView) {
    return (
      <main className="content">
        {isLoading ? ( <div className="article-card-wrapper"><SkeletonCard /></div> ) 
        : error ? ( <div className="article-card-wrapper">{renderError()}</div> ) 
        : savedArticles.length === 0 ? ( <div className="article-card-wrapper">{renderEmptyState()}</div> ) 
        : (
          <>
            {renderHeader()}
            {savedArticles.map((article: IArticle) => (
              <div className="article-card-wrapper" key={article._id}>
                <ArticleCard
                  article={article}
                  onCompare={() => onCompare(article)}
                  onAnalyze={onAnalyze}
                  onShare={() => handleShare(article)} 
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

  return (
    <div className="content saved-articles-container">
      {isLoading ? renderSkeletons() 
      : error ? renderError() 
      : (
        <>
          {renderHeader()}
          {savedArticles.length === 0 ? renderEmptyState() : (
            <div className="articles-grid">
              {savedArticles.map((article: IArticle) => (
                <ArticleCard
                  key={article._id}
                  article={article}
                  onCompare={() => onCompare(article)}
                  onAnalyze={onAnalyze}
                  onShare={() => handleShare(article)} 
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
};

export default SavedArticles;
