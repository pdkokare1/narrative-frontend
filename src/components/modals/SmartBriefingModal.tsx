// src/components/modals/SmartBriefingModal.tsx
import React from 'react';
import ReactDOM from 'react-dom'; // ADDED: Required for Portal
import '../../App.css'; 
import './SmartBriefingModal.css'; 
import { IArticle } from '../../types';

interface SmartBriefingModalProps {
  article: IArticle | null;
  onClose: () => void;
  onCompare: (article: IArticle) => void;
  showTooltip: (text: string, e: React.MouseEvent) => void;
}

const SmartBriefingModal: React.FC<SmartBriefingModalProps> = ({ article, onClose, onCompare, showTooltip }) => {
  if (!article) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const isReview = article.analysisType === 'SentimentOnly';

  // WRAPPED CONTENT: We assign the JSX to a variable first for clarity
  const modalContent = (
    <div className="modal-overlay smart-brief-overlay" onClick={handleOverlayClick}>
      <div className="analysis-modal smart-brief-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* --- Header --- */}
        <div className="modal-header smart-brief-header">
          <div className="smart-brief-header-content">
            <span className="smart-brief-label">Smart Briefing</span>
            <h2 className="smart-brief-title">{article.headline}</h2>
          </div>
          <button className="close-btn" onClick={onClose} title="Close briefing">×</button>
        </div>

        {/* --- Body --- */}
        <div className="modal-content smart-brief-body">
          
          {/* Metadata Bar */}
          <div className="smart-brief-meta">
            <span className="smart-brief-source">{article.source}</span>
            <span>•</span>
            <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
            {!isReview && (
              <>
                <span>•</span>
                <span 
                  className="clickable"
                  title="Bias Score (0-100). Lower is better." 
                  onClick={(e) => showTooltip("Bias Score (0-100). Lower is better.", e)}
                >
                  Bias {article.biasScore}
                </span>
                <span>•</span>
                <span 
                  className="clickable"
                  title="Credibility Grade (A+ to F)" 
                  onClick={(e) => showTooltip("Credibility Grade based on facts and sources.", e)}
                >
                  Grade {article.credibilityGrade}
                </span>
              </>
            )}
          </div>

          {/* Key Findings - Now the primary content */}
          {article.keyFindings && article.keyFindings.length > 0 && (
            <div className="smart-brief-findings-box">
              <h3 className="smart-brief-section-title">Key Findings</h3>
              <ul className="smart-brief-list">
                {article.keyFindings.map((finding, i) => (
                  <li key={i} className="smart-brief-list-item">
                    <span className="smart-brief-bullet">0{i+1}</span>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* --- Footer Actions --- */}
        <div className="modal-footer smart-brief-footer">
            <div className="smart-brief-actions-left">
                <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', width: '100%' }}>
                    <button className="btn-secondary btn-full-width">Read Original Source</button>
                </a>
            </div>
            
            <button 
                onClick={() => { onClose(); onCompare(article); }} 
                className="btn-primary"
            >
                Compare Coverage ({article.clusterCount || 1})
            </button>
        </div>
      </div>
    </div>
  );

  // CHANGED: Use Portal to render outside the parent hierarchy
  return ReactDOM.createPortal(modalContent, document.body);
};

export default SmartBriefingModal;
