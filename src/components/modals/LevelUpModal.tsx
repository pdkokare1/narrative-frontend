// src/components/modals/LevelUpModal.tsx
import React from 'react';
import { Target, TrendingUp, X, Trophy } from 'lucide-react';
import './LevelUpModal.css';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="levelup-overlay">
      <div className="levelup-card">
        <button onClick={onClose} className="levelup-close-btn">
          <X size={20} />
        </button>

        <div className="levelup-header">
          <div className="levelup-icon-pulse">
            <Trophy size={40} className="text-yellow-400" />
          </div>
          <h2>Level Up Unlocked!</h2>
        </div>

        <div className="levelup-content">
          <p className="levelup-message">
            You've crushed your daily goal for <span className="highlight">3 days in a row</span>.
            You are ready for the next challenge.
          </p>

          <div className="levelup-stats">
            <div className="stat-row">
              <span className="label">Current Goal</span>
              <span className="value">15 min/day</span>
            </div>
            <div className="stat-arrow">
               <TrendingUp size={20} />
            </div>
            <div className="stat-row highlight-row">
              <span className="label">New Goal</span>
              <span className="value">20 min/day</span>
            </div>
          </div>

          <p className="levelup-subtext">
            Increasing your goal helps build stronger reading habits and deeper focus.
          </p>
        </div>

        <div className="levelup-actions">
          <button onClick={onClose} className="btn-secondary">
            Keep 15m
          </button>
          <button onClick={onConfirm} className="btn-primary-glow">
            <Target size={18} className="mr-2" />
            Accept Challenge
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal;
