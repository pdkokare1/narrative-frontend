// src/SearchResults.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import * as api from './services/api'; 
import ArticleCard from './components/ArticleCard'; 
import NarrativeCard from './components/NarrativeCard'; // NEW
import NarrativeModal from './components/modals/NarrativeModal'; // NEW
import SkeletonCard from './components/ui/SkeletonCard';
import { useToast } from './context/ToastContext';
import { useRadio } from './context/RadioContext'; 
import useShare from './hooks/useShare'; 
import './App.css'; 
import { IArticle, INarrative, FeedItem } from './types';

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
  
  // FIX: State now accepts FeedItem[] (Articles + Narratives)
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // NEW: Narrative Modal State
  const [selectedNarrative, setSelectedNarrative] = useState<INarrative | null>(null);

  const { addToast } = useToast();
  const { updateContextQueue } = useRadio(); 
  const { handleShare } = useShare(); 

  useEffect(() => {
    const performSearch = async () => {
      if (!query) return;
      setLoading(true);
      try {
        const { data } = await api.searchArticles(query);
        // FIX: Assign FeedItem[]
        setItems(data.articles || []);
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
    // FIX: Filter only playable articles for Radio
    const playableArticles = items.filter(i => i.type !== 'Narrative') as IArticle[];

    if (playableArticles.length > 0 && query) {
      updateContextQueue(playableArticles, `Search: ${query}`);
    }
  }, [items, query, updateContextQueue]);

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
          {items.length > 0 ? (
            <div className="articles-grid">
              {items.map((item) => {
                // RENDER LOGIC: NARRATIVE VS ARTICLE
                if (item.type === 'Narrative') {
                    return (
                        <div className="article-card-wrapper" key={item._id}>
                            <NarrativeCard 
                                data={item as INarrative}
                                onClick={() => setSelectedNarrative(item as INarrative)}
                            />
                        </div>
                    );
                } else {
                    const article = item as IArticle;
                    return (
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
                    );
                }
              })}
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

      {/* Narrative Modal for Search Results */}
      {selectedNarrative && (
          <NarrativeModal 
              data={selectedNarrative} 
              onClose={() => setSelectedNarrative(null)} 
          />
      )}
    </div>
  );
};

export default SearchResults;
