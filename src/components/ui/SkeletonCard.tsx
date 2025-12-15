// src/components/ui/SkeletonCard.tsx
import React from 'react';
import './SkeletonCard.css';
import '../../App.css'; // For the global shimmer/pulse animation

const SkeletonCard: React.FC = () => {
  return (
    <div className="skeleton-card">
      {/* Image Placeholder */}
      <div className="skel-image-wrapper">
        <div className="skel-fill skeleton-pulse"></div>
      </div>

      <div className="skel-content">
        {/* Meta Row (Source & Date) */}
        <div className="skel-meta-row">
          <div className="skel-block skel-btn skeleton-pulse" style={{ width: '80px' }}></div>
          <div className="skel-block skel-btn skeleton-pulse" style={{ width: '60px' }}></div>
        </div>

        {/* Headline */}
        <div className="skel-title skel-block skeleton-pulse"></div>
        <div className="skel-title-sub skel-block skeleton-pulse" style={{ width: '80%' }}></div>

        {/* Summary Lines */}
        <div className="skel-line skel-block skeleton-pulse"></div>
        <div className="skel-line skel-block skeleton-pulse"></div>
        <div className="skel-line skel-block skeleton-pulse skel-line-last" style={{ width: '60%' }}></div>

        {/* Footer Actions */}
        <div className="skel-footer">
          <div className="skel-actions-left">
            <div className="skel-icon skel-block skeleton-pulse"></div>
            <div className="skel-icon skel-block skeleton-pulse"></div>
            <div className="skel-icon skel-block skeleton-pulse"></div>
          </div>
          <div className="skel-btn skel-block skeleton-pulse" style={{ width: '80px' }}></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
