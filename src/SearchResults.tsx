// src/SearchResults.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import * as api from './services/api'; 
import ArticleCard from './components/ArticleCard'; 
import SkeletonCard from './components/ui/SkeletonCard';
import { useToast } from './context/ToastContext';
import './App.css'; 
import { IArticle } from './types';

interface SearchResultsProps {
  onAnalyze: (article: IArticle) => void;
  onCompare: (article: IArticle) => void;
  savedArticleIds: Set<string>;
  onToggleSave: (article: IArticle) => void;
  showTooltip: (text: string, e: React.MouseEvent) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ 
  onAnalyze, 
  onCompare, 
  savedArticleIds, 
  onToggleSave, 
  showTooltip 
}) => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { addToast } = useToast();

  useEffect(() => {
    const performSearch = async () => {
      if (!query) return;
      
      setLoading(true);
      try {
        const { data } = await api.searchArticles(query);
        setArticles(data.articles || []);
        setTotal(data.pagination?.total || 0);
      } catch (error) {
        console.error('Search error:', error);
        addToast('Search failed. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, addToast]);

  const handleReadClick = (article: IArticle) => {
    api.logRead(article._id).catch(err => console.error("Log Read Error:", err));
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = (article: IArticle) => {
    api.logShare(article._id).catch(err => console.error("Log Share Error:", err));
    const shareUrl = `${window.location.origin}?article=${article._id}`;
    if (navigator.share) {
      navigator.share({ title: article.headline, text: `Check this out: ${article.headline}`, url: shareUrl })
        .catch(() => navigator.clipboard.writeText(shareUrl).then(() => addToast('Link copied!', 'success')));
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => addToast('Link copied!', 'success'));
    }
  };

  return (
    <div className="content">
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
          Search Results for "{query}"
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '5px' }}>
          Found {total} result{total !== 1 ? 's' : ''}
        </p>
      </div>

      {loading ? (
        <div className="articles-grid">
           {[...Array(6)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> ))}
        </div>
      ) : (
        <>
          {articles.length > 0 ? (
            <div className="articles-grid">
              {articles.map((article) => (
                <div className="article-card-wrapper" key={article._id}>
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
             <div className="placeholder-page">
              <h2>No results found</h2>
              <p>We couldn't find any articles matching "{query}".</p>
              <Link to="/" className="btn-secondary">
                Back to Feed
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;
