// src/components/feeds/FeedItemRenderer.tsx
import React from 'react';
import ArticleCard from '../ArticleCard';
import NarrativeCard from '../NarrativeCard';
import { IArticle, INarrative } from '../../types';
import { useRadio } from '../../context/RadioContext';

interface FeedItemRendererProps {
  item: IArticle | INarrative;
  index: number;
  feedContext: IArticle[]; // Full list for the queue
}

const FeedItemRenderer: React.FC<FeedItemRendererProps> = ({ item, index, feedContext }) => {
  const { startRadio, currentArticle, isPlaying } = useRadio();

  // --- Type Guard ---
  const isNarrative = (item: any): item is INarrative => {
    return (item as INarrative).clusterId !== undefined;
  };

  if (isNarrative(item)) {
    return (
       <div className="feed-item-wrapper" style={{ marginBottom: '1.5rem' }}>
          <NarrativeCard narrative={item} />
       </div>
    );
  }

  // --- Article Handling ---
  const article = item as IArticle;
  
  const handlePlayClick = () => {
      // START RADIO FROM HERE
      // Options: Skip the "Good Morning" greeting, but Enable the "Up Next" timer for the first transition.
      startRadio(feedContext, index, { skipGreeting: true, enableFirstTimer: true });
  };

  const isCurrent = currentArticle?._id === article._id;

  return (
    <div 
      className="feed-item-wrapper" 
      style={{ marginBottom: '1rem' }}
      id={article._id} // Added ID for Auto-Scroll
      data-article-id={article._id} // Added Data Attribute for Viewport Detection
    >
      <ArticleCard 
        article={article}
        onPlay={handlePlayClick}
        isPlaying={isCurrent && isPlaying}
        isBuffering={isCurrent && !isPlaying} // Simplification, could link to isLoading
      />
    </div>
  );
};

export default React.memo(FeedItemRenderer);
