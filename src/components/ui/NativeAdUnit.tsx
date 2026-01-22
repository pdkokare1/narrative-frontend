// src/components/ui/NativeAdUnit.tsx
import React, { useEffect, useRef } from 'react';

interface NativeAdUnitProps {
  slotId: string; // The data-ad-slot ID from AdSense
  format?: 'auto' | 'fluid' | 'rectangle';
  layoutKey?: string; // Required for In-Feed ads
  className?: string;
}

const NativeAdUnit: React.FC<NativeAdUnitProps> = ({ 
  slotId, 
  format = 'fluid', // Default to fluid for In-Feed
  layoutKey,
  className 
}) => {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // Prevent pushing if the ad is already loaded in this slot
    if (adRef.current && adRef.current.innerHTML.trim() !== '') {
      return;
    }

    try {
      // @ts-ignore
      const adsbygoogle = window.adsbygoogle || [];
      adsbygoogle.push({});
    } catch (err) {
      // Ignore "All ins elements... already have ads" errors in React Strict Mode
      console.warn('AdSense push warning:', err);
    }
  }, [slotId]);

  // Use a placeholder if no slotId is provided (development mode)
  if (!slotId) return null;

  return (
    <div 
      className={`ad-container ${className || ''}`} 
      style={{ 
        width: '100%',
        /* RELAXED LAYOUT ENFORCEMENT for AdSense Policy */
        /* Removed 'contain: strict' and 'max-height' to allow ad to resize naturally */
        minHeight: '250px', 
        
        display: 'flex', 
        flexDirection: 'column',
        background: 'var(--bg-card-flat, #fff)',
        borderRadius: 'var(--radius-sm, 8px)',
        border: '1px solid var(--border-light)',
        
        /* Prevent Grid from stretching this item awkwardly */
        alignSelf: 'start',
        flexGrow: 0,
        flexShrink: 0,
        margin: '16px 0' // Add spacing to distinguish from content (Policy Requirement)
      }}
    >
      {/* Label at top - Required by AdSense Policy to distinguish ads */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '10px', 
        color: '#888', 
        padding: '4px 0',
        background: 'rgba(0,0,0,0.02)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        flexShrink: 0
      }}>
        Advertisement
      </div>
      
      <div style={{ flex: 1, width: '100%', display: 'block' }}>
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client="ca-pub-2458153912750862" // CORRECTED: Updated to match index.html
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
