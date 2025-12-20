import React from 'react';
import ArticleCard from '../ArticleCard';
import NarrativeCard from '../NarrativeCard';
import { IArticle, INarrative, FeedItem } from '../../types';
import * as api from '../../services/api';

interface FeedItemRendererProps {
  item: FeedItem;
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

const FeedItemRenderer: React.FC<FeedItemRendererProps> = React.memo(({
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
  
  if (item.type === 'Narrative') {
    return (
        <div className="article-card-wrapper">
            <NarrativeCard 
                data={item as INarrative}
                onClick={() => onOpenNarrative(item as INarrative)}
            />
        </div>
    );
  } else {
    const article = item as IArticle;
    return (
        <div className="article-card-wrapper">
            <ArticleCard
                article={article}
                onCompare={() => onCompare(article)}
                onAnalyze={onAnalyze}
                onShare={() => onShare(article)} 
                onRead={() => {
                    api.logRead(article._id).catch(err => console.error("Log Read Error:", err));
                    window.open(article.url, '_blank', 'noopener,noreferrer');
                }}
                showTooltip={showTooltip}
                isSaved={savedArticleIds.has(article._id)}
                onToggleSave={() => onToggleSave(article)}
                isPlaying={currentArticleId === article._id}
                onPlay={() => playSingle(article)}
                onStop={stop}
            />
        </div>
    );
  }
});

export default FeedItemRenderer;
