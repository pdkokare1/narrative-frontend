// src/components/ArticleCard.tsx
import React, { useState, useEffect, memo } from 'react'; 
import './ArticleCard.css'; 
import { isOpinion, getOptimizedImageUrl, generateImageSrcSet } from '../utils/helpers'; 
import { getFallbackImage } from '../utils/constants'; 
import SmartBriefingModal from './modals/SmartBriefingModal';
import useIsMobile from '../hooks/useIsMobile';
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
  const isMobileView = useIsMobile();

  // 1. Calculate values safely
  const isHardNews = article?.analysisType === 'Full';
  const isOpEd = isOpinion(article);
  
  // 2. Image Logic
  const fallbackImg = getFallbackImage(article?.category);
  // Default source (fallback or optimized 600px for legacy browsers)
  const defaultSrc = getOptimizedImageUrl(article?.imageUrl, 600) || fallbackImg;
  // SrcSet for modern responsive loading
  const srcSet = article?.imageUrl ? generateImageSrcSet(article.imageUrl) : undefined;

  // 3. State for handling load errors
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
      // If the optimized image fails, clear srcset and show local fallback
      setCurrentSrc(getFallbackImage(article?.category));
      setCurrentSrcSet(undefined);
  };

  const preventBubble = (e: React.MouseEvent) => e.stopPropagation();

  if (!article) return null;

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
            src={currentSrc}
            srcSet={currentSrcSet}
            // Logic:
            // Mobile (<768px): 100% viewport width
            // Tablet (<1200px): 50% viewport width (2 col grid)
            // Desktop: 33% viewport width (3 col grid)
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
            
            {/* Stats */}
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
