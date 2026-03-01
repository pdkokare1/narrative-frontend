// src/components/modals/ComingSoonModal.tsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({ 
  isOpen, 
  onClose,
  // Default values keep the BottomNav and Header working perfectly without changes
  title = "Studio Upgrade",
  message = "We are currently upgrading the Gamut Radio studio. A richer, personalized audio experience is dropping soon."
}) => {
  
  // NEW: Auto-close timer logic
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000); // Closes automatically after 4 seconds
      
      // Cleanup the timer if the user manually closes it early
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <>
      <style>{`
        .coming-soon-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 99999; padding: 20px;
          animation: fadeIn 0.3s ease-out;
        }
        .coming-soon-content {
          background: var(--bg-elevated, #1a1a1a);
          border: 1px solid var(--border-color, #333);
          border-radius: 20px;
          padding: 30px;
          max-width: 340px;
          width: 100%;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          position: relative;
        }
        .coming-soon-title {
          font-size: 1.4rem; font-family: var(--font-heading, sans-serif);
          color: var(--text-primary, #fff);
          margin-bottom: 12px; font-weight: 700;
        }
        .coming-soon-text {
          font-size: 1rem; color: var(--text-secondary, #aaa);
          line-height: 1.5; margin-bottom: 24px;
        }
        .coming-soon-btn {
          background: var(--accent-primary, #007bff);
          color: var(--bg-primary, #000);
          border: none; padding: 14px 24px;
          border-radius: 30px; font-weight: 700;
          font-size: 1rem; cursor: pointer; width: 100%;
          transition: transform 0.2s ease;
        }
        .coming-soon-btn:active { transform: scale(0.96); }
      `}</style>
      
      <div className="coming-soon-overlay" onClick={onClose}>
        <div className="coming-soon-content" onClick={e => e.stopPropagation()}>
          <h2 className="coming-soon-title">{title}</h2>
          <p className="coming-soon-text">{message}</p>
          <button className="coming-soon-btn" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ComingSoonModal;
