// src/components/ui/SkeletonCard.tsx
import React, { useMemo } from 'react';
import '../../App.css'; 
import './SkeletonCard.css';

const SkeletonCard: React.FC = () => {
  // Randomize widths slightly to feel organic
  const lineWidths = useMemo(() => ({
    title: `${Math.floor(Math.random() * (90 - 70) + 70)}%`, 
    summary1: `${Math.floor(Math.random() * (98 - 90) + 90)}%`, 
    summary2: `${Math.floor(Math.random() * (95 - 85) + 85)}%`, 
    summary3: `${Math.floor(Math.random() * (80 - 60) + 60)}%`, 
  }), []);

  return (
    <div className="skeleton-card">
      
      {/* Image */}
      <div className="skel-image-wrapper">
        <div className="skeleton-pulse skel-fill"></div>
      </div>
      
      <div className="skel-content">
        
        {/* Source & Date */}
        <div className="skel-meta-row">
            <div className="skeleton-pulse skel-block" style={{ width: '80px', height: '10px' }}></div>
            <div className="skeleton-pulse skel-block" style={{ width: '60px', height: '10px' }}></div>
        </div>

        {/* Headline */}
        <div className="skeleton-pulse skel-block skel-title"></div>
        <div className="skeleton-pulse skel-block skel-title-sub" style={{ width: lineWidths.title }}></div>
        
        {/* Summary */}
        <div className="skeleton-pulse skel-block skel-line" style={{ width: lineWidths.summary1 }}></div>
        <div className="skeleton-pulse skel-block skel-line" style={{ width: lineWidths.summary2 }}></div>
        <div className="skeleton-pulse skel-block skel-line skel-line-last" style={{ width: lineWidths.summary3 }}></div>

        {/* Footer Actions */}
        <div className="skel-footer">
           <div className="skel-actions-left">
              <div className="skeleton-pulse skel-icon"></div>
              <div className="skeleton-pulse skel-icon"></div>
           </div>
           <div className="skeleton-pulse skel-btn"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
