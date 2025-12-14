// src/components/ui/BadgePopup.tsx
import React, { useEffect } from 'react';
import './BadgePopup.css';
import { IBadge } from '../../types';
import useHaptic from '../../hooks/useHaptic';

interface BadgePopupProps {
  badge: IBadge | null;
  onClose: () => void;
}

const BadgePopup: React.FC<BadgePopupProps> = ({ badge, onClose }) => {
  const vibrate = useHaptic();

  useEffect(() => {
    if (badge) {
      vibrate();
      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [badge, onClose, vibrate]);

  if (!badge) return null;

  return (
    <div className="badge-overlay" onClick={onClose}>
      <div className="badge-popup">
        <div className="confetti-container">
            <div className="confetti"></div>
            <div className="confetti"></div>
            <div className="confetti"></div>
            <div className="confetti"></div>
            <div className="confetti"></div>
        </div>
        <div className="badge-icon-large">{badge.icon}</div>
        <h2 className="badge-title">New Badge Unlocked!</h2>
        <h3 className="badge-name">{badge.label}</h3>
        <p className="badge-desc">{badge.description}</p>
        <button className="btn-primary badge-btn" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            Awesome!
        </button>
      </div>
    </div>
  );
};

export default BadgePopup;
