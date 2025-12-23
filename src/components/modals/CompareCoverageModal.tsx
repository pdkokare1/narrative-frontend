// src/components/modals/CompareCoverageModal.tsx
import React, { useState, useEffect } from 'react';
import TopicTimeline from '../TopicTimeline'; 
import '../../App.css';
import './CompareCoverageModal.css'; // Newly created CSS file
import { getSentimentClass, getOptimizedImageUrl } from '../../utils/helpers';
import { IArticle } from '../../types';
import Button from '../ui/Button';
import { fetchCluster } from '../../services/articleService'; // Use service instead of direct axios

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
    const loadClusterData = async () => {
      if (!clusterId) {
          setLoading(false);
          setClusterData({ left: [], center: [], right: [], reviews: [], stats: {} });
          return;
      }
      try {
        setLoading(true);
        // Using centralized service call
        const response = await fetchCluster(clusterId);
        
        // Ensure we handle potential nulls if the API response is partial
        setClusterData({
            left: response.data.left || [],
            center: response.data.center || [],
            right: response.data.right || [],
            reviews: response.data.reviews || [],
            stats: response.data.stats || {}
        });
      } catch (error) {
        console.error(`Error fetching cluster:`, error);
      } finally {
        setLoading(false);
      }
    };
    loadClusterData();
  }, [clusterId]);

   const totalArticles = (clusterData.left?.length || 0) + (clusterData.center?.length || 0) + (clusterData.right?.length || 0) + (clusterData.reviews?.length || 0);
   
   const handleOverlayClick = (e: React.MouseEvent) => { 
     if (e.target === e.currentTarget) { onClose(); } 
   };

   // --- SPECTRUM BAR COMPONENT ---
   const SpectrumBar = () => {
       if (totalArticles === 0) return null;
       const left = clusterData.left?.length || 0;
       const center = clusterData.center?.length || 0;
       const right = clusterData.right?.length || 0;
       const total = left + center + right || 1; 

       return (
           <div style={{ padding: '0 25px 20px 25px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-light)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 700 }}>
                   <span style={{color: '#CF5C5C'}}>Left Lean</span>
                   <span style={{color: '#D4AF37'}}>Balanced</span>
                   <span style={{color: '#5C8BCF'}}>Right Lean</span>
               </div>
               <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                   {left > 0 && <div style={{ width: `${(left/total)*100}%`, background: '#CF5C5C', transition: 'width 0.5s' }}></div>}
                   {center > 0 && <div style={{ width: `${(center/total)*100}%`, background: '#D4AF37', transition: 'width 0.5s' }}></div>}
                   {right > 0 && <div style={{ width: `${(right/total)*100}%`, background: '#5C8BCF', transition: 'width 0.5s' }}></div>}
               </div>
           </div>
       );
   };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="compare-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px' }}>
            Compare Coverage: "{articleTitle.substring(0, 40)}{articleTitle.length > 40 ? '...' : ''}"
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
          {loading ? ( 
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Gathering coverage from across the web...</p>
            </div> 
          ) : totalArticles === 0 ? ( 
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
                <p style={{ fontSize: '16px', marginBottom: '10px' }}>No related coverage found.</p>
                <p style={{ fontSize: '13px' }}>This might be a unique story or breaking news with limited sources yet.</p>
            </div> 
          ) : (
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
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
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
        const optimizedImg = getOptimizedImageUrl(article.imageUrl, 200);

        return (
          <div key={article._id || article.url} className="coverage-article">
            <div className="coverage-content">
              <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <h4 style={{ fontFamily: 'var(--font-heading)' }}>{article.headline || 'No Headline'}</h4>
              </a>
              <p>{(article.summary || '').substring(0, 150)}...</p>
              
              <div className="article-scores">
                <span className="smart-brief-source" style={{ marginRight: 'auto', color: 'var(--text-secondary)' }}>
                    {article.source}
                </span>
                {!isReview ? (
                  <>
                    <span 
                        style={{ cursor: 'help', borderBottom: '1px dotted' }} 
                        title="Bias Score" 
                        onClick={(e) => showTooltip("Bias Score: 0-100 (Lower is less biased)", e)}
                    >
                        Bias: <span className="accent-text">{article.biasScore}</span>
                    </span>
                    <span 
                        style={{ cursor: 'help', borderBottom: '1px dotted' }}
                        title="Trust Score" 
                        onClick={(e) => showTooltip("Trust Score: Based on factual reporting history", e)}
                    >
                        Trust: <span className="accent-text">{article.trustScore}</span>
                    </span>
                  </>
                ) : (
                  <span title="Sentiment" onClick={(e) => showTooltip("Sentiment Analysis", e)}>
                      Sentiment: <span className={getSentimentClass(article.sentiment)}>{article.sentiment}</span>
                  </span>
                )}
              </div>
              
              <div className="coverage-actions">
                <a href={article.url} target="_blank" rel="noopener noreferrer" style={{flex: 1, textDecoration:'none'}}>
                    <Button variant="secondary" style={{width: '100%', fontSize: '12px', padding: '8px 0'}}>Read Source</Button>
                </a>
                {!isReview && ( 
                    <Button variant="primary" onClick={() => onAnalyze(article)} style={{width: '100%', fontSize: '12px', padding: '8px 0'}}>Deep Analyze</Button>
                )}
              </div>
            </div>
            
            <div className="coverage-image">
              {article.imageUrl ? ( 
                  <img src={optimizedImg || article.imageUrl} alt="thumbnail" loading="lazy" /> 
              ) : ( 
                  <div className="image-placeholder-small">📰</div> 
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CompareCoverageModal;
