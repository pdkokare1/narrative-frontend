// In file: src/components/modals/CompareCoverageModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../App.css'; // For modal styles
import { getSentimentClass } from '../../utils/helpers'; // <-- IMPORT THE HELPER

// Get API URL from environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// --- Compare Coverage Modal ---
function CompareCoverageModal({ clusterId, articleTitle, onClose, onAnalyze, showTooltip }) {
  const [clusterData, setClusterData] = useState({ left: [], center: [], right: [], reviews: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    const fetchCluster = async () => {
      if (!clusterId) {
          console.log("No clusterId provided, showing empty compare.");
          setLoading(false);
          setClusterData({ left: [], center: [], right: [], reviews: [], stats: {} });
          setActiveTab('left');
          return;
      }
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/cluster/${clusterId}`);
        const data = {
            left: response.data.left || [],
            center: response.data.center || [],
            right: response.data.right || [],
            reviews: response.data.reviews || [],
            stats: response.data.stats || {}
        };
        setClusterData(data);
        if (data.left.length > 0) setActiveTab('left');
        else if (data.center.length > 0) setActiveTab('center');
        else if (data.right.length > 0) setActiveTab('right');
        else if (data.reviews.length > 0) setActiveTab('reviews');
        else setActiveTab('left');
        setLoading(false);
      } catch (error) {
        console.error(`❌ Error fetching cluster ${clusterId}:`, error.response ? error.response.data : error.message);
        setLoading(false);
      }
    };
    fetchCluster();
  }, [clusterId]);

   const totalArticles = (clusterData.left?.length || 0) + (clusterData.center?.length || 0) + (clusterData.right?.length || 0) + (clusterData.reviews?.length || 0);
   const handleOverlayClick = (e) => { if (e.target === e.currentTarget) { onClose(); } };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="compare-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Compare Coverage: "{articleTitle.substring(0, 40)}..."</h2>
          <button className="close-btn" onClick={onClose} title="Close comparison">×</button>
        </div>
         <div className="modal-tabs">
          <button className={activeTab === 'left' ? 'active' : ''} onClick={() => setActiveTab('left')}>Left ({clusterData.left.length})</button>
          <button className={activeTab === 'center' ? 'active' : ''} onClick={() => setActiveTab('center')}>Center ({clusterData.center.length})</button>
          <button className={activeTab === 'right' ? 'active' : ''} onClick={() => setActiveTab('right')}>Right ({clusterData.right.length})</button>
          <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>Opinions ({clusterData.reviews.length})</button>
        </div>
        <div className="modal-body">
          {loading ? ( <div className="loading-container" style={{ minHeight: '200px' }}><div className="spinner"></div><p>Loading comparison...</p></div> )
          : totalArticles === 0 ? ( <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}><p>No other articles found covering this topic.</p></div> )
          : (
            <>
              {activeTab === 'left' && renderArticleGroup(clusterData.left, 'Left', onAnalyze, showTooltip)}
              {activeTab === 'center' && renderArticleGroup(clusterData.center, 'Center', onAnalyze, showTooltip)}
              {activeTab === 'right' && renderArticleGroup(clusterData.right, 'Right', onAnalyze, showTooltip)}
              {activeTab === 'reviews' && renderArticleGroup(clusterData.reviews, 'Opinions', onAnalyze, showTooltip)}
              {activeTab && clusterData[activeTab]?.length === 0 && ( <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}><p>No articles found for the '{activeTab}' perspective.</p></div> )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Helper function to render article groups ---
function renderArticleGroup(articleList, perspective, onAnalyze, showTooltip) {
  if (!articleList || articleList.length === 0) return null;
  const isMobile = () => window.innerWidth <= 768;
  const stopMobileClick = (e) => { if (isMobile()) { e.stopPropagation(); } };

  return (
    <div className="perspective-section">
      <h3 className={`perspective-title ${perspective.toLowerCase()}`}>{perspective} Perspective</h3>
      {articleList.map(article => {
        const isReview = article.analysisType === 'SentimentOnly';
        return (
          <div key={article._id || article.url} className="coverage-article">
            <div className="coverage-content">
              <a href={article.url} target="_blank" rel="noopener noreferrer" onClick={stopMobileClick}><h4>{article.headline || 'No Headline'}</h4></a>
              <p>{(article.summary || '').substring(0, 150)}{article.summary && article.summary.length > 150 ? '...' : ''}</p>
              <div className="article-scores">
                {!isReview ? (
                  <>
                    <span title="Bias Score (0-100, lower is less biased)" onClick={(e) => showTooltip("Bias Score (0-100, lower is less biased)", e)}>Bias: {article.biasScore != null ? <span className="accent-text">{article.biasScore}</span> : 'N/A'}</span>
                    <span title="Overall Trust Score (0-100, higher is more trustworthy)" onClick={(e) => showTooltip("Overall Trust Score (0-100, higher is more trustworthy)", e)}>Trust: {article.trustScore != null ? <span className="accent-text">{article.trustScore}</span> : 'N/A'}</span>
                    <span title="Credibility Grade (A+ to F)" onClick={(e) => showTooltip("Credibility Grade (A+ to F)", e)}>Grade: {article.credibilityGrade ? <span className="accent-text">{article.credibilityGrade}</span> : 'N/A'}</span>
                  </>
                ) : (
                  <span title="The article's overall sentiment" onClick={(e) => showTooltip("The article's overall sentiment", e)}>Sentiment: <span className={getSentimentClass(article.sentiment)}>{article.sentiment || 'N/A'}</span></span>
                )}
              </div>
              <div className="coverage-actions">
                <a href={article.url} target="_blank" rel="noopener noreferrer" style={{flex: 1}} onClick={stopMobileClick}><button style={{width: '100%'}} onClick={stopMobileClick}>Read Article</button></a>
                {!isReview && ( <button onClick={(e) => { stopMobileClick(e); onAnalyze(article); }}>View Analysis</button> )}
              </div>
            </div>
            <div className="coverage-image">
              {article.imageUrl ? ( <img src={article.imageUrl} alt="Article thumbnail" loading="lazy" /> ) : ( <div className="image-placeholder-small">📰</div> )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CompareCoverageModal;
