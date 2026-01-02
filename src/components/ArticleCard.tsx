// src/components/ArticleCard.tsx
import React, { useState, useEffect, memo } from 'react'; 
import './ArticleCard.css'; 
import { isOpinion, getOptimizedImageUrl, generateImageSrcSet } from '../utils/helpers'; 
import { getFallbackImage } from '../utils/constants'; 
import SmartBriefingModal from './modals/SmartBriefingModal';
import { IArticle } from '../types';
import useHaptic from '../hooks/useHaptic'; // Import Haptics

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
  const triggerHaptic = useHaptic(); // Initialize Haptics

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

  // Helper for Haptic Interaction
  const handleInteraction = (action: () => void, type: 'light' | 'medium' = 'light') => {
      triggerHaptic(type);
      action();
  };

  // --- Visual Helpers for Stats ---
  const getLeanClass = (lean: string) => {
    if (!lean) return '';
    if (lean.includes('Left')) return 'lean-left';
    if (lean.includes('Right')) return 'lean-right';
    if (lean === 'Center') return 'lean-center';
    return '';
  };

  const getSentimentClass = (sentiment: string) => {
    if (!sentiment) return 'sentiment-neu';
    if (sentiment === 'Positive') return 'sentiment-pos';
    if (sentiment === 'Negative') return 'sentiment-neg';
    return 'sentiment-neu';
  };

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
            onClick={(e) => { 
                preventBubble(e); 
                handleInteraction(() => setShowBriefing(true)); 
            }}
            aria-label={`Read analysis for ${article.headline}`}
          >
            {article.headline}
          </button>

          <p className="article-summary">{article.summary}</p>
          
          {/* --- FOOTER --- */}
          <div className="article-footer">
            
            {/* Stats - Now showing Bias, Lean, AND Sentiment */}
            {isHardNews && (
                <div className="stats-row">
                    <button className="stat-item-btn" onClick={(e) => showTooltip("Bias Score (0-100). Lower is better.", e)}>
                        <span>Bias:</span>
                        <span className="stat-val accent-text">{article.biasScore}</span>
                    </button>
                    
                    <span className="divider">•</span>
                    
                    <div className="stat-item">
                        <span>Lean:</span>
                        <span className={`stat-val ${getLeanClass(article.politicalLean)}`}>
                            {article.politicalLean}
                        </span>
                    </div>

                    <span className="divider">•</span>

                    <div className="stat-item">
                        <span>Sent:</span>
                        <span className={`stat-val ${getSentimentClass(article.sentiment)}`}>
                            {article.sentiment}
                        </span>
                    </div>
                </div>
            )}

            {/* Action Bar */}
            <div className="action-bar">
                <div className="action-left">
                    <Button 
                        variant="icon" 
                        isActive={isPlaying}
                        onClick={(e) => { 
                            preventBubble(e); 
                            // Medium impact for Play/Pause as it's a primary action
                            handleInteraction(() => (isPlaying && onStop ? onStop() : onPlay?.()), 'medium'); 
                        }}
                        title={isPlaying ? "Stop" : "Listen"}
                        aria-label={isPlaying ? "Stop audio" : "Listen to article"}
                    >
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </Button>

                    <Button 
                        variant="icon" 
                        isActive={isSaved}
                        onClick={(e) => { 
                            preventBubble(e); 
                            // Light impact for Save (immediate feedback)
                            handleInteraction(() => onToggleSave(article)); 
                        }}
                        title={isSaved ? "Remove" : "Save"}
                        aria-label={isSaved ? "Remove from saved" : "Save article"}
                    >
                        <BookmarkIcon filled={isSaved} />
                    </Button>

                    <Button 
                        variant="icon" 
                        onClick={(e) => { 
                            preventBubble(e); 
                            handleInteraction(() => onShare(article)); 
                        }}
                        title="Share"
                        aria-label="Share article"
                    >
                        <ShareIcon />
                    </Button>

                    {(isHardNews || (article.clusterCount || 0) > 1) && (
                        <Button 
                            variant="icon" 
                            onClick={(e) => { 
                                preventBubble(e); 
                                handleInteraction(() => onCompare(article)); 
                            }}
                            title="Compare Coverage"
                            aria-label="Compare coverage"
                        >
                            <CompareIcon />
                        </Button>
                    )}
                </div>

                <Button 
                    variant="text"
                    onClick={(e) => { 
                        preventBubble(e); 
                        handleInteraction(() => isHardNews ? setShowBriefing(true) : onRead(article)); 
                    }}
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
