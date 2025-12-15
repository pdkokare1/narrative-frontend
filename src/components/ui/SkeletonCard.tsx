// src/components/ui/SkeletonCard.tsx
import React from 'react';
import './SkeletonCard.css';
import '../../App.css'; 

const SkeletonCard: React.FC = () => {
  return (
    <div className="skeleton-card">
      {/* Badges Placeholder */}
      <div className="skel-badges">
        <div className="skel-badge skeleton-pulse"></div>
      </div>

      {/* Image Placeholder */}
      <div className="skel-image-wrapper">
        <div className="skel-fill skeleton-pulse"></div>
      </div>

      <div className="skel-content">
        {/* Meta Row */}
        <div className="skel-meta-row">
          <div className="skel-block skeleton-pulse" style={{ width: '80px', height: '10px' }}></div>
          <div className="skel-block skeleton-pulse" style={{ width: '60px', height: '10px' }}></div>
        </div>

        {/* Headline */}
        <div>
            <div className="skel-title skel-block skeleton-pulse"></div>
            <div className="skel-title-sub skel-block skeleton-pulse"></div>
        </div>

        {/* Summary */}
        <div className="skel-summary-block">
            <div className="skel-line skel-block skeleton-pulse"></div>
            <div className="skel-line skel-block skeleton-pulse"></div>
            <div className="skel-line skel-line-short skel-block skeleton-pulse"></div>
        </div>

        {/* Footer */}
        <div className="skel-footer">
          <div className="skel-actions-left">
            <div className="skel-icon skeleton-pulse"></div>
            <div className="skel-icon skeleton-pulse"></div>
            <div className="skel-icon skeleton-pulse"></div>
          </div>
          <div className="skel-text-btn skel-block skeleton-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
