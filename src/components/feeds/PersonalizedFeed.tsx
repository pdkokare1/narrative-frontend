// src/components/feeds/PersonalizedFeed.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query'; 
import * as api from '../../services/api'; 
import ArticleCard from '../ArticleCard';
import SkeletonCard from '../ui/SkeletonCard';
import { useRadio } from '../../context/RadioContext';
import useShare from '../../hooks/useShare';
import { IArticle } from '../../types';

interface PersonalizedFeedProps {
  onAnalyze: (article: IArticle) => void;
  onCompare: (article: IArticle) => void;
  savedArticleIds: Set<string>;
  onToggleSave: (article: IArticle) => void;
  showTooltip: (text: string, e: React.MouseEvent) => void;
}

const PersonalizedFeed: React.FC<PersonalizedFeedProps> = ({ 
  onAnalyze, 
  onCompare, 
  savedArticleIds, 
  onToggleSave, 
  showTooltip 
}) => {
  const { startRadio, playSingle, stop, currentArticle, isPlaying } = useRadio();
  const { handleShare } = useShare(); 

  const { 
    data, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['personalizedFeed'],
    queryFn: async () => {
      const { data } = await api.fetchPersonalizedArticles();
      return data;
    },
    staleTime: 1000 * 60 * 10, 
    refetchOnWindowFocus: false, 
  });

  const articles: IArticle[] = data?.articles || [];
  const meta = data?.meta;

  const handleReadClick = (article: IArticle) => {
    api.logRead(article._id).catch(err => console.error("Log Read Error:", err));
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  if (error) {
      return (
        <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
            <p>Could not load your personalized feed.</p>
            <button onClick={() => window.location.reload()} className="btn-secondary" style={{ marginTop: '10px' }}>Retry</button>
        </div>
      );
  }

  return (
    <>
      {meta && !isLoading && (
        <div style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '12px' }}>
          <p>
            Curated for you based on <strong>{meta.topCategories?.join(', ')}</strong>.
          </p>
        </div>
      )}

      {!isPlaying && articles.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px' }}>
            <button 
                onClick={() => startRadio(articles, 0)} 
                className="btn-primary"
                style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                <span>▶</span> Play My Daily Mix
            </button>
        </div>
      )}

      <div className="articles-grid">
        {isLoading ? (
           [...Array(6)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> ))
        ) : (
           articles.map((article) => (
            <div className="article-card-wrapper" key={article._id || article.url}>
              <ArticleCard
                article={article}
                onCompare={() => onCompare(article)}
                onAnalyze={onAnalyze}
                onShare={() => handleShare(article)} 
                onRead={() => handleReadClick(article)}
                showTooltip={showTooltip}
                isSaved={savedArticleIds.has(article._id)}
                onToggleSave={() => onToggleSave(article)}
                isPlaying={currentArticle?._id === article._id}
                onPlay={() => playSingle(article)}
                onStop={stop}
              />
            </div>
          ))
        )}
      </div>

      {!isLoading && articles.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
            <p>Read more articles to train your personal algorithm!</p>
        </div>
      )}
    </>
  );
};

export default PersonalizedFeed;
