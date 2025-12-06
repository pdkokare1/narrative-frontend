// In file: src/components/ui/SkeletonCard.js
import React from 'react';
import '../../App.css'; // Imports the new 'skeleton-pulse' animation class

function SkeletonCard() {
  return (
    <div className="article-card" style={{ pointerEvents: 'none', height: '100%' }}>
      {/* Image Placeholder with Shimmer */}
      <div className="article-image">
        <div className="skeleton-pulse" style={{ 
          width: '100%', 
          height: '100%', 
          borderRadius: '0' 
        }}></div>
      </div>
      
      <div className="article-content">
        {/* Headline Lines */}
        <div className="skeleton-pulse" style={{ height: '20px', width: '95%', marginBottom: '8px' }}></div>
        <div className="skeleton-pulse" style={{ height: '20px', width: '70%', marginBottom: '20px' }}></div>
        
        {/* Meta Line */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
             <div className="skeleton-pulse" style={{ height: '10px', width: '40px' }}></div>
             <div className="skeleton-pulse" style={{ height: '10px', width: '60px' }}></div>
        </div>

        {/* Summary Lines */}
        <div className="skeleton-pulse" style={{ height: '12px', width: '100%', marginBottom: '8px' }}></div>
        <div className="skeleton-pulse" style={{ height: '12px', width: '98%', marginBottom: '8px' }}></div>
        <div className="skeleton-pulse" style={{ height: '12px', width: '90%', marginBottom: '15px' }}></div>

        {/* Action Buttons */}
        <div className="article-actions" style={{ marginTop: 'auto', paddingTop: '15px' }}>
           <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
              <div className="skeleton-pulse" style={{ height: '32px', flex: 1, borderRadius: '6px' }}></div>
              <div className="skeleton-pulse" style={{ height: '32px', flex: 1, borderRadius: '6px' }}></div>
              <div className="skeleton-pulse" style={{ height: '32px', flex: 1, borderRadius: '6px' }}></div>
           </div>
           <div className="skeleton-pulse" style={{ height: '32px', width: '100%', borderRadius: '6px' }}></div>
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;
