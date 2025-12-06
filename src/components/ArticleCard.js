// In file: src/components/ArticleCard.js
import React, { useState } from 'react';
import '../App.css'; 
import { getSentimentClass } from '../utils/helpers';
import SmartBriefingModal from './modals/SmartBriefingModal';
// --- Use Custom Hook ---
import useIsMobile from '../hooks/useIsMobile';

function ArticleCard({ 
  article, 
  onCompare, 
  onAnalyze, 
  onShare, 
  onRead, 
  showTooltip, 
  isSaved,      
  onToggleSave  
}) {
  const [showBriefing, setShowBriefing] = useState(false);

  // --- Replace manual check with Hook ---
  const isMobileView = useIsMobile();

  const isReview = article.analysisType === 'SentimentOnly';
  const showCompareOnReview = isReview && (article.clusterCount > 1);
  const showReadOnReview = isReview && (article.clusterCount <= 1);

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    const placeholder = e.target.nextElementSibling;
    if (placeholder && placeholder.classList.contains('image-placeholder')) {
      placeholder.style.display = 'flex';
    }
  };

  // Updated to use the boolean variable directly
  const stopMobileClick = (e) => { if (isMobileView) { e.stopPropagation(); } };

  // --- Reusable Save Button ---
  const SaveButton = () => (
    <button 
      onClick={(e) => { stopMobileClick(e); onToggleSave(article); }} 
      className="btn-secondary" 
      title={isSaved ? "Remove from saved" : "Save article"}
    >
      {isSaved ? 'Unsave' : 'Save'}
    </button>
  );

  // --- Suggestion Badge Logic ---
  const renderSuggestionBadge = () => {
    if (!article.suggestionType) return null;
    
    const isChallenge = article.suggestionType === 'Challenge';
    const badgeStyle = {
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: isChallenge ? 'var(--accent-primary)' : 'var(--bg-elevated)',
      color: isChallenge ? 'white' : 'var(--text-secondary)',
      border: isChallenge ? 'none' : '1px solid var(--border-color)',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: '600',
      zIndex: 2,
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    };

    return (
      <div style={badgeStyle} title={isChallenge ? "This article offers a different perspective" : "Matches your usual reading habits"}>
        {isChallenge ? 'Perspective Widener' : 'Comfort Read'}
      </div>
    );
  };

  return (
    <>
      <div className="article-card">
        {renderSuggestionBadge()}
        
        <div className="article-image">
          {article.imageUrl ? (
            <img src={article.imageUrl} alt={article.headline} onError={handleImageError} loading="lazy" />
          ) : null}
          <div className="image-placeholder" style={{ display: article.imageUrl ? 'none' : 'flex' }}>📰</div>
        </div>
        
        <div className="article-content">
          <div className="article-content-top">
            <div className="article-headline-link" onClick={(e) => { stopMobileClick(e); setShowBriefing(true); }} style={{ cursor: 'pointer' }} title="Open Smart Briefing">
                <h3 className="article-headline">{article.headline}</h3>
            </div>
            <p className="article-summary">{article.summary}</p>
          </div>
          
          <div className="article-content-bottom">
            <div className="article-meta-v2">
              <span className="source" title={article.source}>{article.source}</span>
              {!isReview && (
                <>
                  <span className="meta-divider">|</span>
                  <span className="bias-score-card" title="Bias Score (0-100). Less is better." onClick={(e) => showTooltip("Bias Score (0-100). Less is better.", e)}>Bias: <span className="accent-text">{article.biasScore}</span></span>
                  <span className="meta-divider">|</span>
                  <span className="political-lean-card" title="Detected political leaning." onClick={(e) => showTooltip("Detected political leaning.", e)}><span className={article.politicalLean !== 'Not Applicable' ? 'accent-text' : ''}>{article.politicalLean}</span></span>
                </>
              )}
            </div>
            
            <div className="quality-display-v2">
                {isReview ? (
                    <span className="quality-grade-text" title="This article is an opinion, review, or summary." onClick={(e) => showTooltip("This article is an opinion, review, or summary.", e)}>Opinion / Review</span>
                ) : (
                    <span className="quality-grade-text" title="This grade (A+ to F) is based on the article's Credibility and Reliability." onClick={(e) => showTooltip("This grade (A+ to F) is based on the article's Credibility and Reliability.", e)}>Grade: {article.credibilityGrade ? <span className="accent-text">{article.credibilityGrade}</span> : 'N/A'}</span>
                )}
                <span className="sentiment-text" title="The article's overall sentiment towards its main subject." onClick={(e) => showTooltip("The article's overall sentiment towards its main subject.", e)}>Sentiment: <span className={getSentimentClass(article.sentiment)}>{' '}{article.sentiment}</span></span>
            </div>
            
            <div className="article-actions">
              {!isReview && (
                <>
                  <div className="article-actions-top">
                    <button 
                        onClick={(e) => { stopMobileClick(e); setShowBriefing(true); }} 
                        className="btn-primary" 
                        style={{ background: 'var(--bg-elevated)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}
                        title="Get an AI summary and key findings"
                    >
                        ⚡ Quick Brief
                    </button>
                    <button onClick={(e) => { stopMobileClick(e); onShare(article); }} className="btn-secondary" title="Share article link">Share</button>
                    <SaveButton /> 
                  </div>
                  <button onClick={(e) => { stopMobileClick(e); onCompare(article); }} className="btn-primary btn-full-width" title={article.clusterCount > 1 ? `Compare with ${article.clusterCount - 1} other articles` : "Find other perspectives"}>{article.clusterCount > 1 ? `Compare Coverage (${article.clusterCount})` : "Compare Coverage"}</button>
                </>
              )}
              
              {showCompareOnReview && (
                <>
                  <div className="article-actions-top">
                    <button onClick={(e) => { stopMobileClick(e); onShare(article); }} className="btn-secondary" title="Share article link">Share</button>
                    <SaveButton /> 
                  </div>
                  <button onClick={(e) => { stopMobileClick(e); onCompare(article); }} className="btn-primary btn-full-width" title={`Compare with ${article.clusterCount - 1} other articles`}>Compare Coverage ({article.clusterCount})</button>
                </>
              )}
              
              {showReadOnReview && (
                <>
                  <div className="article-actions-top">
                    <button onClick={(e) => { stopMobileClick(e); onShare(article); }} className="btn-secondary" title="Share article link">Share</button>
                    <SaveButton /> 
                  </div>
                  <button onClick={(e) => { stopMobileClick(e); onRead(article); }} className="btn-primary btn-full-width" title="Read the full article on the source's website">Read Article</button>
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
