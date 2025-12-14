// src/components/NewsFeed.tsx
import React, { useEffect, useState } from 'react';
import * as api from '../services/api';
import ArticleCard from './ArticleCard';
import ArticleFilters from './ArticleFilters';
import { IArticle, IFilters } from '../types';
import './NewsFeed.css';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

interface NewsFeedProps {
  filters: IFilters;
  onFilterChange: (f: IFilters) => void;
  onAnalyze: (article: IArticle) => void;
  onCompare: (article: IArticle) => void;
  savedArticleIds: Set<string>;
  onToggleSave: (article: IArticle) => void;
  showTooltip: (text: string, e: React.MouseEvent) => void;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ 
  filters, onFilterChange, onAnalyze, onCompare, savedArticleIds, onToggleSave, showTooltip 
}) => {
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const fetchArticles = async (reset = false) => {
    if (reset) setLoading(true);
    try {
      const offset = reset ? 0 : page * 12;
      // FIX: Changed api.getArticles to api.fetchArticles to match api.ts export
      const data = await api.fetchArticles({ ...filters, offset, limit: 12 });
      
      if (reset) {
        setArticles(data.articles);
        setPage(1);
      } else {
        setArticles(prev => [...prev, ...data.articles]);
        setPage(prev => prev + 1);
      }
      setHasMore(data.pagination.total > (offset + data.articles.length));
    } catch (err) {
      console.error("Feed Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(true);
  }, [filters]);

  // --- Pull To Refresh Integration ---
  const { pullChange, refreshing } = usePullToRefresh(async () => {
    await fetchArticles(true); // Force reset on pull
  });

  return (
    <div className="news-feed-container">
      
      {/* Visual Indicator for Pull */}
      <div 
        className={`ptr-element ${refreshing ? 'refreshing' : ''}`}
        style={{ transform: `translateY(${pullChange}px)` }}
      >
        <div className={`ptr-icon ${pullChange > 60 ? 'rotate' : ''}`}>
           {refreshing ? <div className="ptr-spinner"></div> : '↓'}
        </div>
      </div>

      <div className="feed-header">
        <h1 className="feed-title">
          {filters.category === 'All Categories' ? 'Top Headlines' : filters.category}
        </h1>
        <ArticleFilters filters={filters} onChange={onFilterChange} />
      </div>

      <div 
        className="articles-grid"
        style={{ transform: `translateY(${refreshing ? 60 : pullChange * 0.4}px)`, transition: refreshing ? 'transform 0.3s' : 'none' }}
      >
        {articles.map(article => (
          <ArticleCard 
            key={article._id} 
            article={article}
            onAnalyze={onAnalyze}
            onCompare={onCompare}
            isSaved={savedArticleIds.has(article._id || '')}
            onToggleSave={onToggleSave}
            showTooltip={showTooltip}
          />
        ))}
      </div>

      {loading && (
        <div className="loading-container">
            <div className="spinner"></div>
            <p>Curating the spectrum...</p>
        </div>
      )}

      {!loading && hasMore && (
        <div className="load-more">
          <button className="load-more-btn" onClick={() => fetchArticles(false)}>
            Load More Stories
          </button>
        </div>
      )}
      
      {!loading && !hasMore && articles.length > 0 && (
         <p className="end-message">You're all caught up!</p>
      )}

       {!loading && articles.length === 0 && (
         <div className="empty-state">
           <p>No stories found for these filters.</p>
           <button className="btn-secondary" onClick={() => onFilterChange({...filters, category: 'All Categories'})}>
             Clear Filters
           </button>
         </div>
      )}
    </div>
  );
};

export default NewsFeed;
