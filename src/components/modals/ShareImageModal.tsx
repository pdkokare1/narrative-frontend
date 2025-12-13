// src/components/modals/ShareImageModal.tsx
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import '../../App.css'; 
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
      // 1. Capture the DOM element as a canvas
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // High resolution (Retina)
        backgroundColor: '#1E1E1E', // Force dark background
        useCORS: true, 
        logging: false
      });

      // 2. Convert to Blob for sharing/downloading
      canvas.toBlob(async (blob) => {
        if (!blob) {
            setGenerating(false);
            return;
        }
        
        const file = new File([blob], 'the-gamut-share.png', { type: 'image/png' });

        // A. Try Native Mobile Share (Instagram/WhatsApp)
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

        // B. Fallback: Direct Download (Desktop)
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
      <div className="analysis-modal" style={{ maxWidth: '500px', background: 'transparent', boxShadow: 'none', border: 'none' }} onClick={e => e.stopPropagation()}>
        
        {/* --- THE CAPTURE CARD (Visible to user) --- */}
        <div 
            ref={cardRef}
            style={{
                background: 'linear-gradient(145deg, #1E1E1E, #252525)',
                padding: '30px',
                borderRadius: '16px',
                border: '1px solid #333',
                color: '#EAEAEA',
                position: 'relative',
                marginBottom: '20px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
        >
            {/* Header / Logo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#B38F5F', fontWeight: '800' }}>
                    THE GAMUT
                </span>
                <span style={{ fontSize: '10px', color: '#777', fontWeight: '600' }}>
                    AI ANALYSIS
                </span>
            </div>

            {/* Headline */}
            <h2 style={{ 
                fontSize: '22px', lineHeight: '1.3', fontWeight: '700', marginBottom: '15px',
                fontFamily: 'serif' 
            }}>
                {article.headline}
            </h2>

            {/* Summary */}
            <p style={{ 
                fontSize: '14px', lineHeight: '1.6', color: '#B0B0B0', marginBottom: '25px',
                borderLeft: `3px solid ${leanColor(article.politicalLean)}`, paddingLeft: '15px' 
            }}>
                {article.summary}
            </p>

            {/* Metrics Grid */}
            {article.analysisType === 'Full' && (
                <div style={{ display: 'flex', gap: '15px', borderTop: '1px solid #333', paddingTop: '15px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>Bias Score</div>
                        <div style={{ fontSize: '16px', fontWeight: '700' }}>{article.biasScore}<span style={{fontSize:'10px', color:'#555'}}>/100</span></div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>Reliability</div>
                        <div style={{ fontSize: '16px', fontWeight: '700' }}>{article.reliabilityGrade || 'N/A'}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>Lean</div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: leanColor(article.politicalLean), marginTop: '3px' }}>{article.politicalLean}</div>
                    </div>
                </div>
            )}
            
            {/* Footer */}
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '10px', color: '#555' }}>
                Read the full spectrum at <strong>thegamut.in</strong>
            </div>
        </div>

        {/* --- CONTROLS --- */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
                onClick={onClose}
                className="btn-secondary"
                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #555', color: '#FFF' }}
            >
                Cancel
            </button>
            <button 
                onClick={handleDownload}
                className="btn-primary"
                disabled={generating}
                style={{ minWidth: '160px' }}
            >
                {generating ? 'Generating...' : 'Share / Download'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default ShareImageModal;
