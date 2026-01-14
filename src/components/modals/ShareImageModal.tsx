// src/components/modals/ShareImageModal.tsx
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import '../../App.css'; 
import './ShareImageModal.css'; 
import { IArticle } from '../../types';
import Button from '../ui/Button';

interface ShareImageModalProps {
  article: IArticle | null;
  onClose: () => void;
}

const ShareImageModal: React.FC<ShareImageModalProps> = ({ article, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [proxyFailed, setProxyFailed] = useState(false);

  // Helper to generate the proxy URL for the current article image
  const getProxyImageSrc = (originalUrl: string) => {
    if (!originalUrl) return '';
    // FIX: Robust URL and timestamp for cache busting
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '');
    return `${apiBase}/api/share/proxy-image?url=${encodeURIComponent(originalUrl)}&t=${Date.now()}`;
  };

  if (!article) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setGenerating(true);

    try {
      // Small delay to ensure render is stable
      await new Promise(resolve => setTimeout(resolve, 800)); // Increased to 800ms

      const options: any = {
        scale: 3, 
        backgroundColor: '#1E1E1E', 
        useCORS: true, 
        logging: false,
        allowTaint: false, 
        width: cardRef.current.scrollWidth,
        height: cardRef.current.scrollHeight
      };

      const canvas = await html2canvas(cardRef.current, options);

      canvas.toBlob(async (blob) => {
        // Fallback vars
        const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '');
        const shareLink = `${apiBase}/api/share/${article._id}`;
        const shareText = `Read the full analysis on The Gamut:\n${article.headline}\n\n${shareLink}`;

        if (!blob) {
            console.error("Canvas empty, falling back to text");
            // Fallback to text share
            if (navigator.share) navigator.share({ text: shareText });
            setGenerating(false);
            onClose();
            return;
        }
        
        const file = new File([blob], 'the-gamut-share.png', { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              text: shareText
            });
            setGenerating(false);
            onClose(); 
            return;
          } catch (err) {
            console.log("Share dismissed", err);
          }
        }

        // Fallback for Desktop
        const link = document.createElement('a');
        link.download = `the-gamut-${article._id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setGenerating(false);
        onClose();
      }, 'image/png');

    } catch (error) {
      console.error("Image generation failed:", error);
      setGenerating(false);
      alert("Could not generate image. Please try again.");
    }
  };

  const leanColor = (lean: string) => {
      if (lean === 'Left') return '#CF5C5C';
      if (lean === 'Right') return '#5C8BCF';
      return '#D4AF37'; // Gold
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="analysis-modal share-modal-base" onClick={e => e.stopPropagation()}>
        
        {/* --- THE CAPTURE CARD --- */}
        <div ref={cardRef} className="share-capture-card">
            
            <div className="share-card-header">
                <span className="share-logo-text">THE GAMUT</span>
                <span className="share-sub-text">AI ANALYSIS</span>
            </div>

            {/* MAIN IMAGE */}
            {article.imageUrl && !proxyFailed && (
              <div className="share-card-image-container">
                 <img 
                    src={getProxyImageSrc(article.imageUrl || '')} 
                    alt="" 
                    crossOrigin="anonymous" 
                    className="share-card-img"
                    onError={() => {
                        setProxyFailed(true);
                    }}
                 />
              </div>
            )}

            <h2 className="share-headline" style={{ fontFamily: 'Playfair Display, serif' }}>{article.headline}</h2>

            <p className="share-summary" style={{ borderLeftColor: leanColor(article.politicalLean) }}>
                {article.summary}
            </p>

            {article.analysisType === 'Full' && (
                <div className="share-metrics-grid">
                    <div className="share-metric-col">
                        <div className="share-metric-label">Bias Score</div>
                        <div className="share-metric-value">{article.biasScore}<span className="share-metric-sub">/100</span></div>
                    </div>
                    <div className="share-metric-col">
                        <div className="share-metric-label">Reliability</div>
                        <div className="share-metric-value">{article.reliabilityGrade || 'N/A'}</div>
                    </div>
                    <div className="share-metric-col">
                        <div className="share-metric-label">Lean</div>
                        <div 
                            className="share-metric-value" 
                            style={{ color: leanColor(article.politicalLean), fontSize: '11px', marginTop: '3px' }}
                        >
                            {article.politicalLean}
                        </div>
                    </div>
                </div>
            )}
            
            <div className="share-footer">
                Read the full spectrum at <strong>thegamut.in</strong>
            </div>
        </div>

        {/* --- CONTROLS --- */}
        <div className="share-controls">
            <Button 
                onClick={onClose}
                variant="secondary"
                className="btn-cancel-share"
            >
                Cancel
            </Button>
            <Button 
                onClick={handleDownload}
                variant="primary"
                className="btn-download-share"
                isLoading={generating}
            >
                {generating ? 'Generating...' : 'Share / Download'}
            </Button>
        </div>

      </div>
    </div>
  );
};

export default ShareImageModal;
