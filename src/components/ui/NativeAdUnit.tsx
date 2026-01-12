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
        // FIX: Reduced maxHeight further to 300px for a more compact look
        maxHeight: '300px', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        // Optional: Background to match card shape
        background: 'var(--bg-card-flat, #fff)',
        borderRadius: 'var(--radius-sm, 8px)',
        // Ensure it sits at the top and doesn't stretch to fill the row height
        alignSelf: 'flex-start'
      }}
    >
      {/* Label at top */}
      <div style={{ textAlign: 'center', fontSize: '10px', color: '#888', padding: '8px 0 4px 0' }}>
        Advertisement
      </div>
      
      <ins
        className="adsbygoogle"
        style={{ display: 'block', flexGrow: 1 }}
        data-ad-client="ca-pub-YOUR_PUBLISHER_ID_HERE" // REPLACE WITH YOUR ID
        data-ad-slot={slotId}
        data-ad-format={format}
        data-ad-layout-key={layoutKey}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default NativeAdUnit;
