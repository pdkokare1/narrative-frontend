// In file: src/components/ui/SkeletonCard.js
import React from 'react';
import '../../App.css'; // Imports the 'skeleton-pulse' animation class

function SkeletonCard() {
  return (
    <div className="article-card" style={{ pointerEvents: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Image Placeholder with Shimmer */}
      <div className="article-image" style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
        <div className="skeleton-pulse" style={{ 
          position: 'absolute',
          inset: 0,
          borderRadius: '0' 
        }}></div>
      </div>
      
      <div className="article-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Category Pill Ghost */}
        <div className="skeleton-pulse" style={{ height: '16px', width: '60px', marginBottom: '12px', borderRadius: '4px' }}></div>

        {/* Headline Lines */}
        <div className="skeleton-pulse" style={{ height: '20px', width: '95%', marginBottom: '8px', borderRadius: '4px' }}></div>
        <div className="skeleton-pulse" style={{ height: '20px', width: '75%', marginBottom: '20px', borderRadius: '4px' }}></div>
        
        {/* Summary Lines */}
        <div className="skeleton-pulse" style={{ height: '12px', width: '100%', marginBottom: '8px', borderRadius: '3px' }}></div>
        <div className="skeleton-pulse" style={{ height: '12px', width: '92%', marginBottom: '8px', borderRadius: '3px' }}></div>
        <div className="skeleton-pulse" style={{ height: '12px', width: '96%', marginBottom: 'auto', borderRadius: '3px' }}></div>

        {/* Meta & Actions Area (Bottom) */}
        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border-light)' }}>
           {/* Source & Score placeholders */}
           <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
              <div className="skeleton-pulse" style={{ height: '10px', width: '50px', borderRadius: '2px' }}></div>
              <div className="skeleton-pulse" style={{ height: '10px', width: '80px', borderRadius: '2px' }}></div>
           </div>

           {/* Buttons */}
           <div style={{ display: 'flex', gap: '8px' }}>
              <div className="skeleton-pulse" style={{ height: '32px', flex: 1, borderRadius: '6px' }}></div>
              <div className="skeleton-pulse" style={{ height: '32px', flex: 1, borderRadius: '6px' }}></div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;
