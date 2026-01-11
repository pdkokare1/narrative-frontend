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
  // Safely distinguishes between Article and Narrative based on the backend 'type' field
  const isNarrative = (item: IArticle | INarrative): item is INarrative => {
    return (item as any).type === 'Narrative';
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
       <div className="feed-item-wrapper" style={{ height: '100%' }}>
          <NarrativeCard 
            data={item} 
            onClick={() => onOpenNarrative(item)} 
          />
       </div>
    );
  }

  // --- Render Article ---
  // Cast is safe here due to the guard above
  const article = item as IArticle;
  const isCurrent = currentArticleId === article._id;
  const isSaved = savedArticleIds.has(article._id);

  return (
    <div 
      className="feed-item-wrapper" 
      style={{ height: '100%' }}
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
        isPlaying={isCurrent} 
        onPlay={() => playSingle(article)}
        onStop={stop}
      />
    </div>
  );
};

export default React.memo(FeedItemRenderer);
