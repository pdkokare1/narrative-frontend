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

  // Helper to generate the proxy URL with Cache Busting
  const getProxyImageSrc = (originalUrl: string) => {
    if (!originalUrl) return '';
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    // Add timestamp to force fresh fetch with CORS headers
    return `${apiUrl}/share/proxy-image?url=${encodeURIComponent(originalUrl)}&t=${Date.now()}`;
  };

  if (!article) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setGenerating(true);

    try {
      // 1. Wait for render stability
      await new Promise(resolve => setTimeout(resolve, 800));

      // 2. Capture Canvas
      // useCORS: true is critical. 
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, 
        backgroundColor: '#1E1E1E', 
        useCORS: true, 
        allowTaint: false,
        logging: false,
        width: cardRef.current.scrollWidth,
        height: cardRef.current.scrollHeight
      });

      canvas.toBlob(async (blob) => {
        // Fallback vars
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const shareLink = `${apiUrl}/share/${article._id}`;
        const shareText = `Read the full analysis on The Gamut:\n${article.headline}\n\n${shareLink}`;

        if (!blob) {
            console.warn("Canvas empty. Falling back to text share.");
            await shareTextFallback(shareText);
            return;
        }
        
        const file = new File([blob], 'the-gamut-share.png', { type: 'image/png' });

        // 3. Attempt Image Share
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              text: shareText
              // Note: We deliberately omit 'title' and 'url' here to maximize compatibility
              // with WhatsApp image sharing.
            });
            setGenerating(false);
            onClose(); 
            return;
          } catch (err) {
            console.warn("Image share cancelled or failed, trying text...", err);
            // Don't return, fall through to text fallback
          }
        }

        // 4. Fallback: Text Share
        await shareTextFallback(shareText);

      }, 'image/png');

    } catch (error) {
      console.error("Image generation failed:", error);
      // Final fallback if canvas completely crashes
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const shareLink = `${apiUrl}/share/${article._id}`;
      const shareText = `Read the full analysis on The Gamut:\n${article.headline}\n\n${shareLink}`;
      await shareTextFallback(shareText);
    }
  };

  const shareTextFallback = async (text: string) => {
      try {
          if (navigator.share) {
              await navigator.share({ text });
          } else {
              // Copy to clipboard if no native share
              await navigator.clipboard.writeText(text);
              alert("Image generation failed, but link copied to clipboard!");
          }
      } catch (e) {
          console.error("Fallback share failed", e);
      }
      setGenerating(false);
      onClose();
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
                    onError={() => setProxyFailed(true)}
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
