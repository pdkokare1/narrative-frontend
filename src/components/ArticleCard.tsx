// src/components/ArticleCard.tsx
import React, { useState, useEffect, memo } from 'react'; 
import './ArticleCard.css'; 
import { isOpinion, getOptimizedImageUrl, generateImageSrcSet } from '../utils/helpers'; 
import { getFallbackImage } from '../utils/constants'; 
import { IArticle } from '../types';
import useHaptic from '../hooks/useHaptic'; 
import InlineSmartBrief from './InlineSmartBrief'; 

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
  
  const [showBrief, setShowBrief] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const triggerHaptic = useHaptic(); 

  const isHardNews = article?.analysisType === 'Full';
  const isOpEd = isOpinion(article);
  
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
      setShowBrief(false); 
  }, [article?.imageUrl, article?.category, article?._id]);

  const handleImageError = () => {
      setCurrentSrc(getFallbackImage(article?.category));
      setCurrentSrcSet(undefined);
  };

  const preventBubble = (e: React.MouseEvent) => e.stopPropagation();

  const handleInteraction = (action: () => void, type: 'light' | 'medium' = 'light') => {
      triggerHaptic(type);
      action();
  };

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

  // Helper to map sentiment to user-friendly terms
  const getSentimentDisplay = (sentiment: string) => {
    if (sentiment === 'Positive') return 'Supportive';
    if (sentiment === 'Negative') return 'Critical';
    return sentiment;
  };

  const hasStats = article && (
    article.biasScore !== undefined || 
    (article.politicalLean && article.politicalLean !== 'Unknown') || 
    article.sentiment
  );

  if (!article) return null;

  return (
    <>
      <article className={`article-card ${isPlaying ? 'now-playing' : ''} ${showBrief ? 'show-brief-mode' : ''}`}>
        
        <div className="card-badges">
          {article.suggestionType === 'Challenge' && <span className="badge challenge">Perspective</span>}
          {isOpEd && <span className="badge opinion">Opinion</span>}
        </div>
        
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
          {/* OVERLAY ELEMENTS: Source (Top Left) & Date (Bottom Right) */}
          <span className="overlay-source">{article.source}</span>
          <time className="overlay-date">{new Date(article.publishedAt).toLocaleDateString()}</time>
        </div>
        
        {/* OPTION 1: Glassmorphism Overlay for Smart Brief */}
        {showBrief && isHardNews && (
          <div className="smart-brief-overlay" onClick={() => setShowBrief(false)}>
            <div className="smart-brief-content" onClick={(e) => e.stopPropagation()}>
               <InlineSmartBrief articleId={article._id} />
            </div>
          </div>
        )}

        <div className="article-content">
          
          <button 
            className="article-headline-btn"
            onClick={(e) => { 
                preventBubble(e); 
                handleInteraction(() => isHardNews ? setShowBrief(!showBrief) : null); 
            }}
            aria-label={`Read analysis for ${article.headline}`}
          >
            {article.headline}
          </button>

          {/* Always render summary to maintain layout height */}
          <p className="article-summary">{article.summary}</p>
          
          <div className="article-footer">
            
            {hasStats && (
                <div className="stats-container">
                    
                    {/* ROW 1: Bias & Lean */}
                    <div className="stats-row">
                        {article.biasScore !== undefined && (
                            <>
                                <button className="stat-item-btn" onClick={(e) => showTooltip("Bias Score (0-100). Lower is better.", e)}>
                                    <span>Bias:</span>
                                    <span className="stat-val accent-text">
                                      {article.biasScore === 0 ? 'NA' : article.biasScore}
                                    </span>
                                </button>
                                {/* Divider now Pipe */}
                                {article.politicalLean && <span className="divider">|</span>}
                            </>
                        )}
                        
                        {article.politicalLean && (
                            <div className="stat-item">
                                <span>Lean:</span>
                                <span className={`stat-val ${getLeanClass(article.politicalLean)}`}>
                                    {(article.politicalLean === 'Unknown' || article.politicalLean === 'Not Applicable') 
                                      ? 'NA' 
                                      : article.politicalLean}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ROW 2: Grade & Sentiment */}
                    <div className="stats-row">
                        {(article.credibilityGrade || isHardNews) && (
                            <>
                                <div className="stat-item">
                                    <span>Grade:</span>
                                    <span className="stat-val accent-text">
                                        {article.credibilityGrade || 'NA'}
                                    </span>
                                </div>
                                {/* Divider now Pipe */}
                                {article.sentiment && <span className="divider">|</span>}
                            </>
                        )}

                        {article.sentiment && (
                            <div className="stat-item">
                                <span>Sentiment:</span>
                                <span className={`stat-val ${getSentimentClass(article.sentiment)}`}>
                                    {getSentimentDisplay(article.sentiment)}
                                </span>
                            </div>
                        )}
                    </div>

                </div>
            )}

            <div className="action-bar">
                <div className="action-left">
                    <Button 
                        variant="icon" 
                        isActive={isPlaying}
                        onClick={(e) => { 
                            preventBubble(e); 
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
                        handleInteraction(() => {
                           if (isHardNews) {
                               setShowBrief(!showBrief);
                           } else {
                               onRead(article);
                           }
                        }); 
                    }}
                >
                    {isHardNews ? (showBrief ? 'Close Brief' : 'Smart Brief') : 'Read Source'}
                </Button>
            </div>
          </div>
        </div>
      </article>
    </>
  );
});

export default ArticleCard;
