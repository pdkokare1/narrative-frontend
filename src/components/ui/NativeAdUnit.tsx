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
    <div className={`ad-container ${className || ''}`} style={{ margin: '1rem 0', minHeight: '100px', width: '100%', overflow: 'hidden' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-YOUR_PUBLISHER_ID_HERE" // REPLACE WITH YOUR ID
        data-ad-slot={slotId}
        data-ad-format={format}
        data-ad-layout-key={layoutKey}
        data-full-width-responsive="true"
      />
      <div style={{ textAlign: 'center', fontSize: '10px', color: '#888', marginTop: '4px' }}>
        Advertisement
      </div>
    </div>
  );
};

export default NativeAdUnit;
