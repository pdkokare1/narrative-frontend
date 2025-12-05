import React from 'react';
import '../../App.css'; 

function SkeletonCard() {
  return (
    <div className="article-card" style={{ pointerEvents: 'none' }}>
      {/* Image Placeholder */}
      <div className="skeleton-pulse" style={{ 
        width: '100%', 
        height: '170px', 
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-light)' 
      }}></div>
      
      <div className="article-content">
        {/* Headline Lines */}
        <div className="skeleton-pulse" style={{ height: '18px', width: '90%', marginBottom: '10px', borderRadius: '4px' }}></div>
        <div className="skeleton-pulse" style={{ height: '18px', width: '60%', marginBottom: '20px', borderRadius: '4px' }}></div>
        
        {/* Summary Lines */}
        <div className="skeleton-pulse" style={{ height: '12px', width: '100%', marginBottom: '8px', borderRadius: '4px' }}></div>
        <div className="skeleton-pulse" style={{ height: '12px', width: '100%', marginBottom: '8px', borderRadius: '4px' }}></div>
        <div className="skeleton-pulse" style={{ height: '12px', width: '80%', marginBottom: '15px', borderRadius: '4px' }}></div>

        {/* Action Buttons */}
        <div className="article-actions" style={{ marginTop: 'auto' }}>
           <div className="skeleton-pulse" style={{ height: '35px', width: '100%', borderRadius: '6px' }}></div>
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;
