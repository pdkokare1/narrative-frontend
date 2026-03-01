// src/components/feeds/FeedItemRenderer.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ArticleCard from '../ArticleCard';
import NarrativeCard from '../NarrativeCard';
import ComingSoonModal from '../modals/ComingSoonModal'; // NEW: Imported reusable modal
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
  // NEW: State to manage the play button's modal intercept
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // --- Refs for Impression Tracking ---
  const containerRef = useRef<HTMLDivElement>(null);
  const hasRecordedImpression = useRef(false);

  // --- Type Guard ---
  const isNarrative = (item: IArticle | INarrative): item is INarrative => {
    return (item as any).type === 'Narrative';
  };

  // --- Impression Tracking Logic ---
  useEffect(() => {
    const element = containerRef.current;
    if (!element || hasRecordedImpression.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            hasRecordedImpression.current = true;
            
            if (onImpression) {
              onImpression(item);
            }

            const safeCategory = item.category || 'General'; 
            
            const event = new CustomEvent('narrative-impression', {
              detail: {
                itemId: item._id,
                itemType: isNarrative(item) ? 'Narrative' : 'Article',
                category: safeCategory,
                timestamp: new Date()
              }
            });
            window.dispatchEvent(event);

            observer.disconnect();
          }
        });
      },
      { 
        threshold: 0.5, 
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
        
        /* FEATURE PAUSED: Replaced direct play logic with our Modal intercept */
        onPlay={() => {
           setShowUpgradeModal(true);
           // playSingle(article); // ORIGINAL LOGIC PRESERVED FOR LATER
        }}
        
        onStop={stop}
      />

      {/* NEW: Render the specific article narration modal */}
      <ComingSoonModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        title="Audio Upgrade"
        message="Article narration is getting a major upgrade alongside the Gamut Radio studio. Stay tuned."
      />
    </div>
  );
};

export default React.memo(FeedItemRenderer);
