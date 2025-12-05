// In file: src/components/modals/SmartBriefingModal.js
import React from 'react';
import '../../App.css'; // Uses existing modal styles

function SmartBriefingModal({ article, onClose, onCompare, showTooltip }) {
  if (!article) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const isReview = article.analysisType === 'SentimentOnly';

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="analysis-modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* --- Header --- */}
        <div className="modal-header" style={{ background: 'var(--bg-primary)', borderBottom: 'none', paddingBottom: '0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
            <span style={{ 
              fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', 
              color: 'var(--accent-primary)', fontWeight: '700' 
            }}>
              Smart Briefing
            </span>
            <h2 style={{ fontSize: '20px', lineHeight: '1.4' }}>{article.headline}</h2>
          </div>
          <button className="close-btn" onClick={onClose} title="Close briefing">×</button>
        </div>

        {/* --- Body --- */}
        <div className="modal-content" style={{ padding: '20px 30px' }}>
          
          {/* Metadata Bar */}
          <div style={{ 
            display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '25px', 
            paddingBottom: '15px', borderBottom: '1px solid var(--border-light)',
            fontSize: '12px', color: 'var(--text-secondary)' 
          }}>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{article.source}</span>
            <span>•</span>
            <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
            {!isReview && (
              <>
                <span>•</span>
                <span 
                  title="Bias Score (0-100). Lower is better." 
                  onClick={(e) => showTooltip("Bias Score (0-100). Lower is better.", e)}
                  style={{ cursor: 'help' }}
                >
                  Bias: <span className="accent-text">{article.biasScore}</span>
                </span>
                <span>•</span>
                <span 
                  title="Credibility Grade (A+ to F)" 
                  onClick={(e) => showTooltip("Credibility Grade based on facts and sources.", e)}
                  style={{ cursor: 'help' }}
                >
                  Grade: <span className="accent-text">{article.credibilityGrade}</span>
                </span>
              </>
            )}
          </div>

          {/* AI Summary */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-primary)' }}>
              Executive Summary
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
              {article.summary}
            </p>
          </div>

          {/* Key Findings */}
          {article.keyFindings && article.keyFindings.length > 0 && (
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '15px', color: 'var(--text-primary)' }}>
                Key Findings
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {article.keyFindings.map((finding, i) => (
                  <li key={i} style={{ 
                    display: 'flex', alignItems: 'flex-start', marginBottom: '12px', 
                    fontSize: '13px', lineHeight: '1.5', color: 'var(--text-secondary)' 
                  }}>
                    <span style={{ color: 'var(--accent-primary)', marginRight: '10px', fontWeight: 'bold' }}>•</span>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* --- Footer Actions --- */}
        <div className="modal-footer" style={{ justifyContent: 'space-between', background: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
                <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <button className="btn-secondary">Read Original Source</button>
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
}

export default SmartBriefingModal;
