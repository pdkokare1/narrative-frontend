// src/components/feeds/ForYouFeed.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query'; 
import * as api from '../../services/api'; 
import ArticleCard from '../ArticleCard';
import SkeletonCard from '../ui/SkeletonCard';
import { useToast } from '../../context/ToastContext';
import { useRadio } from '../../context/RadioContext';
import { IArticle } from '../../types';

interface ForYouFeedProps {
  onAnalyze: (article: IArticle) => void;
  onCompare: (article: IArticle) => void;
  savedArticleIds: Set<string>;
  onToggleSave: (article: IArticle) => void;
  showTooltip: (text: string, e: React.MouseEvent) => void;
}

const ForYouFeed: React.FC<ForYouFeedProps> = ({ 
  onAnalyze, 
  onCompare, 
  savedArticleIds, 
  onToggleSave, 
  showTooltip 
}) => {
  const { addToast } = useToast();
  const { startRadio, playSingle, stop, currentArticle, isPlaying } = useRadio();

  // --- QUERY: Personalized Feed ---
  const { 
    data, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['forYouFeed'],
    queryFn: async () => {
      const { data } = await api.fetchForYouArticles();
      return data;
    },
    staleTime: 1000 * 60 * 15, 
    refetchOnWindowFocus: false, 
  });

  const articles: IArticle[] = data?.articles || [];
  const forYouMeta = data?.meta;

  // --- Error Handling ---
  if (error) {
      console.error('For You Fetch Error:', error);
      return (
        <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
            <p>Could not load your personalized feed.</p>
            <button 
                onClick={() => window.location.reload()} 
                className="btn-secondary" 
                style={{ marginTop: '10px' }}
            >
                Retry
            </button>
        </div>
      );
  }

  // --- Handlers ---
  const handleReadClick = (article: IArticle) => {
    api.logRead(article._id).catch(err => console.error("Log Read Error:", err));
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = (article: IArticle) => {
    api.logShare(article._id).catch(err => console.error("Log Share Error:", err));
    const shareUrl = `${window.location.origin}?article=${article._id}`;
    if (navigator.share) {
      navigator.share({ title: article.headline, text: `Check this out: ${article.headline}`, url: shareUrl })
        .catch(err => console.log('Share failed', err));
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => addToast('Link copied!', 'success'));
    }
  };

  return (
    <>
      {/* Meta Header */}
      {forYouMeta && !isLoading && (
        <div style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '12px' }}>
          <p>
            Based on your interest in <strong>{forYouMeta.basedOnCategory}</strong>. 
            Showing a mix of {forYouMeta.usualLean} sources and opposing views.
          </p>
        </div>
      )}

      {/* Start Radio Button */}
      {!isPlaying && articles.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px' }}>
            <button 
                onClick={() => startRadio(articles, 0)} 
                className="btn-primary"
                style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                <span>▶</span> Start Curated Radio
            </button>
        </div>
      )}

      {/* Articles Grid */}
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

      {/* Empty State */}
      {!isLoading && articles.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
            <p>Read more articles to unlock your personalized feed!</p>
        </div>
      )}
    </>
  );
};

export default ForYouFeed;
