// src/components/ui/SmartImage.tsx
import React, { useState, useEffect } from 'react';
import { getOptimizedImageUrl, generateImageSrcSet } from '../../utils/helpers';
import { getFallbackImage } from '../../utils/constants';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  imageUrl?: string;
  category?: string;
  width?: number;
}

const SmartImage: React.FC<SmartImageProps> = ({ 
  imageUrl, 
  category, 
  width = 600, 
  className, 
  alt, 
  ...props 
}) => {
  // Check if this is an Offline Blob URL (starts with blob:)
  const isOfflineBlob = imageUrl?.startsWith('blob:');

  // Compute initial state
  const fallbackImg = getFallbackImage(category);
  
  // LOGIC CHANGE: If it's a blob, use it directly. Otherwise, optimize it.
  const optimizedSrc = isOfflineBlob 
      ? imageUrl 
      : (getOptimizedImageUrl(imageUrl, width) || fallbackImg);

  // LOGIC CHANGE: Do not generate SrcSet for blobs (they don't support responsive sizing)
  const initialSrcSet = (imageUrl && !isOfflineBlob) 
      ? generateImageSrcSet(imageUrl) 
      : undefined;

  const [src, setSrc] = useState(optimizedSrc);
  const [srcSet, setSrcSet] = useState(initialSrcSet);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Reset when props change
  useEffect(() => {
      const isBlob = imageUrl?.startsWith('blob:');

      const newOptimized = isBlob 
          ? imageUrl 
          : (getOptimizedImageUrl(imageUrl, width) || getFallbackImage(category));
      
      setSrc(newOptimized);
      setSrcSet((imageUrl && !isBlob) ? generateImageSrcSet(imageUrl) : undefined);
      
      setLoaded(false);
      setError(false);
  }, [imageUrl, category, width]);

  const handleError = () => {
      if (!error) {
          setError(true);
          setSrc(getFallbackImage(category));
          setSrcSet(undefined);
      }
  };

  return (
    <img 
        src={src}
        srcSet={srcSet}
        alt={alt || ""}
        className={className}
        onError={handleError}
        onLoad={() => setLoaded(true)}
        loading="lazy"
        style={{ 
            opacity: loaded ? 1 : 0, 
            transition: 'opacity 0.3s ease-in-out',
            ...props.style 
        }}
        {...props}
    />
  );
};

export default SmartImage;
