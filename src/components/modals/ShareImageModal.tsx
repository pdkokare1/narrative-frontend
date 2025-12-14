// src/components/modals/ShareImageModal.tsx
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import '../../App.css'; 
import './ShareImageModal.css'; 
import { IArticle } from '../../types';

interface ShareImageModalProps {
  article: IArticle | null;
  onClose: () => void;
}

const ShareImageModal: React.FC<ShareImageModalProps> = ({ article, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  if (!article) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setGenerating(true);

    try {
      // 1. Capture the DOM element as a canvas (Scale 3 for High Res)
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, 
        backgroundColor: '#1E1E1E', 
        useCORS: true, 
        logging: false,
        allowTaint: true,
        fontDefinitions: [{
            src: "url('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff')",
            family: 'Inter',
            style: 'normal'
        }]
      });

      // 2. Convert to Blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
            setGenerating(false);
            return;
        }
        
        const file = new File([blob], 'the-gamut-share.png', { type: 'image/png' });

        // A. Try Native Mobile Share
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: article.headline,
              text: `Read the full analysis on The Gamut: ${article.headline}`
            });
            setGenerating(false);
            onClose(); 
            return;
          } catch (err) {
            console.log("Share dismissed", err);
          }
        }

        // B. Fallback: Direct Download
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
      if (lean === 'Left') return '#dc2626';
      if (lean === 'Right') return '#2563eb';
      return '#B38F5F'; // Gold for Center/Default
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="analysis-modal share-modal-base" onClick={e => e.stopPropagation()}>
        
        {/* --- THE CAPTURE CARD --- */}
        <div ref={cardRef} className="share-capture-card">
            
            {/* Header / Logo */}
            <div className="share-card-header">
                <span className="share-logo-text">THE GAMUT</span>
                <span className="share-sub-text">AI ANALYSIS</span>
            </div>

            {/* Headline */}
            <h2 className="share-headline">{article.headline}</h2>

            {/* Summary - Dynamic Border Color kept inline */}
            <p className="share-summary" style={{ borderLeftColor: leanColor(article.politicalLean) }}>
                {article.summary}
            </p>

            {/* Metrics Grid */}
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
            
            {/* Footer */}
            <div className="share-footer">
                Read the full spectrum at <strong>thegamut.in</strong>
            </div>
        </div>

        {/* --- CONTROLS --- */}
        <div className="share-controls">
            <button 
                onClick={onClose}
                className="btn-secondary btn-cancel-share"
            >
                Cancel
            </button>
            <button 
                onClick={handleDownload}
                className="btn-primary btn-download-share"
                disabled={generating}
            >
                {generating ? 'Generating...' : 'Share / Download'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default ShareImageModal;
