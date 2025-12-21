// src/components/modals/CompareCoverageModal.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopicTimeline from '../TopicTimeline'; 
import '../../App.css'; 
import { getSentimentClass, getOptimizedImageUrl } from '../../utils/helpers';
import { IArticle } from '../../types';
import Button from '../ui/Button'; // New

// FIXED: Used import.meta.env for Vite
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface CompareModalProps {
  clusterId: number | null;
  articleTitle: string;
  onClose: () => void;
  onAnalyze: (article: IArticle) => void;
  showTooltip: (text: string, e: React.MouseEvent) => void;
}

interface ClusterData {
  left: IArticle[];
  center: IArticle[];
  right: IArticle[];
  reviews: IArticle[];
  stats: any;
}

const CompareCoverageModal: React.FC<CompareModalProps> = ({ clusterId, articleTitle, onClose, onAnalyze, showTooltip }) => {
  const [clusterData, setClusterData] = useState<ClusterData>({ left: [], center: [], right: [], reviews: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'left' | 'center' | 'right' | 'reviews'>('timeline'); 

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
   const handleOverlayClick = (e: React.MouseEvent) => { if (e.target === e.currentTarget) { onClose(); } };

   // --- SPECTRUM BAR COMPONENT ---
   const SpectrumBar = () => {
       if (totalArticles === 0) return null;
       const left = clusterData.left.length;
       const center = clusterData.center.length;
       const right = clusterData.right.length;
       const total = left + center + right || 1; 

       return (
           <div style={{ padding: '0 25px 20px 25px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '5px', textTransform: 'uppercase', fontWeight: 700 }}>
                   <span>Left Lean</span>
                   <span>Balanced</span>
                   <span>Right Lean</span>
               </div>
               <div style={{ display: 'flex', height: '6px', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-elevated)' }}>
                   <div style={{ width: `${(left/total)*100}%`, background: '#CF5C5C' }}></div>
                   <div style={{ width: `${(center/total)*100}%`, background: '#D4AF37' }}></div>
                   <div style={{ width: `${(right/total)*100}%`, background: '#5C8BCF' }}></div>
               </div>
           </div>
       );
   };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="compare-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px' }}>
            Compare Coverage: "{articleTitle.substring(0, 40)}..."
          </h2>
          <button className="close-btn" onClick={onClose} title="Close">×</button>
        </div>
        
        {!loading && <SpectrumBar />}

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
              {activeTab === 'timeline' && (
                 <div className="perspective-section">
                    <TopicTimeline clusterData={clusterData} />
                 </div>
              )}

              {activeTab === 'left' && renderArticleGroup(clusterData.left, 'Left', onAnalyze, showTooltip)}
              {activeTab === 'center' && renderArticleGroup(clusterData.center, 'Center', onAnalyze, showTooltip)}
              {activeTab === 'right' && renderArticleGroup(clusterData.right, 'Right', onAnalyze, showTooltip)}
              {activeTab === 'reviews' && renderArticleGroup(clusterData.reviews, 'Opinions', onAnalyze, showTooltip)}
              
              {activeTab !== 'timeline' && (clusterData[activeTab] as IArticle[])?.length === 0 && ( 
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
};

function renderArticleGroup(articleList: IArticle[], perspective: string, onAnalyze: (a: IArticle) => void, showTooltip: (t: string, e: React.MouseEvent) => void) {
  if (!articleList || articleList.length === 0) return null;
  
  return (
    <div className="perspective-section">
      <h3 className={`perspective-title ${perspective.toLowerCase()}`}>{perspective} Perspective</h3>
      {articleList.map(article => {
        const isReview = article.analysisType === 'SentimentOnly';
        const optimizedImg = getOptimizedImageUrl(article.imageUrl, 150);

        return (
          <div key={article._id || article.url} className="coverage-article">
            <div className="coverage-content">
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                  <h4 style={{ fontFamily: 'var(--font-heading)' }}>{article.headline || 'No Headline'}</h4>
              </a>
              <p>{(article.summary || '').substring(0, 150)}...</p>
              <div className="article-scores">
                {!isReview ? (
                  <>
                    <span title="Bias Score" onClick={(e) => showTooltip("Bias Score", e)}>Bias: <span className="accent-text">{article.biasScore}</span></span>
                    <span title="Trust Score" onClick={(e) => showTooltip("Trust Score", e)}>Trust: <span className="accent-text">{article.trustScore}</span></span>
                  </>
                ) : (
                  <span title="Sentiment" onClick={(e) => showTooltip("Sentiment", e)}>Sentiment: <span className={getSentimentClass(article.sentiment)}>{article.sentiment}</span></span>
                )}
              </div>
              <div className="coverage-actions">
                <a href={article.url} target="_blank" rel="noopener noreferrer" style={{flex: 1, textDecoration:'none'}}>
                    <Button variant="secondary" style={{width: '100%', fontSize: '10px'}}>Read</Button>
                </a>
                {!isReview && ( 
                    <Button variant="secondary" onClick={() => onAnalyze(article)} style={{width: '100%', fontSize: '10px'}}>Analyze</Button>
                )}
              </div>
            </div>
            <div className="coverage-image">
              {article.imageUrl ? ( <img src={optimizedImg || article.imageUrl} alt="thumbnail" loading="lazy" /> ) : ( <div className="image-placeholder-small">📰</div> )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CompareCoverageModal;
