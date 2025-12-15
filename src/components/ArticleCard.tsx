// src/components/ArticleCard.tsx
import React, { useState, useEffect, memo } from 'react'; 
import './ArticleCard.css'; 
import { isOpinion, getOptimizedImageUrl, generateImageSrcSet } from '../utils/helpers'; 
import { getFallbackImage } from '../utils/constants'; 
import SmartBriefingModal from './modals/SmartBriefingModal';
import { IArticle } from '../types';

// --- UI Components ---
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

  // 1. Calculate values safely
  const isHardNews = article?.analysisType === 'Full';
  const isOpEd = isOpinion(article);
  
  // 2. Image Logic
  const fallbackImg = getFallbackImage(article?.category);
  const defaultSrc = getOptimizedImageUrl(article?.imageUrl, 600) || fallbackImg;
  const srcSet = article?.imageUrl ? generateImageSrcSet(article.imageUrl) : undefined;

  const [currentSrc, setCurrentSrc] = useState(defaultSrc);
  const [currentSrcSet, setCurrentSrcSet] = useState(srcSet);

  useEffect(() => {
      if (!article) return;
      const newDefault = getOptimizedImageUrl(article.imageUrl, 600) || getFallbackImage(article.category);
      const newSrcSet = article.imageUrl ? generateImageSrcSet(article.imageUrl) : undefined;
      setCurrentSrc(newDefault);
      setCurrentSrcSet(newSrcSet);
      setImageLoaded(false); 
  }, [article?.imageUrl, article?.category]);

  const handleImageError = () => {
      setCurrentSrc(getFallbackImage(article?.category));
      setCurrentSrcSet(undefined);
  };

  const preventBubble = (e: React.MouseEvent) => e.stopPropagation();

  if (!article) return null;

  return (
    <>
      <article className={`article-card ${isPlaying ? 'now-playing' : ''}`}>
        
        {/* --- BADGES --- */}
        <div className="card-badges">
          {article.suggestionType === 'Challenge' && <span className="badge challenge">Perspective</span>}
          {isOpEd && <span className="badge opinion">Opinion</span>}
        </div>
        
        {/* --- IMAGE --- */}
        <div className="article-image">
          <img 
            src={currentSrc}
            srcSet={currentSrcSet}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            alt="" 
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
             <time className="date">{new Date(article.publishedAt).toLocaleDateString()}</time>
          </div>

          {/* ACCESSIBILITY FIX: Use button for interactive headline */}
          <button 
            className="article-headline-btn"
            onClick={(e) => { preventBubble(e); setShowBriefing(true); }}
            aria-label={`Read analysis for ${article.headline}`}
          >
            {article.headline}
          </button>

          <p className="article-summary">{article.summary}</p>
          
          {/* --- FOOTER --- */}
          <div className="article-footer">
            
            {/* Stats */}
            {isHardNews && (
                <div className="stats-row">
                    <button className="stat-item-btn" onClick={(e) => showTooltip("Bias Score (0-100). Lower is better.", e)}>
                        <span>Bias:</span>
                        <span className="stat-val accent-text">{article.biasScore}</span>
                    </button>
                    <span className="divider">•</span>
                    <div className="stat-item">
                        <span>Lean:</span>
                        <span className={`stat-val ${article.politicalLean === 'Center' ? 'accent-text' : ''}`}>{article.politicalLean}</span>
                    </div>
                </div>
            )}

            {/* Action Bar */}
            <div className="action-bar">
                <div className="action-left">
                    <Button 
                        variant="icon" 
                        isActive={isPlaying}
                        onClick={(e) => { preventBubble(e); (isPlaying && onStop ? onStop() : onPlay?.()); }}
                        title={isPlaying ? "Stop" : "Listen"}
                        aria-label={isPlaying ? "Stop audio" : "Listen to article"}
                    >
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </Button>

                    <Button 
                        variant="icon" 
                        isActive={isSaved}
                        onClick={(e) => { preventBubble(e); onToggleSave(article); }}
                        title={isSaved ? "Remove" : "Save"}
                        aria-label={isSaved ? "Remove from saved" : "Save article"}
                    >
                        <BookmarkIcon filled={isSaved} />
                    </Button>

                    <Button 
                        variant="icon" 
                        onClick={(e) => { preventBubble(e); onShare(article); }}
                        title="Share"
                        aria-label="Share article"
                    >
                        <ShareIcon />
                    </Button>

                    {(isHardNews || (article.clusterCount || 0) > 1) && (
                        <Button 
                            variant="icon" 
                            onClick={(e) => { preventBubble(e); onCompare(article); }}
                            title="Compare Coverage"
                            aria-label="Compare coverage"
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
      </article>

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
