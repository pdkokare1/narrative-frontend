// src/components/feeds/FeedItemRenderer.tsx
import React, { useCallback, useEffect, useRef } from 'react';
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
  // NEW: Optional prop to handle impressions explicitly from parent
  onImpression?: (item: IArticle | INarrative) => void; 
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
  stop,
  onImpression
}) => {

  // --- Refs for Impression Tracking ---
  const containerRef = useRef<HTMLDivElement>(null);
  const hasRecordedImpression = useRef(false);

  // --- Type Guard ---
  // Safely distinguishes between Article and Narrative based on the backend 'type' field
  const isNarrative = (item: IArticle | INarrative): item is INarrative => {
    return (item as any).type === 'Narrative';
  };

  // --- Impression Tracking Logic ---
  // Detects when the item is 50% visible in the viewport
  useEffect(() => {
    const element = containerRef.current;
    if (!element || hasRecordedImpression.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Mark as recorded so we don't spam events
            hasRecordedImpression.current = true;
            
            // 1. Trigger Prop if provided
            if (onImpression) {
              onImpression(item);
            }

            // 2. Dispatch Global Custom Event
            // This allows the global ActivityTracker to pick it up without 
            // needing to pass props through every intermediate component.
            const event = new CustomEvent('narrative-impression', {
              detail: {
                itemId: item._id,
                itemType: isNarrative(item) ? 'Narrative' : 'Article',
                category: item.category,
                timestamp: new Date()
              }
            });
            window.dispatchEvent(event);

            // Cleanup observer once recorded
            observer.disconnect();
          }
        });
      },
      { 
        threshold: 0.5, // Trigger when 50% of the item is visible
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [item, onImpression]);

  // --- Handler for "Read Source" ---
  const handleRead = useCallback((article: IArticle) => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // --- Render Narrative ---
  if (isNarrative(item)) {
    return (
       <div 
         ref={containerRef}
         className="feed-item-wrapper" 
         style={{ height: '100%' }}
       >
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
      ref={containerRef}
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
