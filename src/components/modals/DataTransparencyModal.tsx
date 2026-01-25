// src/components/modals/DataTransparencyModal.tsx
import React, { useEffect, useState } from 'react';
import './SmartBriefingModal.css'; // Re-use modal styles
import { X, Shield, Eye, EyeOff, BrainCircuit } from 'lucide-react';
import api from '../../services/api';
import Button from '../ui/Button';

interface Props {
  onClose: () => void;
}

interface UserStats {
  topicInterest: Record<string, number>;
  negativeInterest: Record<string, number>;
  topicImpressions?: Record<string, number>; // Added for context
  leanExposure: { Left: number; Center: number; Right: number };
}

const DataTransparencyModal: React.FC<Props> = ({ onClose }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/user-stats')
      .then(res => setStats(res.data)) // Corrected: getUserStats returns object directly, not { data: ... }
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={e => e.stopPropagation()}>
        
        <div className="modal-header">
          <h2><Shield className="inline-icon"/> Data Transparency</h2>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        <div className="modal-body scrollable">
          <p className="transparency-intro">
            We believe in radical transparency. This is the exact data our AI uses to personalize your feed.
            You have the right to know what we know.
          </p>

          {loading ? (
             <div className="loading-spinner">Loading Profile...</div>
          ) : stats ? (
             <div className="transparency-grid">
                
                {/* 1. What You Like */}
                <div className="t-section">
                   <h3><Eye className="inline-icon" size={16}/> Active Interests</h3>
                   <p className="t-desc">Topics you spend time reading.</p>
                   <div className="pill-cloud">
                      {Object.entries(stats.topicInterest || {}).length > 0 ? (
                        Object.entries(stats.topicInterest)
                          .sort(([,a], [,b]) => b - a)
                          .map(([topic, score]) => (
                            <span key={topic} className="t-pill positive" style={{ opacity: Math.min(score/60, 1) + 0.3 }}>
                                {topic}
                            </span>
                          ))
                      ) : (
                        <span className="empty-text">No data yet. Read more articles!</span>
                      )}
                   </div>
                </div>

                {/* 2. What You Ignore */}
                <div className="t-section">
                   <h3><EyeOff className="inline-icon" size={16}/> Negative Filters (Survivorship Bias)</h3>
                   <p className="t-desc">Topics we hide because you see them but rarely click.</p>
                   <div className="pill-cloud">
                      {Object.entries(stats.negativeInterest || {}).length > 0 ? (
                        Object.entries(stats.negativeInterest)
                          .sort(([,a], [,b]) => b - a)
                          .map(([topic, score]) => {
                             // Contextual Data
                             const seen = stats.topicImpressions ? (stats.topicImpressions[topic] || 0) : 0;
                             return (
                                <div key={topic} className="t-pill-wrapper" title={`Seen ${seen} times, rarely clicked.`}>
                                    <span className="t-pill negative">
                                        {topic} <span className="pill-detail">({seen}x)</span>
                                    </span>
                                </div>
                             );
                          })
                      ) : (
                        <span className="empty-text">No negative filters established.</span>
                      )}
                   </div>
                </div>

                {/* 3. Your Political Diet */}
                <div className="t-section">
                   <h3><BrainCircuit className="inline-icon" size={16}/> Political Exposure</h3>
                   <div className="lean-bar-container">
                      <div className="lean-bar left" style={{ flex: stats.leanExposure?.Left || 1 }}>Left</div>
                      <div className="lean-bar center" style={{ flex: stats.leanExposure?.Center || 1 }}>Center</div>
                      <div className="lean-bar right" style={{ flex: stats.leanExposure?.Right || 1 }}>Right</div>
                   </div>
                </div>

             </div>
          ) : (
             <p>Unable to load stats.</p>
          )}

          <div className="modal-footer">
             <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTransparencyModal;
