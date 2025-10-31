// In file: src/components/ArticleCard.js
import React from 'react';
import '../App.css'; // For card styles
import { getSentimentClass } from '../utils/helpers'; // <-- IMPORT THE HELPER

function ArticleCard({ article, onCompare, onAnalyze, onShare, onRead, showTooltip }) {

  const isMobile = () => window.innerWidth <= 768;
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

  const stopMobileClick = (e) => { if (isMobile()) { e.stopPropagation(); } };

  // --- getSentimentClass function is now imported from helpers.js ---

  return (
    <div className="article-card">
      <div className="article-image">
        {article.imageUrl ? (
          <img src={article.imageUrl} alt={`Image for ${article.headline}`} onError={handleImageError} loading="lazy" />
        ) : null}
        <div className="image-placeholder" style={{ display: article.imageUrl ? 'none' : 'flex' }}>📰</div>
      </div>
      <div className="article-content">
        <div className="article-content-top">
          <div className="article-headline-link" onClick={(e) => { stopMobileClick(e); onRead(article); }} style={{ cursor: 'pointer' }} title="Read the full article (logs click)">
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
                  <button onClick={(e) => { stopMobileClick(e); onAnalyze(article); }} className="btn-secondary" title="View Detailed Analysis">Analysis</button>
                  <button onClick={(e) => { stopMobileClick(e); onShare(article); }} className="btn-secondary" title="Share article link">Share</button>
                </div>
                <button onClick={(e) => { stopMobileClick(e); onCompare(article); }} className="btn-primary btn-full-width" title={article.clusterCount > 1 ? `Compare with ${article.clusterCount - 1} other articles` : "Find other perspectives"}>{article.clusterCount > 1 ? `Compare Coverage (${article.clusterCount})` : "Compare Coverage"}</button>
              </>
            )}
            {showCompareOnReview && (
              <>
                <button onClick={(e) => { stopMobileClick(e); onShare(article); }} className="btn-secondary btn-full-width" title="Share article link">Share</button>
                <button onClick={(e) => { stopMobileClick(e); onCompare(article); }} className="btn-primary btn-full-width" title={`Compare with ${article.clusterCount - 1} other articles`}>Compare Coverage ({article.clusterCount})</button>
              </>
            )}
            {showReadOnReview && (
              <>
                <button onClick={(e) => { stopMobileClick(e); onShare(article); }} className="btn-secondary btn-full-width" title="Share article link">Share</button>
                <button onClick={(e) => { stopMobileClick(e); onRead(article); }} className="btn-primary btn-full-width" title="Read the full article on the source's website">Read Article</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArticleCard;
