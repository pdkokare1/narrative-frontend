// src/components/ui/SkeletonCard.tsx
import React, { useMemo } from 'react';
import '../../App.css'; 

const SkeletonCard: React.FC = () => {
  const lineWidths = useMemo(() => ({
    title: `${Math.floor(Math.random() * (90 - 70) + 70)}%`, 
    summary1: `${Math.floor(Math.random() * (98 - 90) + 90)}%`, 
    summary2: `${Math.floor(Math.random() * (95 - 85) + 85)}%`, 
    summary3: `${Math.floor(Math.random() * (80 - 60) + 60)}%`, 
  }), []);

  return (
    <div className="article-card" style={{ pointerEvents: 'none', height: '100%', border: '1px solid var(--border-color)' }}>
      
      {/* 1. Image Placeholder (Taller 200px) */}
      <div className="article-image" style={{ height: '200px', position: 'relative' }}>
        <div className="skeleton-pulse" style={{ position: 'absolute', inset: 0 }}></div>
      </div>
      
      {/* 2. Content */}
      <div className="article-content" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Source & Date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <div className="skeleton-pulse" style={{ height: '10px', width: '80px', borderRadius: '2px' }}></div>
            <div className="skeleton-pulse" style={{ height: '10px', width: '60px', borderRadius: '2px' }}></div>
        </div>

        {/* Headline (Serif style - taller) */}
        <div className="skeleton-pulse" style={{ height: '24px', width: '100%', marginBottom: '8px', borderRadius: '4px' }}></div>
        <div className="skeleton-pulse" style={{ height: '24px', width: lineWidths.title, marginBottom: '20px', borderRadius: '4px' }}></div>
        
        {/* Summary */}
        <div className="skeleton-pulse" style={{ height: '12px', width: lineWidths.summary1, marginBottom: '8px', borderRadius: '2px' }}></div>
        <div className="skeleton-pulse" style={{ height: '12px', width: lineWidths.summary2, marginBottom: '8px', borderRadius: '2px' }}></div>
        <div className="skeleton-pulse" style={{ height: '12px', width: lineWidths.summary3, marginBottom: 'auto', borderRadius: '2px' }}></div>

        {/* Footer Actions */}
        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           
           {/* Left Icons */}
           <div style={{ display: 'flex', gap: '10px' }}>
              <div className="skeleton-pulse" style={{ height: '36px', width: '36px', borderRadius: '50%' }}></div>
              <div className="skeleton-pulse" style={{ height: '36px', width: '36px', borderRadius: '50%' }}></div>
           </div>

           {/* Right Text Button */}
           <div className="skeleton-pulse" style={{ height: '14px', width: '80px', borderRadius: '2px' }}></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
