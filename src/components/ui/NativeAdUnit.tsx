// src/components/ui/NativeAdUnit.tsx
import React, { useEffect } from 'react';

interface NativeAdUnitProps {
  slotId: string; // The data-ad-slot ID from AdSense
  format?: 'auto' | 'fluid' | 'rectangle';
  layoutKey?: string; // Required for In-Feed ads
  className?: string;
}

const NativeAdUnit: React.FC<NativeAdUnitProps> = ({ 
  slotId, 
  format = 'auto', 
  layoutKey,
  className 
}) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  // Use a placeholder if no slotId is provided (development mode)
  if (!slotId) return null;

  return (
    <div 
      className={`ad-container ${className || ''}`} 
      style={{ 
        width: '100%',
        /* STRICT FIX: Use a fixed height. This physically forces the container size 
           and prevents the Grid row from ever expanding beyond this point due to the ad. */
        height: '350px', 
        minHeight: '350px',
        maxHeight: '350px',
        
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'var(--bg-card-flat, #fff)',
        borderRadius: 'var(--radius-sm, 8px)',
        border: '1px solid var(--border-light)',
        
        /* Ensure it doesn't stretch vertically in the flex container */
        alignSelf: 'flex-start'
      }}
    >
      {/* Label at top */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '10px', 
        color: '#888', 
        padding: '8px 0',
        background: 'rgba(0,0,0,0.02)',
        borderBottom: '1px solid rgba(0,0,0,0.05)'
      }}>
        Advertisement
      </div>
      
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client="ca-pub-YOUR_PUBLISHER_ID_HERE" // REPLACE WITH YOUR ID
          data-ad-slot={slotId}
          data-ad-format={format}
          data-ad-layout-key={layoutKey}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};

export default NativeAdUnit;
