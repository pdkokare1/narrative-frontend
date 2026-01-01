// src/components/feeds/FeedItemRenderer.tsx
import React, { useCallback } from 'react';
import ArticleCard from '../ArticleCard';
import NarrativeCard from '../NarrativeCard';
import { IArticle, INarrative } from '../../types';

interface FeedItemRendererProps {
  item: IArticle | INarrative;
  onOpenNarrative: (narrative: INarrative) => void;
  onCompare: (article: IArticle) => void;
  onAnalyze: (article: IArticle) => void;
  onShare: (article: IArticle) => void;
  savedArticleIds: Set<string>;
  onToggleSave: (article: IArticle) => void;
  showTooltip: (text: string, e: React.MouseEvent) => void;
  currentArticleId?: string;
  playSingle: (article: IArticle) => void;
  stop: () => void;
}

const FeedItemRenderer: React.FC<FeedItemRendererProps> = ({ 
  item, 
  onOpenNarrative,
  onCompare,
  onAnalyze,
  onShare,
  savedArticleIds,
  onToggleSave,
  showTooltip,
  currentArticleId,
  playSingle,
  stop
}) => {

  // --- Type Guard ---
  const isNarrative = (item: any): item is INarrative => {
    return (item as INarrative).clusterId !== undefined;
  };

  // --- Handler for "Read Source" ---
  const handleRead = useCallback((article: IArticle) => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // --- Render Narrative ---
  if (isNarrative(item)) {
    return (
       <div className="feed-item-wrapper" style={{ marginBottom: '1.5rem' }}>
          <NarrativeCard 
            data={item} 
            onClick={() => onOpenNarrative(item)} 
          />
       </div>
    );
  }

  // --- Render Article ---
  const article = item as IArticle;
  const isCurrent = currentArticleId === article._id;
  const isSaved = savedArticleIds.has(article._id);

  return (
    <div 
      className="feed-item-wrapper" 
      style={{ marginBottom: '1rem' }}
      id={article._id} 
      data-article-id={article._id}
    >
      <ArticleCard 
        article={article}
        onCompare={onCompare}
        onAnalyze={onAnalyze}
        onShare={onShare}
        onRead={handleRead}
        showTooltip={showTooltip}
        isSaved={isSaved}
        onToggleSave={onToggleSave}
        isPlaying={isCurrent} // Passed simply as boolean
        onPlay={() => playSingle(article)}
        onStop={stop}
      />
    </div>
  );
};

export default React.memo(FeedItemRenderer);
