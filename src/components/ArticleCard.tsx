// src/components/ArticleCard.tsx
import React, { useState, useEffect, memo } from 'react'; 
import './ArticleCard.css'; 
import { getSentimentInfo, isOpinion, getOptimizedImageUrl } from '../utils/helpers'; 
import { getFallbackImage } from '../utils/constants'; 
import SmartBriefingModal from './modals/SmartBriefingModal';
import useIsMobile from '../hooks/useIsMobile';
import useHaptic from '../hooks/useHaptic'; 
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
  const vibrate = useHaptic();

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

  const handleAction = (action: () => void, e: React.MouseEvent) => {
      e.stopPropagation();
      vibrate();
      action();
  };

  // --- SVG ICONS ---
  const PlayIcon = () => <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
  const PauseIcon = () => <svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>;
  const BookmarkIcon = () => <svg viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>;
  const ShareIcon = () => <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>;
  const CompareIcon = () => <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>;

  return (
    <>
      <div className={`article-card ${isPlaying ? 'now-playing' : ''}`}>
        {/* --- 1. BADGES --- */}
        <div className="card-badges">
          {article.suggestionType === 'Challenge' && <div className="badge challenge">Perspective</div>}
          {isOpEd && <div className="badge opinion">Opinion</div>}
        </div>
        
        {/* --- 2. IMAGE --- */}
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
        
        {/* --- 3. CONTENT --- */}
        <div className="article-content">
          
          {/* Metadata */}
          <div className="article-meta-top">
             <span className="source-name">{article.source}</span>
             <span className="date">{new Date(article.publishedAt).toLocaleDateString()}</span>
          </div>

          {/* Headline */}
          <h3 
            className="article-headline" 
            onClick={(e) => handleAction(() => setShowBriefing(true), e)}
          >
            {article.headline}
          </h3>

          {/* Summary */}
          <p className="article-summary">{article.summary}</p>
          
          {/* Footer & Actions */}
          <div className="article-footer">
            
            {/* Stats Row */}
            {isHardNews && (
                <div className="stats-row">
                    <div className="stat-item" onClick={(e) => showTooltip("Bias Score (0-100). Lower is better.", e)}>
                        <span>Bias:</span>
                        <span className="stat-val accent-text">{article.biasScore}</span>
                    </div>
                    <span>•</span>
                    <div className="stat-item">
                        <span>Lean:</span>
                        <span className={`stat-val ${article.politicalLean === 'Center' ? 'accent-text' : ''}`}>{article.politicalLean}</span>
                    </div>
                </div>
            )}

            {/* Main Action Bar */}
            <div className="action-bar">
                
                <div className="action-left">
                    {/* Play Button */}
                    <button 
                        className={`icon-btn ${isPlaying ? 'active' : ''}`}
                        onClick={(e) => handleAction(isPlaying && onStop ? onStop : (onPlay || (() => {})), e)}
                        title={isPlaying ? "Stop" : "Listen to Analysis"}
                    >
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>

                    {/* Save Button */}
                    <button 
                        className={`icon-btn ${isSaved ? 'active' : ''}`}
                        onClick={(e) => handleAction(() => onToggleSave(article), e)}
                        title={isSaved ? "Remove" : "Save for later"}
                    >
                        <BookmarkIcon />
                    </button>

                    {/* Share Button */}
                    <button 
                        className="icon-btn"
                        onClick={(e) => handleAction(() => onShare(article), e)}
                        title="Share Analysis"
                    >
                        <ShareIcon />
                    </button>

                    {/* Compare Button (Conditional) */}
                    {(isHardNews || (article.clusterCount || 0) > 1) && (
                        <button 
                            className="icon-btn"
                            onClick={(e) => handleAction(() => onCompare(article), e)}
                            title="Compare Coverage"
                        >
                            <CompareIcon />
                        </button>
                    )}
                </div>

                {/* Primary Text Action */}
                <button 
                    className="read-btn"
                    onClick={(e) => isHardNews ? handleAction(() => setShowBriefing(true), e) : handleAction(() => onRead(article), e)}
                >
                    {isHardNews ? 'Smart Brief' : 'Read Source'}
                </button>

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
