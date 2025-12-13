// src/components/ArticleCard.tsx
import React, { useState, useEffect, memo } from 'react'; 
import './ArticleCard.css'; 
import { getSentimentInfo, isOpinion, getOptimizedImageUrl } from '../utils/helpers'; 
import { getFallbackImage } from '../utils/constants'; 
import SmartBriefingModal from './modals/SmartBriefingModal';
import useIsMobile from '../hooks/useIsMobile';
import { IArticle } from '../types';

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

// Wrapped in memo() to prevent unnecessary re-renders during scroll
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

  // Logic Types
  const isHardNews = article.analysisType === 'Full';
  const isOpEd = isOpinion(article);
  const showCompareOnSoft = !isHardNews && ((article.clusterCount || 0) > 1);

  // Sentiment Data
  const sentimentInfo = getSentimentInfo(article.sentiment);

  // --- Image Handling State with Optimization ---
  const optimizedUrl = getOptimizedImageUrl(article.imageUrl);
  
  const [imgSrc, setImgSrc] = useState(optimizedUrl || getFallbackImage(article.category));

  useEffect(() => {
      const newUrl = getOptimizedImageUrl(article.imageUrl);
      setImgSrc(newUrl || getFallbackImage(article.category));
      setImageLoaded(false); 
  }, [article.imageUrl, article.category]);

  const handleImageError = () => {
      const fallback = getFallbackImage(article.category);
      if (imgSrc !== fallback) {
          setImgSrc(fallback);
      }
  };

  const stopMobileClick = (e: React.MouseEvent) => { if (isMobileView) { e.stopPropagation(); } };

  const SaveButton = () => (
    <button 
      onClick={(e) => { stopMobileClick(e); onToggleSave(article); }} 
      className="btn-secondary" 
      title={isSaved ? "Remove from saved" : "Save article"}
    >
      {isSaved ? 'Unsave' : 'Save'}
    </button>
  );

  const ListenButton = () => {
    if (isPlaying && onStop) {
      return (
        <button 
          onClick={(e) => { stopMobileClick(e); onStop(); }} 
          className="btn-secondary stop-btn"
        >
          Stop
        </button>
      );
    }
    if (onPlay) {
      return (
        <button 
          onClick={(e) => { stopMobileClick(e); onPlay(); }} 
          className="btn-secondary"
        >
          Listen
        </button>
      );
    }
    return null;
  };

  const renderTopBadges = () => {
    return (
      <div className="card-badges">
        {article.suggestionType && (
            <div className={`badge ${article.suggestionType === 'Challenge' ? 'challenge' : 'comfort'}`}>
              {article.suggestionType === 'Challenge' ? 'Perspective Widener' : 'Comfort Read'}
            </div>
        )}

        {isOpEd && (
           <div className="badge opinion">
              OPINION
           </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={`article-card ${isPlaying ? 'now-playing' : ''}`}>
        {renderTopBadges()}
        
        <div className="article-image">
          {!imageLoaded && (
             <div className="skeleton-pulse" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
          )}
          
          <img 
            src={imgSrc} 
            alt={article.headline} 
            onError={handleImageError} 
            onLoad={() => setImageLoaded(true)} 
            loading="lazy" 
            style={{ 
                opacity: imageLoaded ? 1 : 0, 
                transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative', 
                zIndex: 1 
            }}
          />
        </div>
        
        <div className="article-content">
          <div className="article-content-top">
             <div className="category-row">
                <span className="category-tag">
                    {article.category || 'News'}
                </span>
             </div>

            <div className="article-headline-link" onClick={(e) => { stopMobileClick(e); setShowBriefing(true); }} style={{ cursor: 'pointer' }} title="Open Smart Briefing">
                <h3 className="article-headline">{article.headline}</h3>
            </div>
            <p className="article-summary">{article.summary}</p>
          </div>
          
          <div className="article-content-bottom">
            <div className="article-meta-v2">
              <span className="source" title={article.source}>{article.source}</span>
              
              {isHardNews && (
                <>
                  <span className="meta-divider">|</span>
                  <span className="bias-score-card" onClick={(e) => showTooltip("Bias Score (0-100). Less is better.", e)}>Bias: <span className="accent-text">{article.biasScore}</span></span>
                  <span className="meta-divider">|</span>
                  <span className="political-lean-card"><span className={article.politicalLean !== 'Not Applicable' ? 'accent-text' : ''}>{article.politicalLean}</span></span>
                </>
              )}
            </div>
            
            <div className="quality-display-v2">
                {!isHardNews ? (
                    <>
                        <span className="quality-grade-text info">
                            <span style={{ fontSize: '12px', marginRight: '4px' }}>{isOpEd ? '🗣️' : '⚡'}</span> 
                            {isOpEd ? 'Core Argument' : 'Quick Summary'}
                        </span>
                        <span className="sentiment-text" onClick={(e) => showTooltip("The tone of this article.", e)}>
                            Sentiment: <span className={sentimentInfo.className}>{sentimentInfo.label}</span>
                        </span>
                    </>
                ) : (
                    <>
                        <span className="quality-grade-text" onClick={(e) => showTooltip("Grade based on credibility.", e)}>
                            Grade: {article.credibilityGrade ? <span className="accent-text">{article.credibilityGrade}</span> : 'N/A'}
                        </span>
                        <span className="sentiment-text" onClick={(e) => showTooltip("Overall Sentiment.", e)}>
                            Sentiment: <span className={sentimentInfo.className}>{sentimentInfo.label}</span>
                        </span>
                    </>
                )}
            </div>
            
            <div className="article-actions">
              {isHardNews && (
                <>
                  <div className="article-actions-top">
                    <button onClick={(e) => { stopMobileClick(e); setShowBriefing(true); }} className="btn-primary brief-btn">Brief</button>
                    <ListenButton />
                    <button onClick={(e) => { stopMobileClick(e); onShare(article); }} className="btn-secondary">Share</button>
                    <SaveButton /> 
                  </div>
                  <button onClick={(e) => { stopMobileClick(e); onCompare(article); }} className="btn-primary btn-full-width">
                      {(article.clusterCount || 0) > 1 ? `Compare Coverage (${article.clusterCount})` : "Compare Coverage"}
                  </button>
                </>
              )}
              
              {!isHardNews && (
                <>
                  <div className="article-actions-top">
                    <ListenButton />
                    <button onClick={(e) => { stopMobileClick(e); onShare(article); }} className="btn-secondary">Share</button>
                    <SaveButton /> 
                  </div>
                  {showCompareOnSoft ? (
                     <button onClick={(e) => { stopMobileClick(e); onCompare(article); }} className="btn-primary btn-full-width">Compare Coverage ({article.clusterCount})</button>
                  ) : (
                     <button onClick={(e) => { stopMobileClick(e); onRead(article); }} className="btn-primary btn-full-width">
                        {isOpEd ? 'Read Full Opinion' : 'Read Article'}
                     </button>
                  )}
                </>
              )}
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
