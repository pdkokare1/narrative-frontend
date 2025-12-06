// In file: src/components/modals/CompareCoverageModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopicTimeline from '../TopicTimeline'; // <--- NEW IMPORT
import '../../App.css'; 
import { getSentimentClass } from '../../utils/helpers'; 

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function CompareCoverageModal({ clusterId, articleTitle, onClose, onAnalyze, showTooltip }) {
  const [clusterData, setClusterData] = useState({ left: [], center: [], right: [], reviews: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline'); // Default to Timeline for better "Story Arc" view

  useEffect(() => {
    const fetchCluster = async () => {
      if (!clusterId) {
          setLoading(false);
          setClusterData({ left: [], center: [], right: [], reviews: [], stats: {} });
          return;
      }
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/cluster/${clusterId}`);
        setClusterData({
            left: response.data.left || [],
            center: response.data.center || [],
            right: response.data.right || [],
            reviews: response.data.reviews || [],
            stats: response.data.stats || {}
        });
        setLoading(false);
      } catch (error) {
        console.error(`Error fetching cluster:`, error);
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
        
        {/* --- TABS --- */}
        <div className="modal-tabs">
          <button className={activeTab === 'timeline' ? 'active' : ''} onClick={() => setActiveTab('timeline')}>Timeline</button>
          <button className={activeTab === 'left' ? 'active' : ''} onClick={() => setActiveTab('left')}>Left ({clusterData.left.length})</button>
          <button className={activeTab === 'center' ? 'active' : ''} onClick={() => setActiveTab('center')}>Center ({clusterData.center.length})</button>
          <button className={activeTab === 'right' ? 'active' : ''} onClick={() => setActiveTab('right')}>Right ({clusterData.right.length})</button>
          <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>Opinions ({clusterData.reviews.length})</button>
        </div>

        <div className="modal-body">
          {loading ? ( <div className="loading-container" style={{ minHeight: '200px' }}><div className="spinner"></div><p>Loading coverage...</p></div> )
          : totalArticles === 0 ? ( <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}><p>No other articles found covering this topic.</p></div> )
          : (
            <>
              {/* --- TIMELINE VIEW --- */}
              {activeTab === 'timeline' && (
                 <div className="perspective-section">
                    <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '15px', borderLeft: '4px solid var(--accent-primary)', paddingLeft: '10px' }}>
                        Story Development
                    </h3>
                    <TopicTimeline clusterData={clusterData} />
                 </div>
              )}

              {/* --- STANDARD VIEWS --- */}
              {activeTab === 'left' && renderArticleGroup(clusterData.left, 'Left', onAnalyze, showTooltip)}
              {activeTab === 'center' && renderArticleGroup(clusterData.center, 'Center', onAnalyze, showTooltip)}
              {activeTab === 'right' && renderArticleGroup(clusterData.right, 'Right', onAnalyze, showTooltip)}
              {activeTab === 'reviews' && renderArticleGroup(clusterData.reviews, 'Opinions', onAnalyze, showTooltip)}
              
              {activeTab !== 'timeline' && clusterData[activeTab]?.length === 0 && ( 
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                      <p>No articles found for the '{activeTab}' perspective.</p>
                  </div> 
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Helper to render article lists ---
function renderArticleGroup(articleList, perspective, onAnalyze, showTooltip) {
  if (!articleList || articleList.length === 0) return null;
  
  return (
    <div className="perspective-section">
      <h3 className={`perspective-title ${perspective.toLowerCase()}`}>{perspective} Perspective</h3>
      {articleList.map(article => {
        const isReview = article.analysisType === 'SentimentOnly';
        return (
          <div key={article._id || article.url} className="coverage-article">
            <div className="coverage-content">
              <a href={article.url} target="_blank" rel="noopener noreferrer"><h4>{article.headline || 'No Headline'}</h4></a>
              <p>{(article.summary || '').substring(0, 150)}...</p>
              <div className="article-scores">
                {!isReview ? (
                  <>
                    <span title="Bias Score" onClick={(e) => showTooltip("Bias Score", e)}>Bias: {article.biasScore != null ? <span className="accent-text">{article.biasScore}</span> : 'N/A'}</span>
                    <span title="Trust Score" onClick={(e) => showTooltip("Trust Score", e)}>Trust: {article.trustScore != null ? <span className="accent-text">{article.trustScore}</span> : 'N/A'}</span>
                  </>
                ) : (
                  <span title="Sentiment" onClick={(e) => showTooltip("Sentiment", e)}>Sentiment: <span className={getSentimentClass(article.sentiment)}>{article.sentiment}</span></span>
                )}
              </div>
              <div className="coverage-actions">
                <a href={article.url} target="_blank" rel="noopener noreferrer" style={{flex: 1}}><button style={{width: '100%'}}>Read Article</button></a>
                {!isReview && ( <button onClick={() => onAnalyze(article)}>View Analysis</button> )}
              </div>
            </div>
            <div className="coverage-image">
              {article.imageUrl ? ( <img src={article.imageUrl} alt="thumbnail" loading="lazy" /> ) : ( <div className="image-placeholder-small">📰</div> )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CompareCoverageModal;
