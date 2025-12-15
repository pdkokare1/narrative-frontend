// src/components/ArticleCard.tsx
import React, { useState, useEffect, memo } from 'react'; 
import './ArticleCard.css'; 
import { isOpinion, getOptimizedImageUrl } from '../utils/helpers'; 
import { getFallbackImage } from '../utils/constants'; 
import SmartBriefingModal from './modals/SmartBriefingModal';
import useIsMobile from '../hooks/useIsMobile';
import { IArticle } from '../types';

// --- NEW IMPORTS ---
import Button from './ui/Button';
import { PlayIcon, PauseIcon, BookmarkIcon, ShareIcon, CompareIcon } from './ui/Icons';

interface ArticleCardProps {
  article: IArticle;
  onCompare: (article: IArticle) => void;
  onAnalyze: (article: IArticle) => void;
  onShare: (article: IArticle) => void;
  onRead: (article: IArticle) => void;
  showTooltip: (text: string, e: React.MouseEvent) => void;
  isSaved?: boolean;
  onToggleSave: (article: IArticle) => void;
  isPlaying?: boolean;
  onPlay?: () => void;
  onStop?: () => void;
}

const ArticleCard = memo(function ArticleCard({ 
  article, 
  onCompare, 
  onAnalyze, 
  onShare, 
  onRead, 
  showTooltip, 
  isSaved,      
  onToggleSave,
  isPlaying, 
  onPlay, 
  onStop 
}: ArticleCardProps) {
  const [showBriefing, setShowBriefing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false); 
  const isMobileView = useIsMobile();

  const isHardNews = article.analysisType === 'Full';
  const isOpEd = isOpinion(article);
  const optimizedUrl = getOptimizedImageUrl(article.imageUrl);
  
  const [imgSrc, setImgSrc] = useState(optimizedUrl || getFallbackImage(article.category));

  useEffect(() => {
      const newUrl = getOptimizedImageUrl(article.imageUrl);
      setImgSrc(newUrl || getFallbackImage(article.category));
      setImageLoaded(false); 
  }, [article.imageUrl, article.category]);

  const handleImageError = () => {
      setImgSrc(getFallbackImage(article.category));
  };

  const preventBubble = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      <div className={`article-card ${isPlaying ? 'now-playing' : ''}`}>
        
        {/* --- BADGES --- */}
        <div className="card-badges">
          {article.suggestionType === 'Challenge' && <div className="badge challenge">Perspective</div>}
          {isOpEd && <div className="badge opinion">Opinion</div>}
        </div>
        
        {/* --- IMAGE --- */}
        <div className="article-image">
          <img 
            src={imgSrc} 
            alt={article.headline} 
            onError={handleImageError} 
            onLoad={() => setImageLoaded(true)} 
            loading="lazy" 
            style={{ opacity: imageLoaded ? 1 : 0 }}
          />
        </div>
        
        {/* --- CONTENT --- */}
        <div className="article-content">
          <div className="article-meta-top">
             <span className="source-name">{article.source}</span>
             <span className="date">{new Date(article.publishedAt).toLocaleDateString()}</span>
          </div>

          <h3 
            className="article-headline" 
            onClick={(e) => { preventBubble(e); setShowBriefing(true); }}
          >
            {article.headline}
          </h3>

          <p className="article-summary">{article.summary}</p>
          
          {/* --- FOOTER --- */}
          <div className="article-footer">
            
            {/* Stats (FIXED) */}
            <div className="stats-row">
                {isHardNews ? (
                    <>
                        <div className="stat-item" onClick={(e) => showTooltip("Bias Score (0-100). Lower is better.", e)}>
                            <span>Bias:</span>
                            <span className="stat-val accent-text">{article.biasScore}</span>
                        </div>
                        <span>•</span>
                        <div className="stat-item">
                            <span>Lean:</span>
                            <span className={`stat-val ${article.politicalLean === 'Center' ? 'accent-text' : ''}`}>{article.politicalLean}</span>
                        </div>
                    </>
                ) : (
                    // Show Sentiment for Opinions
                    <div className="stat-item" onClick={(e) => showTooltip("Sentiment Analysis", e)}>
                        <span>Sentiment:</span>
                        <span className="stat-val">{article.sentiment}</span>
                    </div>
                )}
            </div>

            {/* Action Bar */}
            <div className="action-bar">
                <div className="action-left">
                    <Button 
                        variant="icon" 
                        isActive={isPlaying}
                        onClick={(e) => { preventBubble(e); (isPlaying && onStop ? onStop() : onPlay?.()); }}
                        title={isPlaying ? "Stop" : "Listen"}
                    >
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </Button>

                    <Button 
                        variant="icon" 
                        isActive={isSaved}
                        onClick={(e) => { preventBubble(e); onToggleSave(article); }}
                        title={isSaved ? "Remove" : "Save"}
                    >
                        <BookmarkIcon filled={isSaved} />
                    </Button>

                    <Button 
                        variant="icon" 
                        onClick={(e) => { preventBubble(e); onShare(article); }}
                        title="Share"
                    >
                        <ShareIcon />
                    </Button>

                    {(isHardNews || (article.clusterCount || 0) > 1) && (
                        <Button 
                            variant="icon" 
                            onClick={(e) => { preventBubble(e); onCompare(article); }}
                            title="Compare Coverage"
                        >
                            <CompareIcon />
                        </Button>
                    )}
                </div>

                <Button 
                    variant="text"
                    onClick={(e) => { preventBubble(e); isHardNews ? setShowBriefing(true) : onRead(article); }}
                >
                    {isHardNews ? 'Smart Brief' : 'Read Source'}
                </Button>
            </div>
          </div>
        </div>
      </div>

      {showBriefing && (
        <SmartBriefingModal 
            article={article} 
            onClose={() => setShowBriefing(false)} 
            onCompare={onCompare}
            showTooltip={showTooltip}
        />
      )}
    </>
  );
});

export default ArticleCard;
