// src/SearchResults.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import * as api from './services/api'; 
import ArticleCard from './components/ArticleCard'; 
import SkeletonCard from './components/ui/SkeletonCard';
import { useToast } from './context/ToastContext';
import { useRadio } from './context/RadioContext'; // Smart Radio
import useShare from './hooks/useShare'; 
import './App.css'; 
import { IArticle } from './types';

// --- NEW IMPORTS ---
import SectionHeader from './components/ui/SectionHeader';
import Button from './components/ui/Button';

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
  const { updateContextQueue } = useRadio(); // Smart Radio
  const { handleShare } = useShare(); 

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

  // --- SMART RADIO REGISTRATION ---
  useEffect(() => {
    if (articles.length > 0 && query) {
      updateContextQueue(articles, `Search: ${query}`);
    }
  }, [articles, query, updateContextQueue]);

  const handleReadClick = (article: IArticle) => {
    api.logRead(article._id).catch(err => console.error("Log Read Error:", err));
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="content">
      
      {/* 1. Standardized Header */}
      <SectionHeader 
        title={`Search: "${query}"`} 
        subtitle={`Found ${total} result${total !== 1 ? 's' : ''}`} 
      />

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
             <div className="placeholder-page" style={{ textAlign: 'center', marginTop: '50px' }}>
              <h2>No results found</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>We couldn't find any articles matching "{query}".</p>
              
              <Link to="/" style={{ textDecoration: 'none' }}>
                <Button variant="secondary">Back to Feed</Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;
