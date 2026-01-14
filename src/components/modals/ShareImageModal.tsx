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
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    return `${apiUrl}/share/proxy-image?url=${encodeURIComponent(originalUrl)}`;
  };

  if (!article) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setGenerating(true);

    try {
      // Increased delay to 800ms to ensure fonts and images are fully settled
      await new Promise(resolve => setTimeout(resolve, 800));

      const options: any = {
        scale: 3, 
        backgroundColor: '#1E1E1E', 
        useCORS: true, 
        logging: true, // Enable logging to debug if needed
        allowTaint: false,
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight
      };

      const canvas = await html2canvas(cardRef.current, options);

      canvas.toBlob(async (blob) => {
        if (!blob) {
            console.error("Canvas empty");
            alert("Failed to generate image. Please try again.");
            setGenerating(false);
            return;
        }
        
        const file = new File([blob], 'the-gamut-share.png', { type: 'image/png' });
        
        // Generate link for caption
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const shareLink = `${apiUrl}/share/${article._id}`;
        const shareText = `Read the full analysis on The Gamut:\n${article.headline}\n\n${shareLink}`;

        // Attempt Native Share (Mobile)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: article.headline,
              text: shareText
            });
            setGenerating(false);
            onClose(); 
            return;
          } catch (err) {
            console.warn("Native share dismissed or failed", err);
            // Don't alert here as user might have just cancelled the sheet
          }
        } else {
            // Fallback for Desktop or unsupported browsers
            const link = document.createElement('a');
            link.download = `the-gamut-${article._id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            setGenerating(false);
            onClose();
        }
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
                    onError={(e) => {
                        console.warn("Proxy Image Failed, hiding image to save canvas.");
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
