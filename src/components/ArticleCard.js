// In file: src/components/ArticleCard.js
import React, { useState } from 'react';
import './ArticleCard.css'; 
import { getSentimentClass } from '../utils/helpers';
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
  // --- NEW PROPS FOR AUDIO ---
  isPlaying, 
  onPlay, 
  onStop 
}) {
  const [showBriefing, setShowBriefing] = useState(false);
  const isMobileView = useIsMobile();

  // Soft News vs Hard News Logic
  const isSoftNews = article.analysisType === 'SentimentOnly';
  const showCompareOnSoft = isSoftNews && (article.clusterCount > 1);

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    const placeholder = e.target.nextElementSibling;
    if (placeholder && placeholder.classList.contains('image-placeholder')) {
      placeholder.style.display = 'flex';
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

  // --- NEW: Audio Button Component ---
  const ListenButton = () => {
    if (isPlaying) {
      return (
        <button 
          onClick={(e) => { stopMobileClick(e); onStop(); }} 
          className="btn-secondary"
          style={{ color: '#E57373', borderColor: '#E57373', fontWeight: '700' }}
        >
          Stop Audio
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

  const renderSuggestionBadge = () => {
    if (!article.suggestionType) return null;
    const isChallenge = article.suggestionType === 'Challenge';
    const badgeStyle = {
      position: 'absolute', top: '10px', right: '10px',
      background: isChallenge ? 'var(--accent-primary)' : 'var(--bg-elevated)',
      color: isChallenge ? 'white' : 'var(--text-secondary)',
      border: isChallenge ? 'none' : '1px solid var(--border-color)',
      padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600',
      zIndex: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
    };
    return <div style={badgeStyle}>{isChallenge ? 'Perspective Widener' : 'Comfort Read'}</div>;
  };

  return (
    <>
      {/* Updated Container Class:
          We append "now-playing" if this card is currently being read by the Radio 
      */}
      <div className={`article-card ${isPlaying ? 'now-playing' : ''}`}>
        {renderSuggestionBadge()}
        
        <div className="article-image">
          {article.imageUrl ? (
            <img src={article.imageUrl} alt={article.headline} onError={handleImageError} loading="lazy" />
          ) : null}
          <div className="image-placeholder" style={{ display: article.imageUrl ? 'none' : 'flex' }}>📰</div>
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
              {!isSoftNews && (
                <>
                  <span className="meta-divider">|</span>
                  <span className="bias-score-card" onClick={(e) => showTooltip("Bias Score (0-100). Less is better.", e)}>Bias: <span className="accent-text">{article.biasScore}</span></span>
                  <span className="meta-divider">|</span>
                  <span className="political-lean-card"><span className={article.politicalLean !== 'Not Applicable' ? 'accent-text' : ''}>{article.politicalLean}</span></span>
                </>
              )}
            </div>
            
            <div className="quality-display-v2">
                {isSoftNews ? (
                    <span className="quality-grade-text" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ fontSize: '12px', marginRight: '4px' }}>⚡</span> Quick Summary
                    </span>
                ) : (
                    <span className="quality-grade-text" onClick={(e) => showTooltip("Grade based on credibility.", e)}>
                        Grade: {article.credibilityGrade ? <span className="accent-text">{article.credibilityGrade}</span> : 'N/A'}
                    </span>
                )}
                <span className="sentiment-text" onClick={(e) => showTooltip("Overall Sentiment.", e)}>
                    Sentiment: <span className={getSentimentClass(article.sentiment)}>{' '}{article.sentiment}</span>
                </span>
            </div>
            
            <div className="article-actions">
              {/* Hard News Actions */}
              {!isSoftNews && (
                <>
                  <div className="article-actions-top">
                    <button onClick={(e) => { stopMobileClick(e); setShowBriefing(true); }} className="btn-primary" style={{ background: 'var(--bg-elevated)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}>Brief</button>
                    {/* Added Listen Button Here */}
                    <ListenButton />
                    <button onClick={(e) => { stopMobileClick(e); onShare(article); }} className="btn-secondary">Share</button>
                    <SaveButton /> 
                  </div>
                  <button onClick={(e) => { stopMobileClick(e); onCompare(article); }} className="btn-primary btn-full-width">
                      {article.clusterCount > 1 ? `Compare Coverage (${article.clusterCount})` : "Compare Coverage"}
                  </button>
                </>
              )}
              
              {/* Soft News Actions (Summary Mode) */}
              {isSoftNews && (
                <>
                  <div className="article-actions-top">
                    <ListenButton />
                    <button onClick={(e) => { stopMobileClick(e); onShare(article); }} className="btn-secondary">Share</button>
                    <SaveButton /> 
                  </div>
                  {showCompareOnSoft ? (
                     <button onClick={(e) => { stopMobileClick(e); onCompare(article); }} className="btn-primary btn-full-width">Compare Coverage ({article.clusterCount})</button>
                  ) : (
                     <button onClick={(e) => { stopMobileClick(e); onRead(article); }} className="btn-primary btn-full-width">Read Article</button>
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
