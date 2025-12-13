// src/components/ui/SkeletonCard.tsx
import React, { useMemo } from 'react';
import '../../App.css'; 

const SkeletonCard: React.FC = () => {
  const lineWidths = useMemo(() => {
    return {
      title1: `${Math.floor(Math.random() * (95 - 85) + 85)}%`, 
      title2: `${Math.floor(Math.random() * (75 - 60) + 60)}%`, 
      summary1: `${Math.floor(Math.random() * (98 - 92) + 92)}%`, 
      summary2: `${Math.floor(Math.random() * (95 - 85) + 85)}%`, 
      summary3: `${Math.floor(Math.random() * (80 - 60) + 60)}%`, 
    };
  }, []);

  return (
    <div className="article-card" style={{ pointerEvents: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="article-image" style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
        <div className="skeleton-pulse" style={{ position: 'absolute', inset: 0, borderRadius: '0' }}></div>
      </div>
      
      <div className="article-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="skeleton-pulse" style={{ height: '16px', width: '60px', marginBottom: '12px', borderRadius: '4px' }}></div>

        <div className="skeleton-pulse" style={{ height: '20px', width: lineWidths.title1, marginBottom: '8px', borderRadius: '4px' }}></div>
        <div className="skeleton-pulse" style={{ height: '20px', width: lineWidths.title2, marginBottom: '20px', borderRadius: '4px' }}></div>
        
        <div className="skeleton-pulse" style={{ height: '12px', width: lineWidths.summary1, marginBottom: '8px', borderRadius: '3px' }}></div>
        <div className="skeleton-pulse" style={{ height: '12px', width: lineWidths.summary2, marginBottom: '8px', borderRadius: '3px' }}></div>
        <div className="skeleton-pulse" style={{ height: '12px', width: lineWidths.summary3, marginBottom: 'auto', borderRadius: '3px' }}></div>

        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border-light)' }}>
           <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
              <div className="skeleton-pulse" style={{ height: '10px', width: '50px', borderRadius: '2px' }}></div>
              <div className="skeleton-pulse" style={{ height: '10px', width: '80px', borderRadius: '2px' }}></div>
           </div>

           <div style={{ display: 'flex', gap: '8px' }}>
              <div className="skeleton-pulse" style={{ height: '32px', flex: 1, borderRadius: '6px' }}></div>
              <div className="skeleton-pulse" style={{ height: '32px', flex: 1, borderRadius: '6px' }}></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
