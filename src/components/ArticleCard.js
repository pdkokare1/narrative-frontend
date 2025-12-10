// In file: src/components/ArticleCard.js
import React, { useState, useEffect } from 'react';
import './ArticleCard.css'; 
import { getSentimentInfo, isOpinion, getOptimizedImageUrl } from '../utils/helpers'; // <--- NEW IMPORT
import { getFallbackImage } from '../utils/constants'; 
import SmartBriefingModal from './modals/SmartBriefingModal';
import useIsMobile from '../hooks/useIsMobile';

function ArticleCard({ 
  article, 
  onCompare, 
  onAnalyze, 
  onShare, 
  onRead, 
  showTooltip, 
  isSaved,      
  onToggleSave,
  // --- AUDIO PROPS ---
  isPlaying, 
  onPlay, 
  onStop 
}) {
  const [showBriefing, setShowBriefing] = useState(false);
  const isMobileView = useIsMobile();

  // Logic Types
  const isHardNews = article.analysisType === 'Full';
  const isOpEd = isOpinion(article);
  const showCompareOnSoft = !isHardNews && (article.clusterCount > 1);

  // Sentiment Data
  const sentimentInfo = getSentimentInfo(article.sentiment);

  // --- NEW: Image Handling State with Optimization ---
  // We wrap the URL in getOptimizedImageUrl to resize it via Cloudinary
  const optimizedUrl = getOptimizedImageUrl(article.imageUrl);
  
  const [imgSrc, setImgSrc] = useState(optimizedUrl || getFallbackImage(article.category));

  // Reset image if the article prop changes (e.g. during scrolling/recycling)
  useEffect(() => {
      const newUrl = getOptimizedImageUrl(article.imageUrl);
      setImgSrc(newUrl || getFallbackImage(article.category));
  }, [article.imageUrl, article.category]);

  const handleImageError = () => {
      // If the optimized image fails, swap to the category fallback
      const fallback = getFallbackImage(article.category);
      if (imgSrc !== fallback) {
          setImgSrc(fallback);
      }
  };

  const stopMobileClick = (e) => { if (isMobileView) { e.stopPropagation(); } };

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
    if (isPlaying) {
      return (
        <button 
          onClick={(e) => { stopMobileClick(e); onStop(); }} 
          className="btn-secondary"
          style={{ color: '#E57373', borderColor: '#E57373', fontWeight: '700' }}
        >
          Stop
        </button>
      );
    }
    return (
      <button 
        onClick={(e) => { stopMobileClick(e); onPlay(); }} 
        className="btn-secondary"
      >
        Listen
      </button>
    );
  };

  // --- BADGES ---
  const renderTopBadges = () => {
    return (
      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px', zIndex: 2 }}>
        
        {/* Suggestion Badge (Comfort/Challenge) */}
        {article.suggestionType && (
            <div style={{
              background: article.suggestionType === 'Challenge' ? 'var(--accent-primary)' : 'var(--bg-elevated)',
              color: article.suggestionType === 'Challenge' ? 'white' : 'var(--text-secondary)',
              border: article.suggestionType === 'Challenge' ? 'none' : '1px solid var(--border-color)',
              padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            }}>
              {article.suggestionType === 'Challenge' ? 'Perspective Widener' : 'Comfort Read'}
            </div>
        )}

        {/* OPINION Badge */}
        {isOpEd && (
           <div style={{
              background: '#FFB300', // Amber/Yellow
              color: '#000',
              border: 'none',
              padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              letterSpacing: '0.5px'
           }}>
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
        
        {/* --- UPDATED IMAGE SECTION --- */}
        <div className="article-image">
          <img 
            src={imgSrc} 
            alt={article.headline} 
            onError={handleImageError} 
            loading="lazy" 
          />
        </div>
        
        <div className="article-content">
          <div className="article-content-top">
             <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ 
                    fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', 
                    fontWeight: '700', color: 'var(--accent-primary)',
                    background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px',
                    border: '1px solid var(--border-color)'
                }}>
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
              
              {/* Show Scores ONLY for Hard News */}
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
                {/* Soft News / Opinion: Show Argument & Sentiment */}
                {!isHardNews ? (
                    <>
                        <span className="quality-grade-text" style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ fontSize: '12px', marginRight: '4px' }}>{isOpEd ? '🗣️' : '⚡'}</span> 
                            {isOpEd ? 'Core Argument' : 'Quick Summary'}
                        </span>
                        <span className="sentiment-text" onClick={(e) => showTooltip("The tone of this article.", e)}>
                            Sentiment: <span className={sentimentInfo.className}>{sentimentInfo.label}</span>
                        </span>
                    </>
                ) : (
                    /* Hard News: Show Grade & Sentiment */
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
              {/* Hard News Actions */}
              {isHardNews && (
                <>
                  <div className="article-actions-top">
                    <button onClick={(e) => { stopMobileClick(e); setShowBriefing(true); }} className="btn-primary" style={{ background: 'var(--bg-elevated)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}>Brief</button>
                    <ListenButton />
                    <button onClick={(e) => { stopMobileClick(e); onShare(article); }} className="btn-secondary">Share</button>
                    <SaveButton /> 
                  </div>
                  <button onClick={(e) => { stopMobileClick(e); onCompare(article); }} className="btn-primary btn-full-width">
                      {article.clusterCount > 1 ? `Compare Coverage (${article.clusterCount})` : "Compare Coverage"}
                  </button>
                </>
              )}
              
              {/* Soft News / Opinion Actions */}
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
}

export default ArticleCard;
