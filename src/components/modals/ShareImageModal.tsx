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

  const getProxyImageSrc = (originalUrl: string) => {
    if (!originalUrl) return '';
    // Ensure we use the correct environment API URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    return `${apiUrl}/share/proxy-image?url=${encodeURIComponent(originalUrl)}`;
  };

  if (!article) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setGenerating(true);

    try {
      // 1. Wait for render stability
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. Capture Canvas
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // 2x is usually sufficient and faster/smaller than 3x
        backgroundColor: '#1E1E1E', 
        useCORS: true, 
        allowTaint: false,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
            throw new Error("Canvas generation resulted in empty blob");
        }
        
        const file = new File([blob], 'the-gamut-share.png', { type: 'image/png' });
        
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const shareLink = `${apiUrl}/share/${article._id}`;
        const shareText = `Read the full analysis on The Gamut:\n${article.headline}\n\n${shareLink}`;

        // 3. Attempt Share
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
            console.warn("Image share failed or cancelled, falling back to text...", err);
            // Fallback continues below...
          }
        }

        // 4. Fallback 1: Try sharing just TEXT (if image failed)
        if (navigator.share) {
             try {
                await navigator.share({
                    title: article.headline,
                    text: shareText
                });
                setGenerating(false);
                onClose();
                return;
             } catch (textErr) {
                 console.warn("Text share failed", textErr);
             }
        }

        // 5. Fallback 2: Download Image (Desktop/Last Resort)
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
      alert("Could not generate image. Try copying the link instead.");
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
