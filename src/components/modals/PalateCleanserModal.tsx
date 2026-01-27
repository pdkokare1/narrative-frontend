// src/components/modals/PalateCleanserModal.tsx
import React from 'react';
import './PalateCleanserModal.css';

interface PalateCleanserModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToPositive?: () => void; // Future hook for "Show me Good News"
}

const PalateCleanserModal: React.FC<PalateCleanserModalProps> = ({ open, onClose, onSwitchToPositive }) => {
  if (!open) return null;

  return (
    <div className="palate-modal-overlay">
      <div className="palate-modal-content">
        <div className="palate-icon">🍃</div>
        <h2>Take a moment.</h2>
        <p>
          We've noticed you've been reading a lot of heavy content lately. 
          Sometimes it helps to take a breath and reset.
        </p>
        
        <div className="palate-actions">
          <button className="btn-primary" onClick={onClose}>
            I'm okay, continue
          </button>
          {onSwitchToPositive && (
            <button className="btn-secondary" onClick={onSwitchToPositive}>
              Show me something lighter
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PalateCleanserModal;
